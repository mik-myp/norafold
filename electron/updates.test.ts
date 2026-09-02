import { describe, expect, it, vi } from "vite-plus/test";
import { checkForUpdates } from "./updates.js";

function response(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("checkForUpdates", () => {
  it("识别可用的新版本", async () => {
    const result = await checkForUpdates(
      "0.1.0",
      vi.fn().mockResolvedValue(response({ tag_name: "v0.2.0" })),
    );

    expect(result).toEqual({
      status: "available",
      currentVersion: "0.1.0",
      latestVersion: "0.2.0",
    });
  });

  it("忽略相同或更旧的版本", async () => {
    const current = await checkForUpdates(
      "0.2.0",
      vi.fn().mockResolvedValue(response({ tag_name: "v0.2.0" })),
    );
    const older = await checkForUpdates(
      "0.2.0",
      vi.fn().mockResolvedValue(response({ tag_name: "v0.1.0" })),
    );

    expect(current).toEqual({ status: "up-to-date", currentVersion: "0.2.0" });
    expect(older).toEqual({ status: "up-to-date", currentVersion: "0.2.0" });
  });

  it("处理网络、限流和非法响应", async () => {
    const network = await checkForUpdates("0.1.0", vi.fn().mockRejectedValue(new Error("offline")));
    const limited = await checkForUpdates("0.1.0", vi.fn().mockResolvedValue(response({}, 429)));
    const invalid = await checkForUpdates(
      "0.1.0",
      vi.fn().mockResolvedValue(response({ tag_name: "latest" })),
    );

    expect(network).toEqual({ status: "error", code: "network" });
    expect(limited).toEqual({ status: "error", code: "rate-limited" });
    expect(invalid).toEqual({ status: "error", code: "invalid-response" });
  });

  it("拒绝不符合版本格式的当前版本", async () => {
    const fetcher = vi.fn<typeof fetch>();

    expect(await checkForUpdates("0.1", fetcher)).toEqual({
      status: "error",
      code: "invalid-current-version",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
