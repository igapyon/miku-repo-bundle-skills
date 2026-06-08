# Operations Map

Use this reference when you need the supported operation list or the preferred
CLI runtime surface for `miku-repo-bundle`.

## Operations

- `inspect`: inspect the target repository and surrounding tool availability
- `class-index`: generate optional class index material from an artifact jar
- `bundle`: create an AI-ready repository reference folder
- `version`: check that the bundled runtime artifact starts and identifies
  itself
- `help`: read the runtime CLI contract

## Runtime Search Order

Prefer the bundled runtime artifact in this repository:

- `skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs`
- `skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-0.9.0.mjs`
- `skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1.jar`

Check the declared path and SHA-256 digest before broad workspace exploration.
The initial skill has a Node.js backend for `miku-repo-bundle`, a bundled
Node.js dependency runtime for `miku-text-bundle`, and an optional Java helper runtime
for class index generation. It intentionally does not bundle
`miku-text-bundle-java`.

Bundled source artifacts are included for upstream reference:

- `skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-sources-0.5.0.tgz`
- `skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-sources-0.9.0.tgz`
- `skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1-sources.jar`

## Preferred Runtime Surface

```bash
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs <repo> --output <outputDir>
```

Recommended optional inputs:

```bash
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs <repo> \
  --output <outputDir> \
  --artifact <jar> \
  --class-index <jsonl> \
  --docs <externalDocs>
```

Meta commands:

```bash
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs --version
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs --help
node skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-0.9.0.mjs --version
java -jar skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1.jar --version
```

## CLI Operation Correspondence

| Agent Skill operation | CLI backend shape | Notes |
| --- | --- | --- |
| `inspect` | no direct CLI call required | Repository/tool inspection is skill workflow, not product assembly. |
| `class-index` | `java -jar runtime/miku-javaclass2json-0.5.4.1.jar index --input <jar> --output <index-dir>` | Optional helper operation before `bundle`. |
| `bundle` | `<repo> --output <dir> [--artifact <jar>] [--class-index <jsonl>] [--docs <dir>]` | Primary repository reference bundle operation. Requires `miku-text-bundle` on `PATH`. |
| `version` | `--version` | Smoke check only. |
| `help` | `--help` | Runtime contract reference. |

## Artifact Roles

- `target_repository`
- `reference_bundle_output_directory`
- `manifest_markdown`
- `bundle_index_markdown`
- `bundle_part_markdown`
- `bundle_prompt_markdown`
- `artifact_jar_sidecar`
- `class_index_jsonl`
- `operation_summary`
- `diagnostics_log`

Do not treat the generated Markdown files, jar sidecar, and class index as
interchangeable. They have different handoff roles and should be reported
separately when summarizing a run.
