import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const ROOT = process.cwd();
const repoName = "miku-repo-bundle-skills";
const skillName = "igapyon-miku-repo-bundle";
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(ROOT, "package.json"), "utf8")
);
const zipPath = path.resolve(ROOT, `bundle/igapyon-${repoName}-${packageJson.version}.zip`);

test("release zip contains installable skill files and excludes development-only files", () => {
  execFileSync("npm", ["run", "build:bundle:zip"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(fs.existsSync(zipPath), true);

  const entries = execFileSync("unzip", ["-Z1", zipPath], {
    cwd: ROOT,
    encoding: "utf8"
  }).trim().split(/\n/).filter(Boolean);

  assertIncludes(entries, `skills/${skillName}/SKILL.md`);
  assertIncludes(entries, `skills/${skillName}/index.json`);
  assertIncludes(entries, `skills/${skillName}/agents/openai.yaml`);
  assertIncludes(entries, `skills/${skillName}/lib/runtime-artifacts.mjs`);
  assertIncludes(entries, `skills/${skillName}/references/INDEX.md`);
  assertIncludes(entries, `skills/${skillName}/references/upstream.md`);
  assertIncludes(entries, `skills/${skillName}/references/workflow.md`);
  assertIncludes(entries, `skills/${skillName}/references/runtime/operations-map.md`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-repo-bundle-0.5.0.mjs`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-repo-bundle-sources-0.5.0.tgz`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-text-bundle-0.9.0.mjs`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-text-bundle-sources-0.9.0.tgz`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-javaclass2json-0.5.4.1.jar`);
  assertIncludes(entries, `skills/${skillName}/runtime/miku-javaclass2json-0.5.4.1-sources.jar`);

  assert.equal(entries.some((entry) => entry.includes(".DS_Store")), false);
  assert.equal(entries.some((entry) => entry.includes(".gitkeep")), false);
  assert.equal(entries.some((entry) => entry.startsWith("tests/")), false);
  assert.equal(entries.some((entry) => entry.startsWith("docs/")), false);
  assert.equal(entries.some((entry) => entry.startsWith(".github/")), false);
  assert.equal(entries.some((entry) => entry.startsWith("bundle/")), false);
  assert.equal(entries.some((entry) => entry.includes("node_modules/")), false);
  assert.equal(entries.some((entry) => entry.startsWith("workplace/")), false);
});

function assertIncludes(entries, expected) {
  assert.ok(entries.includes(expected), `missing zip entry: ${expected}`);
}
