import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";

const sqliteVecSupportedTargets = new Set(["darwin-arm64", "darwin-x64", "win32-x64", "linux-x64"]);

async function copySqliteVecExtension(
  _forgeConfig: unknown,
  buildPath: string,
  _electronVersion: string,
  targetPlatform: string,
  targetArch: string,
) {
  if (!sqliteVecSupportedTargets.has(`${targetPlatform}-${targetArch}`)) {
    throw new Error(`Unsupported sqlite-vec target: ${targetPlatform}-${targetArch}.`);
  }

  const packagePlatform = targetPlatform === "win32" ? "windows" : targetPlatform;
  const extensionName =
    targetPlatform === "darwin"
      ? "vec0.dylib"
      : targetPlatform === "win32"
        ? "vec0.dll"
        : "vec0.so";
  const packageName = `sqlite-vec-${packagePlatform}-${targetArch}`;
  const sourcePath = path.resolve("node_modules", packageName, extensionName);
  // Electron Packager passes the temporary resources/app directory to this hook.
  // Native extensions must remain beside app.asar so process.resourcesPath can load them.
  const destinationDirectory = path.resolve(buildPath, "..");

  await mkdir(destinationDirectory, { recursive: true });
  await copyFile(sourcePath, path.join(destinationDirectory, extensionName));
}

const config: ForgeConfig = {
  packagerConfig: {
    appBundleId: "com.mikmyp.norafold",
    asar: true,
    // TODO: Add platform-specific application icons when final brand assets are available.
  },

  rebuildConfig: {},

  hooks: {
    packageAfterCopy: copySqliteVecExtension,
  },

  makers: [
    new MakerSquirrel((arch) => ({
      name: `norafold_${arch}`,
      setupExe: `norafold-${arch}-Setup.exe`,
    })),
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({}, ["darwin"]),
    new MakerDeb({}),
    new MakerRpm({}),
  ],

  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "electron/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "electron/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
