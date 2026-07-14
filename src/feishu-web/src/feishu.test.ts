import { afterEach, describe, expect, it, vi } from "vitest";

import { tempPathToFile } from "./feishu";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("飞书临时媒体读取", () => {
  it("通过 FileSystemManager 将 ttfile 转为可上传 File", async () => {
    const payload = new Uint8Array([137, 80, 78, 71]);
    vi.stubGlobal("window", {
      tt: {
        getFileSystemManager: () => ({
          readFile: ({ success }: { success: (value: { data: Uint8Array }) => void }) =>
            success({ data: payload }),
        }),
      },
    });

    const file = await tempPathToFile("ttfile://temp/example.png");

    expect(file.name).toMatch(/^feishu-\d+\.png$/);
    expect(file.type).toBe("image/png");
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(payload);
  });

  it("客户端没有文件系统能力时返回明确错误", async () => {
    vi.stubGlobal("window", { tt: {} });

    await expect(tempPathToFile("ttfile://temp/example.jpg")).rejects.toThrow(
      "当前飞书版本不支持读取临时图片",
    );
  });
});
