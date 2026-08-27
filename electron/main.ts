import path from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, net, protocol, session, type WebContents } from "electron";
import log from "electron-log/main";
import started from "electron-squirrel-startup";

const appScheme = "app";
const appHost = "norafold";
const appOrigin = `${appScheme}://${appHost}`;

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

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception in the main process", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection in the main process", reason);
});

function getRendererRoot() {
  return path.resolve(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}`);
}

function registerAppProtocol() {
  const rendererRoot = getRendererRoot();

  protocol.handle(appScheme, async (request) => {
    const requestUrl = new URL(request.url);
    if (requestUrl.host !== appHost || (request.method !== "GET" && request.method !== "HEAD")) {
      return new Response(null, { status: 403 });
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      return new Response(null, { status: 400 });
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(rendererRoot, relativePath);
    const pathFromRoot = path.relative(rendererRoot, filePath);

    if (pathFromRoot.startsWith("..") || path.isAbsolute(pathFromRoot)) {
      return new Response(null, { status: 403 });
    }

    const response = await net.fetch(pathToFileURL(filePath).toString());
    const headers = new Headers(response.headers);
    headers.set("X-Frame-Options", "DENY");

    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  });
}

function isTrustedNavigation(url: string) {
  try {
    const parsedUrl = new URL(url);
    const navigationOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return navigationOrigin === new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;
    }

    return navigationOrigin === appOrigin;
  } catch {
    return false;
  }
}

function focusWindow(window: BrowserWindow) {
  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
}

function observeWindow(window: BrowserWindow) {
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, url) => {
    log.error("Renderer failed to load", { errorCode, errorDescription, url });
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    log.error("Renderer process exited", details);
  });

  window.on("unresponsive", () => {
    log.warn("Main window became unresponsive");
  });
}

function secureWebContents(webContents: WebContents) {
  webContents.on("will-navigate", (event, url) => {
    if (!isTrustedNavigation(url)) {
      event.preventDefault();
      log.warn("Blocked renderer navigation", { url });
    }
  });

  webContents.setWindowOpenHandler(({ url }) => {
    log.warn("Blocked renderer window request", { url });
    return { action: "deny" };
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
      log.error("Unable to load the development renderer", error);
    });
  } else {
    void mainWindow.loadURL(`${appOrigin}/index.html`).catch((error: unknown) => {
      log.error("Unable to load the packaged renderer", error);
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

  void app.whenReady().then(() => {
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });

    if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      registerAppProtocol();
    }

    createWindow();

    app.on("activate", () => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        focusWindow(mainWindow);
      } else {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
