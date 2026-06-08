import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  planRuntimeSelection,
  resolveRuntime
} from "../skills/igapyon-miku-repo-bundle/lib/runtime-artifacts.mjs";

const ROOT = process.cwd();
const repoName = "miku-repo-bundle-skills";
const skillName = "igapyon-miku-repo-bundle";

test("generated bundle works from an isolated install shape", async () => {
  execFileSync("npm", ["run", "build:bundle"], {
    cwd: ROOT,
    encoding: "utf8"
  });

  const sourceBundle = path.resolve(ROOT, "bundle", repoName);
  const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), `${repoName}-bundle-`));
  fs.cpSync(sourceBundle, isolatedRoot, { recursive: true });

  const installedSkillRoot = path.resolve(isolatedRoot, "skills", skillName);
  assert.equal(fs.existsSync(path.resolve(installedSkillRoot, "SKILL.md")), true);

  const defaultPlan = await planRuntimeSelection({ root: isolatedRoot });
  assert.equal(defaultPlan.selectedBackend, "repoBundle");

  const runtime = await resolveRuntime(isolatedRoot, "repoBundle");
  const version = execFileSync("node", [runtime.path, "--version"], {
    cwd: isolatedRoot,
    encoding: "utf8"
  }).trim();
  assert.equal(version, "0.5.0");

  const textBundle = await resolveRuntime(isolatedRoot, "textBundle");
  const textBundleVersion = execFileSync("node", [textBundle.path, "--version"], {
    cwd: isolatedRoot,
    encoding: "utf8"
  }).trim();
  assert.equal(textBundleVersion, "0.9.0");

  const javaClass2Json = await resolveRuntime(isolatedRoot, "javaClass2Json");
  const javaClass2JsonVersion = execFileSync("java", ["-jar", javaClass2Json.path, "--version"], {
    cwd: isolatedRoot,
    encoding: "utf8"
  }).trim();
  assert.equal(javaClass2JsonVersion, "miku-javaclass2json 0.5.4");
});
