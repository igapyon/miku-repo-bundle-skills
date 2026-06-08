#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

// cli.js
const CLI_VERSION = "0.5.0";
const DEFAULT_MAX_CHARS = 120000;
const DEFAULT_MAX_INPUT_FILE_BYTES = 1_000_000;
class HelpRequestedError extends Error {
    constructor() {
        super("Help requested.");
        this.name = "HelpRequestedError";
    }
}
class VersionRequestedError extends Error {
    constructor() {
        super("Version requested.");
        this.name = "VersionRequestedError";
    }
}
function readRequiredOptionValue(argv, index, optionName) {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Please specify a value for ${optionName}.`);
    }
    return value;
}
function parsePositiveInteger(value, optionName) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${optionName} must be a positive integer.`);
    }
    return parsed;
}
function parseArgs(argv) {
    const docsDirectories = [];
    const positional = [];
    let outputDirectory;
    let artifactPath;
    let classIndexPath;
    let entryClass;
    let includeTests = false;
    let force = false;
    let verbose = false;
    let maxChars = DEFAULT_MAX_CHARS;
    let maxInputFileBytes = DEFAULT_MAX_INPUT_FILE_BYTES;
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--help" || arg === "-h") {
            throw new HelpRequestedError();
        }
        if (arg === "--version" || arg === "-v") {
            throw new VersionRequestedError();
        }
        if (arg === "--output") {
            outputDirectory = readRequiredOptionValue(argv, index, "--output");
            index += 1;
            continue;
        }
        if (arg === "--artifact") {
            artifactPath = readRequiredOptionValue(argv, index, "--artifact");
            index += 1;
            continue;
        }
        if (arg === "--class-index") {
            classIndexPath = readRequiredOptionValue(argv, index, "--class-index");
            index += 1;
            continue;
        }
        if (arg === "--docs") {
            docsDirectories.push(readRequiredOptionValue(argv, index, "--docs"));
            index += 1;
            continue;
        }
        if (arg === "--entry") {
            entryClass = readRequiredOptionValue(argv, index, "--entry");
            index += 1;
            continue;
        }
        if (arg === "--max-chars") {
            maxChars = parsePositiveInteger(readRequiredOptionValue(argv, index, "--max-chars"), "--max-chars");
            index += 1;
            continue;
        }
        if (arg === "--max-input-file-bytes") {
            maxInputFileBytes = parsePositiveInteger(readRequiredOptionValue(argv, index, "--max-input-file-bytes"), "--max-input-file-bytes");
            index += 1;
            continue;
        }
        if (arg === "--include-tests") {
            includeTests = true;
            continue;
        }
        if (arg === "--force") {
            force = true;
            continue;
        }
        if (arg === "--verbose") {
            verbose = true;
            continue;
        }
        if (arg.startsWith("--")) {
            throw new Error(`Unknown argument: ${arg}`);
        }
        positional.push(arg);
    }
    if (positional.length !== 1) {
        throw new Error("Please specify exactly one repository path.");
    }
    if (!outputDirectory) {
        throw new Error("Please specify --output.");
    }
    return {
        repositoryPath: positional[0],
        outputDirectory,
        artifactPath,
        classIndexPath,
        docsDirectories,
        entryClass,
        includeTests,
        force,
        maxChars,
        maxInputFileBytes,
        verbose,
    };
}
function printHelp() {
    console.log(`Usage:
  miku-repo-bundle <repo> --output <dir> [options]
  miku-repo-bundle --help
  miku-repo-bundle --version

Required:
  <repo>
      Path to a cloned repository to package as reference material.

  --output <dir>
      Final output folder. The folder must not already exist unless --force is
      specified.

Recommended:
  --artifact <jar>
      Copy an existing jar into the final output as <repo-name>-artifact.jar.
      Prefer this option whenever possible. miku-repo-bundle does not build the
      repository or choose a jar automatically.

  --class-index <jsonl>
      Include an existing class-index.jsonl in the text bundle input.
      Generate this before running miku-repo-bundle when class metadata is
      useful. Agent Skill workflows may create it with miku-javaclass2json-java.

Documentation:
  --docs <dir>
      Add an external documentation directory. Repeat this option to include
      multiple directories.

Options:
  --entry <class>
      Record the expected entry class in artifact notes and MANIFEST.md.

  --include-tests
      Include src/test/java in addition to src/main/java.

  --max-chars <number>
      Pass the part size limit to miku-text-bundle. Default: 120000.

  --max-input-file-bytes <number>
      Pass the per-file read limit to miku-text-bundle. Default: 1000000.

  --force
      Replace the selected output folder if it already exists.

  --verbose
      Print collection and subprocess progress.

  --help
      Show this help.

  --version
      Show the CLI version.

Output:
  <output>/
    MANIFEST.md
    text-bundle-000-prompt.md
    text-bundle-001.md
    ...
    text-bundle-999-index.md
    <repo-name>-artifact.jar
                            when --artifact is specified

Notes:
  Source code is folded into text-bundle-001.md and following part files.
  The artifact jar is a binary sidecar and is not included in the text bundle.
  miku-text-bundle must be available on PATH at runtime.
`);
}
function printVersion() {
    console.log(CLI_VERSION);
}
//# sourceMappingURL=cli.js.map

