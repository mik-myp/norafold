export const desktopPlatforms = [
  "aix",
  "darwin",
  "freebsd",
  "linux",
  "openbsd",
  "sunos",
  "win32",
] as const;

export type DesktopPlatform = (typeof desktopPlatforms)[number];

export function isDesktopPlatform(platform: string): platform is DesktopPlatform {
  return desktopPlatforms.some((desktopPlatform) => desktopPlatform === platform);
}

export type UpdateErrorCode =
  | "invalid-current-version"
  | "invalid-response"
  | "network"
  | "open-release"
  | "rate-limited";

export type UpdateCheckResult =
  | { status: "up-to-date"; currentVersion: string }
  | { status: "available"; currentVersion: string; latestVersion: string }
  | { status: "error"; code: UpdateErrorCode };

export interface DesktopApi {
  readonly platform: DesktopPlatform;
  readonly getVersion: () => Promise<string>;
  readonly checkForUpdates: () => Promise<UpdateCheckResult>;
  readonly openRelease: () => Promise<void>;
  readonly getDatabaseStatus: () => Promise<DatabaseStatus>;
}

export interface DatabaseStatus {
  readonly schemaVersion: number;
  readonly embeddingDimensions: number;
}
