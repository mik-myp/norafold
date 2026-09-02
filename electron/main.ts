import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  protocol,
  session,
  shell,
  type IpcMainInvokeEvent,
  type WebContents,
} from "electron";
import log from "electron-log/main";
import started from "electron-squirrel-startup";
import {
  closeDatabase as closeManagedDatabase,
  defaultEmbeddingDimensions,
  getDatabase,
  getSqliteVecExtensionPath,
  initializeDatabase as initializeManagedDatabase,
} from "./database/index.js";
import { appOrigin, appScheme, isTrustedNavigation, resolveRendererRequest } from "./security.js";
import { checkForUpdates, githubReleaseUrl } from "./updates.js";

protocol.registerSchemesAsPrivileged([
  {
    scheme: appScheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: false,
    },
  },
]);

if (started) {
  app.quit();
}

log.initialize();

let isExitingAfterFatalError = false;

function closeDatabase() {
  try {
    closeManagedDatabase();
  } catch (error: unknown) {
    log.warn("Unable to close database", error);
  }
}

function exitAfterFatalError(message: string, error: unknown) {
  log.error(message, error);
  closeDatabase();

  if (!isExitingAfterFatalError) {
    isExitingAfterFatalError = true;
    app.exit(1);
  }
}

process.on("uncaughtException", (error) => {
  exitAfterFatalError("Uncaught exception in the main process", error);
});

process.on("unhandledRejection", (reason) => {
  exitAfterFatalError("Unhandled rejection in the main process", reason);
});

function getRendererRoot() {
  return path.resolve(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`);
}

function registerAppProtocol() {
  const rendererRoot = getRendererRoot();

  protocol.handle(appScheme, async (request) => {
    const resolvedRequest = resolveRendererRequest(rendererRoot, request.url, request.method);
    if (!resolvedRequest.allowed) {
      return new Response(null, { status: resolvedRequest.status });
    }

    const response = await net.fetch(pathToFileURL(resolvedRequest.filePath).toString());
    const headers = new Headers(response.headers);
    headers.set("X-Frame-Options", "DENY");

    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  });
}

function focusWindow(window: BrowserWindow) {
  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
}

function observeWindow(window: BrowserWindow) {
  window.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, url, isMainFrame) => {
      if (isMainFrame && errorCode !== -3) {
        exitAfterFatalError("Renderer failed to load", {
          errorCode,
          errorDescription,
          url,
        });
      }
    },
  );

  window.webContents.on("render-process-gone", (_event, details) => {
    exitAfterFatalError("Renderer process exited", details);
  });

  window.on("unresponsive", () => {
    log.warn("Main window became unresponsive");
  });
}

function secureWebContents(webContents: WebContents) {
  webContents.on("will-navigate", (event, url) => {
    if (!isTrustedNavigation(url, MAIN_WINDOW_VITE_DEV_SERVER_URL)) {
      event.preventDefault();
      log.warn("Blocked renderer navigation", { url });
    }
  });

  webContents.setWindowOpenHandler(({ url }) => {
    log.warn("Blocked renderer window request", { url });
    return { action: "deny" };
  });
}

function assertTrustedIpcSender(event: IpcMainInvokeEvent) {
  const frameUrl = event.senderFrame?.url;
  if (!frameUrl || !isTrustedNavigation(frameUrl, MAIN_WINDOW_VITE_DEV_SERVER_URL)) {
    throw new Error("Blocked IPC request from an untrusted frame.");
  }
}

function registerIpcHandlers() {
  ipcMain.handle("desktop:get-version", (event) => {
    assertTrustedIpcSender(event);
    return app.getVersion();
  });

  ipcMain.handle("desktop:check-for-updates", async (event) => {
    assertTrustedIpcSender(event);
    const result = await checkForUpdates(app.getVersion(), (input, init) => net.fetch(input, init));
    if (result.status === "error") {
      log.warn("Update check failed", { code: result.code });
    }

    return result;
  });

  ipcMain.handle("desktop:open-release", async (event) => {
    assertTrustedIpcSender(event);
    try {
      await shell.openExternal(githubReleaseUrl);
    } catch (error: unknown) {
      log.warn("Unable to open GitHub Release", error);
      throw error;
    }
  });

  ipcMain.handle("desktop:get-database-status", (event) => {
    assertTrustedIpcSender(event);
    return getDatabase().status;
  });
}

function initializeApplicationDatabase() {
  const location = path.join(app.getPath("userData"), "norafold.sqlite");
  initializeManagedDatabase({
    location,
    embeddingDimensions: defaultEmbeddingDimensions,
    extensionPath: getSqliteVecExtensionPath({
      packaged: app.isPackaged,
      resourcesPath: process.resourcesPath,
    }),
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  secureWebContents(mainWindow.webContents);
  observeWindow(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL).catch((error: unknown) => {
      exitAfterFatalError("Unable to load the development renderer", error);
    });
  } else {
    void mainWindow.loadURL(`${appOrigin}/index.html`).catch((error: unknown) => {
      exitAfterFatalError("Unable to load the packaged renderer", error);
    });
  }

  return mainWindow;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      focusWindow(mainWindow);
    }
  });

  void app
    .whenReady()
    .then(() => {
      session.defaultSession.setPermissionCheckHandler(() => false);
      session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        callback(false);
      });

      if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        registerAppProtocol();
      }

      initializeApplicationDatabase();
      registerIpcHandlers();
      createWindow();

      app.on("activate", () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          focusWindow(mainWindow);
        } else {
          createWindow();
        }
      });
    })
    .catch((error: unknown) => {
      exitAfterFatalError("Unable to initialize the application", error);
    });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  closeDatabase();
});
