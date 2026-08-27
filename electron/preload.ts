import { contextBridge } from "electron";
import type { DesktopApi, DesktopPlatform } from "../src/shared/desktop-api.js";

const desktopApi = {
  platform: process.platform as DesktopPlatform,
} satisfies DesktopApi;

contextBridge.exposeInMainWorld("desktop", Object.freeze(desktopApi));
