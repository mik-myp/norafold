import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { once } from "node:events";
import { chromium, expect, test } from "@playwright/test";
import type { DesktopApi } from "../../src/shared/desktop-api.js";

function getPackagedExecutable() {
  const packageDirectory = path.resolve("out", `norafold-${process.platform}-${process.arch}`);

  if (process.platform === "darwin") {
    return path.join(packageDirectory, "norafold.app", "Contents", "MacOS", "norafold");
  }

  return path.join(packageDirectory, process.platform === "win32" ? "norafold.exe" : "norafold");
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

async function waitForDevTools(port: number, process: ChildProcess) {
  const endpoint = `http://127.0.0.1:${port}`;

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

  return endpoint;
}

test("打包后的桌面应用可以安全加载主窗口", async () => {
  const executablePath = getPackagedExecutable();
  await access(executablePath);
  const debuggingPort = await getAvailablePort();
  const appProcess = spawn(
    executablePath,
    [`--remote-debugging-port=${debuggingPort}`, "--remote-allow-origins=*"],
    { stdio: "ignore" },
  );
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

  try {
    const endpoint = await waitForDevTools(debuggingPort, appProcess);
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

    await expect(page).toHaveTitle("norafold");
    await expect(page.locator("body")).toContainText("norafold");
    expect(page.url()).toMatch(/^app:\/\/norafold\/index\.html(?:#.*)?$/);
    expect(
      await page.evaluate(
        () => (globalThis as unknown as { desktop?: DesktopApi }).desktop?.platform,
      ),
    ).toBe(process.platform);

    const contentSecurityPolicy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute("content");
    expect(contentSecurityPolicy).toContain("script-src 'self'");
    expect(contentSecurityPolicy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(consoleErrors).toEqual([]);
  } finally {
    await browser?.close();
    if (appProcess.exitCode === null) {
      appProcess.kill();
    }
  }
});
