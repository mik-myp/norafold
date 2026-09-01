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

export interface DesktopApi {
  readonly platform: DesktopPlatform;
}
