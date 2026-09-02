import path from "node:path";
import { describe, expect, it } from "vite-plus/test";

import { appOrigin, isTrustedNavigation, resolveRendererRequest } from "./security.js";

const rendererRoot = path.resolve("out/renderer");

describe("resolveRendererRequest", () => {
  it("只允许应用 host 上的 GET 和 HEAD 请求", () => {
    expect(resolveRendererRequest(rendererRoot, "not a url", "GET")).toEqual({
      allowed: false,
      status: 400,
    });
    expect(resolveRendererRequest(rendererRoot, `${appOrigin}/index.html`, "GET")).toEqual({
      allowed: true,
      filePath: path.join(rendererRoot, "index.html"),
    });
    expect(resolveRendererRequest(rendererRoot, `${appOrigin}/index.html`, "HEAD").allowed).toBe(
      true,
    );
    expect(resolveRendererRequest(rendererRoot, "app://external/index.html", "GET")).toEqual({
      allowed: false,
      status: 403,
    });
    expect(resolveRendererRequest(rendererRoot, `${appOrigin}/index.html`, "POST")).toEqual({
      allowed: false,
      status: 403,
    });
  });

  it("拒绝目录穿越和无效编码", () => {
    expect(
      resolveRendererRequest(rendererRoot, `${appOrigin}/%2e%2e%2fpackage.json`, "GET"),
    ).toEqual({ allowed: false, status: 403 });
    expect(resolveRendererRequest(rendererRoot, `${appOrigin}/%E0%A4%A`, "GET")).toEqual({
      allowed: false,
      status: 400,
    });
  });
});

describe("isTrustedNavigation", () => {
  it("只信任当前应用或开发服务器的精确 origin", () => {
    expect(isTrustedNavigation(`${appOrigin}/index.html`)).toBe(true);
    expect(isTrustedNavigation("app://norafold.example/index.html")).toBe(false);
    expect(isTrustedNavigation("not a url")).toBe(false);
    expect(isTrustedNavigation("http://localhost:5173/page", "http://localhost:5173")).toBe(true);
    expect(isTrustedNavigation("http://localhost:5174/page", "http://localhost:5173")).toBe(false);
  });
});
