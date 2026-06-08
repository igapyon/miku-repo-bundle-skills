# miku-repo-bundle-skills

Agent Skills package for `miku-repo-bundle`.

This repository packages the `igapyon-miku-repo-bundle` skill. The skill is an
agent-facing workflow adapter over the current TypeScript / Node.js
`miku-repo-bundle` CLI. It prepares AI-ready repository reference folders with
source and documentation text bundles plus an optional binary jar sidecar.

This repository is the `-skills` companion repository for:

- Upstream main application: <https://github.com/igapyon/miku-repo-bundle>
- Agent Skill name: `igapyon-miku-repo-bundle`
- Skill directory: `skills/igapyon-miku-repo-bundle/`
- Current maturity pattern: CLI-backed initial skeleton
- Backend policy: bundled Node.js CLI runtime for `miku-repo-bundle`, bundled
  Node.js dependency runtime for `miku-text-bundle`, and bundled optional Java
  helper runtime for `miku-javaclass2json-java`
- Runtime selection: bundled `miku-repo-bundle` Node.js runtime

The upstream main application compatibility source is `miku-repo-bundle`
release `v0.5.0`. The bundled `miku-text-bundle` dependency runtime is release
`v0.9.0`. The bundled optional `miku-javaclass2json-java` helper runtime is
release `v0.5.4.1`. Keep product semantics in the upstream applications and use
this repository as the agent-facing workflow adapter.

## Current Scope

- bundled Node.js `miku-repo-bundle` CLI runtime artifact
- bundled Node.js `miku-text-bundle` dependency runtime artifact
- bundled optional `miku-javaclass2json-java` helper runtime artifact
- bundled upstream source artifacts
- Node.js `miku-repo-bundle` CLI workflow guidance
- repository inspection checklist
- optional artifact jar validation and selection guidance
- optional class index generation using `miku-javaclass2json-java`
- bundle creation using local `miku-repo-bundle`

The Java version is intentionally out of scope for this phase.

## Repository Layout

- `skills/igapyon-miku-repo-bundle/SKILL.md`: activation and primary operating instructions
- `skills/igapyon-miku-repo-bundle/references/`: detailed workflow and upstream notes
- `skills/igapyon-miku-repo-bundle/runtime/`: local destination for upstream runtime artifacts
- `skills/igapyon-miku-repo-bundle/lib/runtime-artifacts.mjs`: runtime artifact lookup and digest verification
- `scripts/`: local release bundle builders
- `tests/`: bundle shape and isolated install smoke tests
- `docs/`: project notes and shared miku-soft reference link
- `workplace/`: local scratch area, ignored except `.gitkeep`

## Runtime Policy

The first Agent Skills version ships the Node.js CLI runtime artifacts needed
for the main bundle path. Runtime lookup checks the declared skill-local
runtime artifacts and SHA-256 digests before broad workspace exploration.

`miku-repo-bundle` calls `miku-text-bundle` while creating bundle output. Skill
execution should provide a temporary `PATH` shim to the bundled
`miku-text-bundle-0.9.0.mjs` runtime rather than requiring a global install.

`miku-javaclass2json-java` is bundled as an optional helper for generating
class index material before `miku-repo-bundle --class-index`. The
`miku-text-bundle-java` runtime is intentionally not bundled in this repository.

## Local Scratch Policy

Use `workplace/` as the repository-local scratch area for temporary files,
validation output, generated class indexes, temporary `PATH` shims, and local
inspection artifacts created while operating this Agent Skill. The directory is
ignored by Git except for `workplace/.gitkeep`.

Move only intentional project files or release artifacts out of `workplace/`.
Do not place scratch files in the repository root or under the skill directory
unless they are meant to become tracked source, documentation, tests, or runtime
artifacts.

## Runtime Artifacts

The following received artifacts are expected under
`skills/igapyon-miku-repo-bundle/runtime/`:

- `miku-repo-bundle-0.5.0.mjs`
- `miku-repo-bundle-sources-0.5.0.tgz`
- `miku-text-bundle-0.9.0.mjs`
- `miku-text-bundle-sources-0.9.0.tgz`
- `miku-javaclass2json-0.5.4.1.jar`
- `miku-javaclass2json-0.5.4.1-sources.jar`

## Build

```bash
npm test
npm run test:runtime
npm run build:bundle
npm run build:bundle:zip
```

The release zip is generated under `bundle/`.
