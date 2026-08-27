import { describe, expect, it } from "vite-plus/test";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("合并条件类名并解决 Tailwind 冲突", () => {
    expect(cn("px-2", { hidden: false }, "px-4")).toBe("px-4");
  });
});
