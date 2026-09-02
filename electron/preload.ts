import { contextBridge, ipcRenderer } from "electron";
import { isDesktopPlatform, type DesktopApi } from "../src/shared/desktop-api.js";

const platform = process.platform;

if (!isDesktopPlatform(platform)) {
  throw new Error(`Unsupported desktop platform: ${platform}`);
}

const desktopApi = {
  platform,
  getVersion: () => ipcRenderer.invoke("desktop:get-version") as Promise<string>,
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-for-updates"),
  openRelease: () => ipcRenderer.invoke("desktop:open-release"),
  getDatabaseStatus: () => ipcRenderer.invoke("desktop:get-database-status"),
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("desktop", Object.freeze(desktopApi));
