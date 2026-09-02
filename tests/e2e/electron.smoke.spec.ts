import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { once } from "node:events";
import { chromium, expect, test } from "@playwright/test";

function getPackagedExecutable() {
  const targetArch = process.env.ELECTRON_TEST_ARCH ?? process.arch;
  const packageDirectory = path.resolve("out", `norafold-${process.platform}-${targetArch}`);

  if (process.platform === "darwin") {
    return path.join(packageDirectory, "norafold.app", "Contents", "MacOS", "norafold");
  }

  return path.join(packageDirectory, process.platform === "win32" ? "norafold.exe" : "norafold");
}

function getPackagedSqliteVecExtension() {
  const targetArch = process.env.ELECTRON_TEST_ARCH ?? process.arch;
  const packageDirectory = path.resolve("out", `norafold-${process.platform}-${targetArch}`);
  const extensionName =
    process.platform === "darwin"
      ? "vec0.dylib"
      : process.platform === "win32"
        ? "vec0.dll"
        : "vec0.so";
  const resourcesDirectory =
    process.platform === "darwin"
      ? path.join(packageDirectory, "norafold.app", "Contents", "Resources")
      : path.join(packageDirectory, "resources");

  return path.join(resourcesDirectory, extensionName);
}

async function getAvailablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  server.close();
  await once(server, "close");

  if (!address || typeof address === "string") {
    throw new Error("Unable to allocate a local debugging port.");
  }

  return address.port;
}

async function waitForDevTools(
  port: number,
  process: ChildProcess,
  getProcessOutput: () => string,
) {
  const endpoint = `http://127.0.0.1:${port}`;

  try {
    await expect
      .poll(
        async () => {
          if (process.exitCode !== null) {
            throw new Error(`Packaged application exited with code ${process.exitCode}.`);
          }

          try {
            const response = await fetch(`${endpoint}/json/version`);
            return response.ok;
          } catch {
            return false;
          }
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const processOutput = getProcessOutput().trim() || "No Electron output was captured.";
    throw new Error(`${message}\n\nElectron process output:\n${processOutput}`);
  }

  return endpoint;
}

function stopPackagedApplication(appProcess: ChildProcess) {
  if (appProcess.exitCode !== null || appProcess.pid === undefined) {
    return;
  }

  if (process.platform === "win32") {
    appProcess.kill();
    return;
  }

  try {
    process.kill(-appProcess.pid, "SIGKILL");
  } catch (error: unknown) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ESRCH") {
      throw error;
    }
  }
}

test("打包后的桌面应用可以安全加载主窗口", async () => {
  const executablePath = getPackagedExecutable();
  await Promise.all([access(executablePath), access(getPackagedSqliteVecExtension())]);
  const debuggingPort = await getAvailablePort();
  const appProcess = spawn(
    executablePath,
    [`--remote-debugging-port=${debuggingPort}`, "--remote-allow-origins=*"],
    { detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] },
  );
  const processOutput: string[] = [];
  appProcess.stdout?.on("data", (chunk: Buffer) => processOutput.push(chunk.toString()));
  appProcess.stderr?.on("data", (chunk: Buffer) => processOutput.push(chunk.toString()));
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

  try {
    const endpoint = await waitForDevTools(debuggingPort, appProcess, () => processOutput.join(""));
    browser = await chromium.connectOverCDP(endpoint);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error("Electron did not expose a browser context.");
    }

    await expect.poll(() => context.pages().length, { timeout: 15_000 }).toBeGreaterThan(0);
    const page = context.pages()[0];
    if (!page) {
      throw new Error("Electron did not create a renderer page.");
    }

    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => localStorage.setItem("norafold.language", "zh-CN"));
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveTitle("norafold");
    await expect(page.locator("body")).toContainText("norafold");
    expect(page.url()).toMatch(/^app:\/\/norafold\/index\.html(?:#.*)?$/);
    expect(
      await page.evaluate(() => {
        const desktop = Reflect.get(globalThis, "desktop");
        if (typeof desktop !== "object" || desktop === null) {
          return undefined;
        }

        const platform = Reflect.get(desktop, "platform");
        return typeof platform === "string" ? platform : undefined;
      }),
    ).toBe(process.platform);
    expect(
      await page.evaluate(() => {
        const desktop = Reflect.get(globalThis, "desktop");
        if (typeof desktop !== "object" || desktop === null) return undefined;
        const getDatabaseStatus = Reflect.get(desktop, "getDatabaseStatus");
        return typeof getDatabaseStatus === "function" ? getDatabaseStatus() : undefined;
      }),
    ).toEqual({ schemaVersion: 2, embeddingDimensions: 1536 });

    const contentSecurityPolicy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    expect(contentSecurityPolicy).toContain("script-src 'self'");
    expect(contentSecurityPolicy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(consoleErrors).toEqual([]);

    await page.getByRole("link", { name: "设置", exact: true }).click();
    await expect(page.getByRole("heading", { name: "设置", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("norafold.language"))).toBe("en");

    await page
      .getByLabel("Interface language")
      .getByRole("button", { name: "Follow system", exact: true })
      .click();
    expect(await page.evaluate(() => localStorage.getItem("norafold.language"))).toBeNull();

    await page
      .getByRole("button", { name: /^(Open theme settings|打开主题设置)$/, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /^(Theme Settings|主题设置)$/, exact: true }),
    ).toBeVisible();

    await page.getByRole("radio", { name: /^(Dark|深色)$/, exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("radio", { name: "Anthropic", exact: true }).click();
    await expect(page.locator("body")).toHaveAttribute("data-theme-preset", "anthropic");

    await page.getByRole("radio", { name: /^(Sans|无衬线)$/, exact: true }).click();
    await expect(page.locator("body")).toHaveAttribute("data-theme-font", "sans");

    await page
      .getByRole("radiogroup", { name: /^(Select sidebar style|选择侧边栏样式)$/ })
      .getByRole("radio", { name: /^(Floating|浮动)$/, exact: true })
      .click();
    await expect(page.locator('[data-slot="sidebar"]')).toHaveAttribute("data-variant", "floating");

    await page
      .getByRole("button", {
        name: /^(Reset all appearance settings to default values|将所有外观设置恢复为默认值)$/,
      })
      .click();
    await expect(page.locator("body")).not.toHaveAttribute("data-theme-preset");
    await expect(page.locator("body")).not.toHaveAttribute("data-theme-font");
    await page.keyboard.press("Escape");

    await page.getByRole("link", { name: /^(Updates|更新)$/, exact: true }).click();
    await expect(page).toHaveURL(/#\/settings\?section=updates$/);
    await expect(page.getByText(/^(Application updates|应用更新)$/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^(Check for updates|检查更新)$/ }),
    ).toBeEnabled();

    await page.evaluate("window.location.hash = '#/missing-route'");
    await page.waitForURL(/app:\/\/norafold\/index\.html#\/missing-route$/);
    await expect(page.getByText(/^(This page could not be found|没有找到这个页面)$/)).toBeVisible();
    await page.getByRole("button", { name: /^(Back to home|返回首页)$/ }).click();
    await expect(page).toHaveURL(/app:\/\/norafold\/index\.html#\/?$/);
  } finally {
    try {
      await browser?.close();
    } finally {
      stopPackagedApplication(appProcess);
    }
  }
});
