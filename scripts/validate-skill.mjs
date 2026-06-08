import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  allArtifactSpecs,
  resolveArtifact
} from "../skills/igapyon-miku-repo-bundle/lib/runtime-artifacts.mjs";

const root = process.cwd();
const skillDir = path.join(root, "skills", "igapyon-miku-repo-bundle");
const requiredFiles = [
  "README.md",
  "TODO.md",
  "LICENSE",
  ".gitignore",
  ".github/workflows/release-build.yml",
  "skills/igapyon-miku-repo-bundle/SKILL.md",
  "skills/igapyon-miku-repo-bundle/agents/openai.yaml",
  "skills/igapyon-miku-repo-bundle/lib/runtime-artifacts.mjs",
  "skills/igapyon-miku-repo-bundle/references/INDEX.md",
  "skills/igapyon-miku-repo-bundle/references/upstream.md",
  "skills/igapyon-miku-repo-bundle/references/workflow.md",
  "skills/igapyon-miku-repo-bundle/references/runtime/operations-map.md",
  "skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs",
  "skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-sources-0.5.0.tgz",
  "skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-0.9.0.mjs",
  "skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-sources-0.9.0.tgz",
  "skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1.jar",
  "skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1-sources.jar",
  "workplace/.gitkeep"
];

for (const file of requiredFiles) {
  await access(path.join(root, file));
}

for (const spec of allArtifactSpecs()) {
  await resolveArtifact(root, spec);
}

const skill = await readFile(path.join(skillDir, "SKILL.md"), "utf8");
if (!skill.startsWith("---\n")) {
  throw new Error("SKILL.md must start with YAML frontmatter.");
}

const frontmatterEnd = skill.indexOf("\n---\n", 4);
if (frontmatterEnd === -1) {
  throw new Error("SKILL.md frontmatter must end with ---.");
}

const frontmatter = skill.slice(4, frontmatterEnd);
for (const field of ["name: igapyon-miku-repo-bundle", "description:"]) {
  if (!frontmatter.includes(field)) {
    throw new Error(`SKILL.md frontmatter is missing ${field}`);
  }
}

if (skill.includes("TODO") || skill.includes("TBD")) {
  throw new Error("SKILL.md should not contain TODO/TBD placeholders.");
}

console.log("igapyon-miku-repo-bundle skill skeleton validated.");
