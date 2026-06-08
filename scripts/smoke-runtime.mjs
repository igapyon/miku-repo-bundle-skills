import { access, chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  defaultRuntimeBackend,
  resolveRuntime
} from "../skills/igapyon-miku-repo-bundle/lib/runtime-artifacts.mjs";

const root = process.cwd();
const smokeRoot = path.join(root, "workplace", "runtime-smoke-auto");
const shimDir = path.join(smokeRoot, "bin");
const repoDir = path.join(smokeRoot, "repo");
const outputDir = path.join(smokeRoot, "repo-reference");

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      ...options
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}\n${stdout}\n${stderr}`));
      }
    });
  });
}

async function prepareFixture() {
  await rm(smokeRoot, { recursive: true, force: true });
  await mkdir(repoDir, { recursive: true });
  await mkdir(shimDir, { recursive: true });
  await writeFile(
    path.join(repoDir, "README.md"),
    "# Smoke Fixture\n\nhello miku-repo-bundle\n",
    "utf8"
  );
}

const repoBundle = await resolveRuntime(root, defaultRuntimeBackend);
const textBundle = await resolveRuntime(root, "textBundle");
const javaClass2Json = await resolveRuntime(root, "javaClass2Json");

const repoBundleVersion = await runCommand("node", [repoBundle.path, "--version"]);
if (repoBundleVersion.stdout.trim() !== repoBundle.version) {
  throw new Error(`Expected version ${repoBundle.version}, got ${repoBundleVersion.stdout.trim()}`);
}

const textBundleVersion = await runCommand("node", [textBundle.path, "--version"]);
if (textBundleVersion.stdout.trim() !== textBundle.version) {
  throw new Error(`Expected version ${textBundle.version}, got ${textBundleVersion.stdout.trim()}`);
}

const javaClass2JsonVersion = await runCommand("java", ["-jar", javaClass2Json.path, "--version"]);
if (javaClass2JsonVersion.stdout.trim() !== javaClass2Json.versionOutput) {
  throw new Error(`Unexpected miku-javaclass2json version output: ${javaClass2JsonVersion.stdout.trim()}`);
}

await prepareFixture();
const textBundleShim = path.join(shimDir, "miku-text-bundle");
await writeFile(
  textBundleShim,
  `#!/bin/sh\nexec node ${JSON.stringify(textBundle.path)} "$@"\n`,
  "utf8"
);
await chmod(textBundleShim, 0o755);

const [command, ...args] = repoBundle.command(repoBundle.path, repoDir, outputDir);
await runCommand(command, args, {
  env: {
    ...process.env,
    PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ""}`
  }
});

for (const file of [
  "MANIFEST.md",
  "text-bundle-999-index.md",
  "text-bundle-000-prompt.md",
  "text-bundle-001.md"
]) {
  await access(path.join(outputDir, file));
}

const bundle = await readFile(path.join(outputDir, "text-bundle-001.md"), "utf8");
if (!bundle.includes("hello miku-repo-bundle")) {
  throw new Error("Bundle smoke output did not include fixture content.");
}

console.log(`repo-bundle runtime smoke OK: ${outputDir}`);
