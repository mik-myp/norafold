import path from "node:path";
import { arch, platform } from "node:process";
import { DatabaseSync } from "node:sqlite";

const supportedSqliteVecTargets = [
  ["darwin", "arm64"],
  ["darwin", "x64"],
  ["win32", "x64"],
  ["linux", "x64"],
] as const;

function getSqliteVecTarget(targetPlatform: string, targetArch: string) {
  const target = supportedSqliteVecTargets.find(
    ([supportedPlatform, supportedArch]) =>
      supportedPlatform === targetPlatform && supportedArch === targetArch,
  );
  if (!target) {
    throw new Error(`Unsupported sqlite-vec target: ${targetPlatform}-${targetArch}.`);
  }
  return target;
}

export function getSqliteVecExtensionPath(options?: {
  readonly packaged?: boolean;
  readonly projectRoot?: string;
  readonly resourcesPath?: string;
}) {
  const [targetPlatform, targetArch] = getSqliteVecTarget(platform, arch);
  const extensionName =
    targetPlatform === "darwin"
      ? "vec0.dylib"
      : targetPlatform === "win32"
        ? "vec0.dll"
        : "vec0.so";

  if (options?.packaged) {
    if (!options.resourcesPath) {
      throw new Error("A resources path is required for a packaged database.");
    }
    return path.join(options.resourcesPath, extensionName);
  }

  const projectRoot = options?.projectRoot ?? process.cwd();
  const packagePlatform = targetPlatform === "win32" ? "windows" : targetPlatform;
  return path.join(
    projectRoot,
    "node_modules",
    `sqlite-vec-${packagePlatform}-${targetArch}`,
    extensionName,
  );
}

export function openSqliteDatabase(
  location: string,
  extensionPath = getSqliteVecExtensionPath(),
  readOnly = false,
) {
  const database = new DatabaseSync(location, {
    allowExtension: true,
    enableForeignKeyConstraints: true,
    timeout: 5_000,
    readOnly,
  });

  try {
    database.loadExtension(extensionPath);
    if (!readOnly) {
      database.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
    }
    return database;
  } catch (error: unknown) {
    database.close();
    throw error;
  }
}
