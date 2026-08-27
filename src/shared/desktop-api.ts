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

export interface DesktopApi {
  readonly platform: DesktopPlatform;
}
