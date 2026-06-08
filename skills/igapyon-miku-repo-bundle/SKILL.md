---
name: igapyon-miku-repo-bundle
description: Use only when the user explicitly names `miku-repo-bundle`, `miku-repo-bundle-skills`, or `igapyon-miku-repo-bundle` for repository reference bundle workflows. Do not auto-activate it for generic repository inspection, Java build, archiving, or AI upload requests.
---

# igapyon-miku-repo-bundle

Use this skill for `miku-repo-bundle` repository reference bundle workflows.

The goal is to help an agent prepare an AI-ready repository reference folder
from a local repository, with source and documentation text bundles and an
optional binary jar sidecar.

## Activation

Start this skill only when at least one of these explicit triggers is present:

- the user names `miku-repo-bundle`
- the user names `miku-repo-bundle-skills`
- the user names `igapyon-miku-repo-bundle`
- the recent conversation is already inside an active `miku-repo-bundle`
  workflow

Without one of these triggers, answer normally or ask a brief clarification if
using this skill would materially change the result.

## Product Boundary

`miku-repo-bundle` is a narrow reference bundle assembler. It collects repository
metadata, source files, repository documents, external documentation
directories, optional jar artifacts, optional class indexes, artifact notes,
checksums, text bundles, and `MANIFEST.md`.

It does not build repositories, choose jars automatically, call
`miku-javaclass2json-java`, upload output to an AI service, or tune size limits
by trial and error.

Keep this skill as a workflow adapter over that CLI contract. Do not duplicate
upstream bundle assembly logic inside the skill.

## Current Status

This initial version has received the Node.js CLI runtime artifact and upstream
source artifact for `miku-repo-bundle` release `v0.5.0`, the Node.js dependency
runtime and source artifact for `miku-text-bundle` release `v0.9.0`, and the
optional Java helper runtime and source artifact for `miku-javaclass2json-java`
release `v0.5.4.1`. The skill remains a thin workflow adapter over upstream
runtimes.

## Required First Checks

1. Read `index.json` to discover the bundled reference files before reading
   larger documents.
2. Read `references/upstream.md`.
3. Read `references/workflow.md`.
4. Confirm the requested target repository, output directory, and options.
5. Use the declared `miku-repo-bundle` Node.js CLI runtime artifact under
   `runtime/` when execution is requested.
6. Provide a temporary `PATH` shim to the bundled `miku-text-bundle` runtime
   before running the full bundle operation.
7. Use bundled `miku-javaclass2json-java` only when class index generation is
   requested or useful.
8. Put temporary files created for this workflow under the repository-local
   `workplace/` directory.

## Core Workflow

1. Inspect the target repository and report the path, build files, likely Java
   source roots, documentation directories, jar candidates, and availability of
   `miku-text-bundle` and `miku-javaclass2json-java`.
2. Prepare an artifact jar only when the user supplies one, or when the user
   asks for help locating candidates such as `target/*.jar` or
   `build/libs/*.jar`.
3. If the user explicitly wants a build, run Maven or Gradle outside
   `miku-repo-bundle` and explain that build behavior is outside the CLI
   responsibility.
4. Generate a class index only when an artifact jar is available and
   `miku-javaclass2json-java` is available.
5. Create the reference bundle with `miku-repo-bundle`, passing `--artifact`,
   `--class-index`, and `--docs` only when those inputs exist.
6. Use `--force` only when replacing a known previous output folder.
7. Tune `--max-chars` and `--max-input-file-bytes` only when the first run
   reports size-related problems.
8. Summarize the output folder, text bundle files, artifact sidecar, class index
   inclusion, skipped files or warnings, and a suggested AI handoff prompt.

Use `workplace/` for scratch files, temporary runtime shims, generated class
indexes, trial outputs, and local inspection artifacts. Do not write temporary
files to the repository root or skill source directories unless they are
intentional tracked project files.

## Runtime Lookup

Prefer runtime paths in this order:

1. user-provided command or path
2. skill-local bundled runtime artifact
3. repository-local `node_modules/.bin` or documented local install
4. `PATH`
5. clear missing-runtime diagnostic

## References

Read these only when needed:

- [index.json](index.json) for machine-readable discovery of bundled Markdown
  and JSON reference files
- [references/INDEX.md](references/INDEX.md) for workflow reference files
- [references/upstream.md](references/upstream.md) for the upstream anchor,
  compatibility source, and runtime artifact policy
- [references/workflow.md](references/workflow.md) for the detailed operational
  workflow
- [references/runtime/operations-map.md](references/runtime/operations-map.md)
  for supported operations, runtime command shapes, and artifact roles
- [references/handoff-prompt.md](references/handoff-prompt.md) for the suggested
  AI handoff prompt
