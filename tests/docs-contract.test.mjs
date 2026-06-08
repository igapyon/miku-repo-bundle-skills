import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const docs = {
  readme: read("README.md"),
  releaseWorkflow: read(".github/workflows/release-build.yml"),
  skill: read("skills/igapyon-miku-repo-bundle/SKILL.md"),
  index: read("skills/igapyon-miku-repo-bundle/references/INDEX.md"),
  workflow: read("skills/igapyon-miku-repo-bundle/references/workflow.md"),
  upstream: read("skills/igapyon-miku-repo-bundle/references/upstream.md"),
  operationsMap: read("skills/igapyon-miku-repo-bundle/references/runtime/operations-map.md")
};

test("documents consistently declare bundled Node operation and optional Java helper scope", () => {
  for (const [name, text] of Object.entries(docs)) {
    assert.match(text, /miku-repo-bundle/, `${name} should mention miku-repo-bundle`);
    assert.doesNotMatch(text, /mcp-only|mcp-preferred/, `${name} must not document MCP backend policies`);
  }

  assert.match(docs.readme, /Node\.js runtime/);
  assert.match(docs.skill, /Node\.js CLI runtime artifact/);
  assert.match(docs.workflow, /default runtime backend is `repoBundle`/);
  assert.match(docs.operationsMap, /optional Java helper runtime/);
  assert.doesNotMatch(docs.readme, /miku-text-bundle-java-.*\.jar/);
});

test("documents expected runtime artifact names and generated output roles", () => {
  for (const artifact of [
    "miku-repo-bundle-0.5.0.mjs",
    "miku-repo-bundle-sources-0.5.0.tgz",
    "miku-text-bundle-0.9.0.mjs",
    "miku-text-bundle-sources-0.9.0.tgz",
    "miku-javaclass2json-0.5.4.1.jar",
    "miku-javaclass2json-0.5.4.1-sources.jar"
  ]) {
    const pattern = new RegExp(escapeRegExp(artifact));
    assert.match(docs.readme, pattern);
    assert.match(docs.upstream, pattern);
    assert.match(docs.operationsMap, pattern);
  }

  for (const role of [
    "manifest_markdown",
    "bundle_index_markdown",
    "bundle_part_markdown",
    "artifact_jar_sidecar",
    "class_index_jsonl"
  ]) {
    assert.match(docs.operationsMap, new RegExp(role));
  }
});

test("reference index links to workflow, upstream, and operations map", () => {
  assert.match(docs.index, /\[workflow\.md\]\(workflow\.md\)/);
  assert.match(docs.index, /\[upstream\.md\]\(upstream\.md\)/);
  assert.match(docs.index, /\[runtime\/operations-map\.md\]\(runtime\/operations-map\.md\)/);
});

test("release workflow verifies declared runtime and uploads versioned bundle zip", () => {
  assert.match(docs.releaseWorkflow, /miku-repo-bundle-0\.5\.0\.mjs/);
  assert.match(docs.releaseWorkflow, /miku-text-bundle-0\.9\.0\.mjs/);
  assert.match(docs.releaseWorkflow, /miku-javaclass2json-0\.5\.4\.1\.jar/);
  assert.match(docs.releaseWorkflow, /npm run build/);
  assert.match(docs.releaseWorkflow, /igapyon-miku-repo-bundle-skills-\$\{\{ steps\.release_version\.outputs\.version \}\}\.zip/);
  assert.match(docs.releaseWorkflow, /softprops\/action-gh-release@v2/);
});

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
