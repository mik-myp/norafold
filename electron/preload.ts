import { contextBridge } from "electron";
import { isDesktopPlatform, type DesktopApi } from "../src/shared/desktop-api.js";

const platform = process.platform;

if (!isDesktopPlatform(platform)) {
  throw new Error(`Unsupported desktop platform: ${platform}`);
}

const desktopApi = {
  platform,
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("desktop", Object.freeze(desktopApi));
