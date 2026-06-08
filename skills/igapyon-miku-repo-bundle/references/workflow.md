# miku-repo-bundle Workflow

This workflow prepares an AI-ready repository reference folder using the
TypeScript / Node.js `miku-repo-bundle` CLI and related local tools.

This initial workflow is CLI-backed through received upstream runtime
artifacts. The default runtime backend is `repoBundle`.

## Scratch Workspace

Create temporary files under the repository-local `workplace/` directory. This
includes validation output, generated class indexes, temporary `PATH` shims,
trial bundle outputs, and local inspection artifacts.

Do not write scratch files to the repository root or skill source directories.
Move only intentional project files or release artifacts out of `workplace/`.

## Inspect Repository

Inspect the target repository and report:

- repository path
- detected build files
- likely Java source roots
- likely documentation directories
- likely jar candidates, if any
- whether `miku-text-bundle` is available
- whether `miku-javaclass2json-java` is available

Prefer explicit user-provided paths and commands. If none are supplied, inspect
common repository locations and then use `PATH`.

## Prepare Artifact

If the user supplies a jar, validate that it exists, is a file, and is not empty.

If no jar is supplied, help locate candidates only when useful. Common
candidates include:

- `target/*.jar`
- `build/libs/*.jar`
- distribution or all-in-one jars

If the user explicitly wants a build, run Maven or Gradle outside
`miku-repo-bundle`. State that building is outside the CLI responsibility.

## Prepare Class Index

When an artifact jar is available, the skill may use the bundled
`miku-javaclass2json-java` helper to generate:

```text
workplace/miku-repo-bundle/class-index.jsonl
```

The helper writes several JSONL files. Select or copy the class summary JSONL
needed for the handoff to `workplace/miku-repo-bundle/class-index.jsonl`, then
pass the generated file to `miku-repo-bundle` with:

```text
--class-index workplace/miku-repo-bundle/class-index.jsonl
```

If class index generation fails, report the failure and ask whether to continue
without `--class-index`.

## Create Reference Bundle

Runtime lookup and digest verification are defined in
`lib/runtime-artifacts.mjs` under this skill directory.

Use a command shaped like this:

```bash
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs ./repo \
  --output ./workplace/miku-repo-bundle/repo-reference \
  --artifact ./repo/target/app.jar \
  --class-index ./workplace/miku-repo-bundle/class-index.jsonl \
  --docs ./external-docs
```

Omit options whose inputs are not available.

Provide a temporary `PATH` shim named `miku-text-bundle` that invokes the
bundled `runtime/miku-text-bundle-0.9.0.mjs` artifact before running the full
bundle operation.

Use `--force` only when replacing a known previous output folder.

Tune `--max-chars` and `--max-input-file-bytes` only when the first run reports
size-related problems. Do not guess large limits without a reason.

## Explain Output

After successful creation, summarize:

- output folder
- text bundle files
- artifact sidecar file name
- whether class index was included
- skipped files or warnings from `text-bundle-999-index.md`
- suggested AI handoff prompt

## CLI Contract

`miku-repo-bundle` does:

- collect repository metadata
- collect source files and repository documents
- include external documentation directories
- accept an explicitly supplied jar with `--artifact <jar>`
- copy that jar to the final output as `<repo-name>-artifact.jar`
- accept an explicitly supplied class index with `--class-index <jsonl>`
- generate artifact notes and checksum
- call `miku-text-bundle`
- write `MANIFEST.md`

`miku-repo-bundle` does not:

- build the repository
- choose a jar automatically
- call `miku-javaclass2json-java`
- upload output to an AI service
- tune size options by trial and error
