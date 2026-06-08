import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, realpath } from "node:fs/promises";
import path from "node:path";

export const runtimeArtifacts = {
  repoBundle: {
    role: "repo-bundle",
    backend: "node",
    version: "0.5.0",
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-0.5.0.mjs",
    sha256: "1c02785fad7337ddcf56dd360bd6ab3da5401d477bf613b78bd73d555e01f8cc",
    command: (artifactPath, repoDir, outputDir, options = []) => [
      "node",
      artifactPath,
      repoDir,
      "--output",
      outputDir,
      ...options
    ]
  },
  textBundle: {
    role: "text-bundle",
    backend: "node",
    version: "0.9.0",
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-0.9.0.mjs",
    sha256: "75a9c569fac92eac6564cf3f07ea902d12f37eab3628ff03c9732666dab4a571",
    command: (artifactPath, inputDir, outputDir, options = []) => [
      "node",
      artifactPath,
      "--input",
      inputDir,
      "--output",
      outputDir,
      ...options
    ]
  },
  javaClass2Json: {
    role: "class-index-helper",
    backend: "java",
    version: "0.5.4.1",
    versionOutput: "miku-javaclass2json 0.5.4",
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1.jar",
    sha256: "eb1d01393078b60ea61bb03bd80ea4772d56d6f71fc7a72cea8edba3f57ee600",
    command: (artifactPath, inputPath, outputDir, options = []) => [
      "java",
      "-jar",
      artifactPath,
      "index",
      "--input",
      inputPath,
      "--output",
      outputDir,
      ...options
    ]
  }
};

export const defaultRuntimeBackend = "repoBundle";
export const fallbackRuntimeOrder = ["repoBundle"];

export const sourceArtifacts = {
  repoBundle: {
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-repo-bundle-sources-0.5.0.tgz",
    sha256: "f556988bf775dbb757e33784fdb5df3824a6f09957733217670c87c63484e1eb"
  },
  textBundle: {
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-text-bundle-sources-0.9.0.tgz",
    sha256: "71d234709213bcc77e13d5f2251a0edd4c037a14b8a8dfb33d17f99561690514"
  },
  javaClass2Json: {
    file: "skills/igapyon-miku-repo-bundle/runtime/miku-javaclass2json-0.5.4.1-sources.jar",
    sha256: "c21e07787d1182e07dcde5bea5bbcc0375a79d20503372f71c3c0a25fcc0c40f"
  }
};

export function allArtifactSpecs() {
  return [
    ...Object.values(runtimeArtifacts),
    ...Object.values(sourceArtifacts)
  ];
}

export async function sha256(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

export async function resolveArtifact(root, spec) {
  const artifactPath = path.join(root, spec.file);
  await access(artifactPath);
  const actual = await sha256(artifactPath);
  if (actual !== spec.sha256) {
    throw new Error(`Unexpected sha256 for ${spec.file}: ${actual}`);
  }
  return realpath(artifactPath);
}

export async function resolveRuntime(root, backend) {
  const spec = runtimeArtifacts[backend];
  if (!spec) {
    throw new Error(`Unknown runtime backend: ${backend}`);
  }
  return {
    ...spec,
    path: await resolveArtifact(root, spec)
  };
}

export async function planRuntimeSelection({
  root,
  requestedBackend,
  unavailableBackends = []
} = {}) {
  if (!root) {
    throw new Error("root is required");
  }

  const unavailable = new Set(unavailableBackends);
  const runtimeOrder = requestedBackend
    ? [requestedBackend]
    : fallbackRuntimeOrder;
  const attemptedBackends = [];
  const errors = [];

  for (const backend of runtimeOrder) {
    attemptedBackends.push(backend);

    if (!runtimeArtifacts[backend]) {
      errors.push({ backend, reason: "unknown_runtime_backend" });
      continue;
    }
    if (unavailable.has(backend)) {
      errors.push({ backend, reason: "runtime_unavailable" });
      continue;
    }

    try {
      const runtime = await resolveRuntime(root, backend);
      return {
        mode: "execute",
        selectedBackend: backend,
        attemptedBackends,
        runtime,
        fallback: null,
        error: null
      };
    } catch (error) {
      errors.push({
        backend,
        reason: "runtime_unusable",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    mode: "error",
    selectedBackend: null,
    attemptedBackends,
    runtime: null,
    fallback: null,
    error: {
      reason: "no_cli_runtime_available",
      details: errors
    }
  };
}
