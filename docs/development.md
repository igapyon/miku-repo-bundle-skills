# Development Notes

Checked on 2026-06-08 using `igapyon-miku-soft-developer`.

## Workflow

- Main workflow: `references/40-agent-skills-workflow.md`
- Basic design: `references/miku-soft-basic/miku-soft-40-agentskills-design.md`
- Repository baseline: `igapyon-repo-conventions`

## Upstream Anchor

- Upstream product: `miku-repo-bundle`
- Expected GitHub repository: <https://github.com/igapyon/miku-repo-bundle>
- Compatibility source: release `v0.5.0`

The upstream compatibility source must be pinned before release hardening.

## Sister Reference

The local sister checkout `/Users/igapyon/Documents/git/miku-text-bundle-skills`
was used after the initial scaffold to align runtime artifact placement,
upstream anchoring, runtime digest verification, smoke testing, and release zip
contents.

## Initial Shape Decisions

- Repository name: `miku-repo-bundle-skills`
- Installable skill name: `igapyon-miku-repo-bundle`
- First maturity pattern: CLI-backed workflow with bundled Node.js runtime
- Runtime bundling: `miku-repo-bundle-0.5.0.mjs` and
  `miku-repo-bundle-sources-0.5.0.tgz`; `miku-text-bundle-0.9.0.mjs` and
  `miku-text-bundle-sources-0.9.0.tgz`; `miku-javaclass2json-0.5.4.1.jar` and
  `miku-javaclass2json-0.5.4.1-sources.jar`
- Java version: out of scope
- Explicit exclusion: `miku-text-bundle-java` is not bundled
