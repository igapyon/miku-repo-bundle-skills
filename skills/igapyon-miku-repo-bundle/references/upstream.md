# Upstream Anchor

This skill is tied to the upstream main application:

- Repository: <https://github.com/igapyon/miku-repo-bundle>
- Compatibility source: release `v0.5.0`
- Runtime artifacts: received
- Current execution pattern: CLI-backed initial skeleton

The repository URL and release tag are the compatibility anchor for the Node
runtime.

- Release: <https://github.com/igapyon/miku-repo-bundle/releases/tag/v0.5.0>
- Asset: `miku-repo-bundle-0.5.0.mjs`
- Asset digest:
  `sha256:1c02785fad7337ddcf56dd360bd6ab3da5401d477bf613b78bd73d555e01f8cc`
- Source asset: `miku-repo-bundle-sources-0.5.0.tgz`
- Source asset digest:
  `sha256:f556988bf775dbb757e33784fdb5df3824a6f09957733217670c87c63484e1eb`

The bundled `miku-text-bundle` dependency runtime is anchored separately.

- Repository: <https://github.com/igapyon/miku-text-bundle>
- Release: <https://github.com/igapyon/miku-text-bundle/releases/tag/v0.9.0>
- Asset: `miku-text-bundle-0.9.0.mjs`
- Asset digest:
  `sha256:75a9c569fac92eac6564cf3f07ea902d12f37eab3628ff03c9732666dab4a571`
- Source asset: `miku-text-bundle-sources-0.9.0.tgz`
- Source asset digest:
  `sha256:71d234709213bcc77e13d5f2251a0edd4c037a14b8a8dfb33d17f99561690514`

The bundled optional class-index helper is anchored separately.

- Repository: <https://github.com/igapyon/miku-javaclass2json-java>
- Release:
  <https://github.com/igapyon/miku-javaclass2json-java/releases/tag/v0.5.4.1>
- Asset: `miku-javaclass2json-0.5.4.1.jar`
- Asset digest:
  `sha256:eb1d01393078b60ea61bb03bd80ea4772d56d6f71fc7a72cea8edba3f57ee600`
- Source asset: `miku-javaclass2json-0.5.4.1-sources.jar`
- Source asset digest:
  `sha256:c21e07787d1182e07dcde5bea5bbcc0375a79d20503372f71c3c0a25fcc0c40f`

`miku-text-bundle-java` is intentionally not bundled in this repository.

## Runtime Artifact Policy

Runtime artifacts are expected under:

```text
skills/igapyon-miku-repo-bundle/runtime/
```

Do not search broadly through the workspace for product runtimes before
checking this declared runtime directory.

## Runtime Smoke Notes

The Node runtime responds to `--version` with `0.5.0`.

Basic command shape:

```text
node skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs <repo> --output <dir> [options]
```

`miku-repo-bundle` calls `miku-text-bundle` on `PATH` while creating the text
bundle files. Skill execution should provide a temporary PATH shim to the
bundled `miku-text-bundle-0.9.0.mjs` artifact.

`miku-javaclass2json-0.5.4.1.jar --version` prints
`miku-javaclass2json 0.5.4`; this is the upstream runtime's observed version
output for the `v0.5.4.1` release artifact.

## Upstream CLI Contract

The received source artifact for `v0.5.0` includes the upstream `README.md`,
TypeScript source, tests, and design notes. The runtime `--help` output
describes this core behavior:

- require a cloned repository path as the positional `<repo>` argument
- require `--output <dir>`
- copy an explicitly supplied jar from `--artifact <jar>` into the final output
  as `<repo-name>-artifact.jar`
- include an existing class index from `--class-index <jsonl>`
- include one or more external documentation directories with repeated
  `--docs <dir>`
- record an expected entry class with `--entry <class>`
- include `src/test/java` when `--include-tests` is provided
- pass `--max-chars` and `--max-input-file-bytes` through to `miku-text-bundle`
- replace an existing output folder only when `--force` is provided
- write `MANIFEST.md`, `text-bundle-000-prompt.md`,
  `text-bundle-001.md` and following parts, and `text-bundle-999-index.md`

The CLI does not build the repository, choose a jar automatically, call
`miku-javaclass2json-java`, upload output to an AI service, or tune size
options by trial and error.