// bundler.js
const DEFAULT_EXCLUDED_DIRECTORIES = new Set([
    ".git",
    ".gradle",
    ".codex",
    ".idea",
    ".vscode",
    "node_modules",
    "target",
    "build",
    "dist",
    "coverage",
    "workplace",
    "tmp",
    "temp",
]);
const ROOT_DOCUMENT_NAMES = new Set(["README.md", "CHANGELOG.md", "CONTRIBUTING.md", "LICENSE"]);
function toPosixPath(value) {
    return value.split(sep).join("/");
}
function compareUtf16CodeUnits(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}
function ensureDirectory(path) {
    mkdirSync(path, { recursive: true });
}
function copyFilePreservingRelative(inputRoot, outputRoot, filePath) {
    const relativePath = toPosixPath(relative(inputRoot, filePath));
    const outputPath = join(outputRoot, relativePath);
    ensureDirectory(dirname(outputPath));
    copyFileSync(filePath, outputPath);
}
function listFilesRecursively(rootPath, startPath) {
    if (!existsSync(startPath)) {
        return [];
    }
    const stat = statSync(startPath);
    if (stat.isFile()) {
        return [startPath];
    }
    if (!stat.isDirectory()) {
        return [];
    }
    const result = [];
    const entries = readdirSync(startPath, { withFileTypes: true }).sort((left, right) => compareUtf16CodeUnits(left.name, right.name));
    for (const entry of entries) {
        const fullPath = join(startPath, entry.name);
        if (entry.isDirectory()) {
            if (DEFAULT_EXCLUDED_DIRECTORIES.has(entry.name)) {
                continue;
            }
            if (toPosixPath(relative(rootPath, fullPath)) === ".mvn/wrapper") {
                continue;
            }
            result.push(...listFilesRecursively(rootPath, fullPath));
        }
        else if (entry.isFile()) {
            result.push(fullPath);
        }
    }
    return result;
}
function copyDirectoryFiles(inputRoot, outputRoot, startPath) {
    const files = listFilesRecursively(inputRoot, startPath).sort((left, right) => compareUtf16CodeUnits(toPosixPath(relative(inputRoot, left)), toPosixPath(relative(inputRoot, right))));
    for (const file of files) {
        copyFilePreservingRelative(inputRoot, outputRoot, file);
    }
    return files.length;
}
function copyRootFileIfExists(repoPath, outputRoot, fileName) {
    const filePath = join(repoPath, fileName);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        return 0;
    }
    copyFilePreservingRelative(repoPath, outputRoot, filePath);
    return 1;
}
function collectRepoDocuments(repoPath, outputRoot) {
    let copied = 0;
    for (const entry of readdirSync(repoPath, { withFileTypes: true }).sort((left, right) => compareUtf16CodeUnits(left.name, right.name))) {
        if (!entry.isFile()) {
            continue;
        }
        if (entry.name.endsWith(".md") || ROOT_DOCUMENT_NAMES.has(entry.name)) {
            copied += copyRootFileIfExists(repoPath, outputRoot, entry.name);
        }
    }
    copied += copyDirectoryFiles(repoPath, outputRoot, join(repoPath, "docs"));
    return copied;
}
function getGitValue(repoPath, args, fallback) {
    try {
        return execFileSync("git", ["-C", repoPath, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || fallback;
    }
    catch {
        return fallback;
    }
}
function readRepoMetadata(repoPath) {
    return {
        name: basename(repoPath),
        branch: getGitValue(repoPath, ["branch", "--show-current"], "unknown"),
        commit: getGitValue(repoPath, ["rev-parse", "HEAD"], "unknown"),
        path: repoPath,
    };
}
function hashFileSha256(filePath) {
    const hash = createHash("sha256");
    hash.update(readFileSync(filePath));
    return hash.digest("hex");
}
function sanitizeFileNamePart(value) {
    const sanitized = value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    return sanitized.length > 0 ? sanitized : "repository";
}
function artifactFileNameForRepo(metadata) {
    return `${sanitizeFileNamePart(metadata.name)}-artifact.jar`;
}
function writeRepoMetadata(workPath, metadata) {
    writeFileSync(join(workPath, "repo-metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}
function writeArtifactNotes(workPath, options, artifactPath, checksum, outputArtifactFileName) {
    const lines = [
        "# Artifact Notes",
        "",
        `\`${outputArtifactFileName}\` is binary reference material copied from an explicitly supplied artifact.`,
        "",
        "## Artifact",
        "",
        `- Source path: \`${artifactPath}\``,
        `- Original file name: \`${basename(artifactPath)}\``,
        `- Output file: \`${outputArtifactFileName}\``,
        `- SHA-256: \`${checksum}\``,
    ];
    if (options.entryClass) {
        lines.push(`- Entry class: \`${options.entryClass}\``);
    }
    lines.push("", "Prefer text bundle contents and class index data before reasoning from the jar.", "");
    writeFileSync(join(workPath, "artifact-notes.md"), lines.join("\n"), "utf8");
    writeFileSync(join(workPath, "artifact.sha256"), `${checksum}  ${outputArtifactFileName}\n`, "utf8");
}
function writeManifest(outputPath, metadata, options, artifactFileName) {
    const artifactPresent = artifactFileName !== undefined;
    const lines = [
        "# Repository Reference Bundle",
        "",
        "This folder is a repository reference bundle.",
        "",
        "## Policy",
        "",
        "- Purpose: reference only",
        "- Modification policy: do not modify files in this bundle",
        "- Primary text entry: `text-bundle-000-prompt.md`",
        artifactPresent ? `- Binary artifact: \`${artifactFileName}\`` : "- Binary artifact: not included",
    ];
    if (options.classIndexPath) {
        lines.push("- Class index: included inside the text bundle");
    }
    if (options.entryClass) {
        lines.push(`- Entry class: \`${options.entryClass}\``);
    }
    lines.push("", "## Repository", "", `- Name: \`${metadata.name}\``, `- Branch: \`${metadata.branch}\``, `- Commit: \`${metadata.commit}\``, "", "## Read Order", "", "1. `MANIFEST.md`", "2. `text-bundle-000-prompt.md`", "3. `text-bundle-001.md` and following text bundle parts", "4. `text-bundle-999-index.md`");
    if (artifactPresent) {
        lines.push(`5. \`${artifactFileName}\`, only when binary-level reference is needed`);
    }
    lines.push("", "## Source Code", "", "Source files are included in `text-bundle-001.md` and following text bundle parts.", "They are not stored as separate source files in this output folder.", "", "Use `text-bundle-999-index.md` to find which text bundle part contains a specific source file.");
    if (artifactPresent) {
        lines.push("", "## Artifact", "", `\`${artifactFileName}\` is binary reference material. Do not modify it.`);
    }
    lines.push("");
    writeFileSync(join(outputPath, "MANIFEST.md"), lines.join("\n"), "utf8");
}
function assertPathIsDirectory(path, label) {
    if (!existsSync(path) || !statSync(path).isDirectory()) {
        throw new Error(`${label} must be an existing directory: ${path}`);
    }
}
function assertPathIsFile(path, label) {
    if (!existsSync(path) || !statSync(path).isFile()) {
        throw new Error(`${label} must be an existing file: ${path}`);
    }
}
function prepareOutputDirectory(outputPath, force) {
    if (existsSync(outputPath)) {
        if (!force) {
            throw new Error(`Output directory already exists. Use --force to replace it: ${outputPath}`);
        }
        rmSync(outputPath, { recursive: true, force: true });
    }
}
function runTextBundle(workPath, outputPath, options) {
    const args = [
        "--input",
        workPath,
        "--output",
        outputPath,
        "--max-chars",
        String(options.maxChars),
        "--max-input-file-bytes",
        String(options.maxInputFileBytes),
    ];
    if (options.verbose) {
        args.push("--verbose");
    }
    const result = spawnSync("miku-text-bundle", args, { encoding: "utf8" });
    if (result.error) {
        throw new Error(`Failed to run miku-text-bundle. Ensure it is available on PATH. ${result.error.message}`);
    }
    if (result.status !== 0) {
        const stderr = result.stderr.trim();
        const stdout = result.stdout.trim();
        throw new Error(`miku-text-bundle failed with exit code ${result.status}.${stderr ? ` stderr: ${stderr}` : ""}${stdout ? ` stdout: ${stdout}` : ""}`);
    }
    if (options.verbose && result.stdout.trim()) {
        console.log(result.stdout.trim());
    }
}
function listTextBundleFiles(outputPath) {
    return readdirSync(outputPath)
        .filter((name) => /^text-bundle-\d{3}(?:-prompt|-index)?\.md$/.test(name) || name === "text-bundle-999-index.md")
        .sort(compareUtf16CodeUnits);
}
function assertTextBundleIncludes(outputPath, requiredNames) {
    if (requiredNames.length === 0) {
        return;
    }
    const bundleFiles = listTextBundleFiles(outputPath);
    const contents = bundleFiles.map((fileName) => readFileSync(join(outputPath, fileName), "utf8")).join("\n");
    const missing = requiredNames.filter((name) => !contents.includes(name));
    if (missing.length > 0) {
        throw new Error(`Required generated file(s) were not included in the text bundle: ${missing.join(", ")}`);
    }
}
function createRepoBundle(options) {
    const repoPath = resolve(options.repositoryPath);
    const outputPath = resolve(options.outputDirectory);
    assertPathIsDirectory(repoPath, "Repository path");
    if (options.artifactPath) {
        assertPathIsFile(resolve(options.artifactPath), "--artifact");
    }
    if (options.classIndexPath) {
        assertPathIsFile(resolve(options.classIndexPath), "--class-index");
    }
    for (const docsPath of options.docsDirectories) {
        assertPathIsDirectory(resolve(docsPath), "--docs");
    }
    prepareOutputDirectory(outputPath, options.force);
    ensureDirectory(dirname(outputPath));
    const workPath = mkdtempSync(join(tmpdir(), "miku-repo-bundle-"));
    try {
        const metadata = readRepoMetadata(repoPath);
        writeRepoMetadata(workPath, metadata);
        const sourceOutput = join(workPath, "source");
        copyDirectoryFiles(repoPath, sourceOutput, join(repoPath, "src", "main", "java"));
        if (options.includeTests) {
            copyDirectoryFiles(repoPath, sourceOutput, join(repoPath, "src", "test", "java"));
        }
        for (const buildFile of ["pom.xml", "build.gradle", "settings.gradle", "gradle.properties"]) {
            copyRootFileIfExists(repoPath, sourceOutput, buildFile);
        }
        collectRepoDocuments(repoPath, join(workPath, "docs", "repo"));
        options.docsDirectories.forEach((docsPath, index) => {
            const resolvedDocsPath = resolve(docsPath);
            const externalName = `${String(index + 1).padStart(2, "0")}-${basename(resolvedDocsPath)}`;
            copyDirectoryFiles(resolvedDocsPath, join(workPath, "docs", "external", externalName), resolvedDocsPath);
        });
        if (options.classIndexPath) {
            copyFileSync(resolve(options.classIndexPath), join(workPath, "class-index.jsonl"));
        }
        let artifactFileName;
        if (options.artifactPath) {
            const artifactPath = resolve(options.artifactPath);
            const checksum = hashFileSha256(artifactPath);
            artifactFileName = artifactFileNameForRepo(metadata);
            writeArtifactNotes(workPath, options, artifactPath, checksum, artifactFileName);
        }
        runTextBundle(workPath, outputPath, options);
        assertTextBundleIncludes(outputPath, [
            "repo-metadata.json",
            ...(options.classIndexPath ? ["class-index.jsonl"] : []),
            ...(options.artifactPath ? ["artifact-notes.md", "artifact.sha256"] : []),
        ]);
        writeManifest(outputPath, metadata, options, artifactFileName);
        if (options.artifactPath) {
            copyFileSync(resolve(options.artifactPath), join(outputPath, artifactFileName ?? artifactFileNameForRepo(metadata)));
        }
        return {
            outputDirectory: outputPath,
            textBundleFiles: listTextBundleFiles(outputPath),
            artifactCopied: artifactFileName !== undefined,
            artifactFileName,
        };
    }
    finally {
        rmSync(workPath, { recursive: true, force: true });
    }
}
//# sourceMappingURL=bundler.js.map

// main.js
function main(argv) {
    try {
        const options = parseArgs(argv);
        const result = createRepoBundle(options);
        const artifact = result.artifactFileName ? `, artifact=${result.artifactFileName}` : "";
        console.log(`completed: ${result.textBundleFiles.length} text bundle file(s), artifactCopied=${result.artifactCopied}${artifact}, output=${result.outputDirectory}`);
        return 0;
    }
    catch (error) {
        if (error instanceof HelpRequestedError) {
            printHelp();
            return 0;
        }
        if (error instanceof VersionRequestedError) {
            printVersion();
            return 0;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error(`error: ${message}`);
        return 1;
    }
}
process.exitCode = main(process.argv.slice(2));
//# sourceMappingURL=main.js.map

export {
  HelpRequestedError,
  VersionRequestedError,
  CLI_VERSION,
  parseArgs,
  printHelp,
  printVersion,
  createRepoBundle,
};
