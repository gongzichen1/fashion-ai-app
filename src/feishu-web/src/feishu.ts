import { api } from "./api";

const appId = import.meta.env.VITE_FEISHU_APP_ID as string | undefined;
let jsapiConfiguration: Promise<boolean> | null = null;

function sdkReady(): Promise<void> {
  if (!window.h5sdk) return Promise.reject(new Error("未检测到飞书 JSSDK"));
  return new Promise((resolve) => window.h5sdk?.ready(resolve));
}

function feishuError(error: { errMsg?: string; errString?: string }): Error {
  return new Error(error.errString || error.errMsg || "飞书客户端调用失败");
}

export function isFeishu(): boolean {
  return Boolean(window.tt && window.h5sdk);
}

export async function requestLoginCode(): Promise<{ code: string; state: string }> {
  if (!appId) throw new Error("缺少 VITE_FEISHU_APP_ID，请先配置飞书应用 ID");
  await sdkReady();
  const tt = window.tt;
  if (!tt) throw new Error("请在飞书客户端内打开应用");
  const challenge = await api.feishuChallenge();

  return new Promise((resolve, reject) => {
    const callbacks = { success: (result: { code: string; state?: string }) => {
      if (result.state && result.state !== challenge.state) return reject(new Error("飞书登录状态校验失败"));
      resolve({ code: result.code, state: challenge.state });
    }, fail: (error: { errMsg?: string; errString?: string }) => reject(feishuError(error)) };
    if (tt.requestAccess) tt.requestAccess({ appID: appId, scopeList: [], state: challenge.state, ...callbacks });
    else if (tt.requestAuthCode) tt.requestAuthCode({ appId, ...callbacks });
    else reject(new Error("当前飞书版本不支持免登录，请升级客户端"));
  });
}

export async function configureJsapi(): Promise<boolean> {
  if (!isFeishu() || !window.h5sdk?.config) return false;
  if (jsapiConfiguration) return jsapiConfiguration;
  jsapiConfiguration = (async () => {
    try {
      const config = await api.jsapiConfig(location.href.split("#")[0]);
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error("飞书 JSSDK 鉴权超时")), 8000);
        window.h5sdk?.error?.((error) => { window.clearTimeout(timer); reject(error); });
        window.h5sdk?.ready(() => { window.clearTimeout(timer); resolve(); });
        window.h5sdk?.config?.(config);
      });
      return true;
    } catch {
      jsapiConfiguration = null;
      return false;
    }
  })();
  return jsapiConfiguration;
}

function imageType(path: string): { extension: string; mime: string } {
  const extension = path.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
  const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  return { extension: types[extension] ? extension : "jpg", mime: types[extension] || "image/jpeg" };
}

export async function tempPathToFile(path: string): Promise<File> {
  const manager = window.tt?.getFileSystemManager?.();
  if (!manager) throw new Error("当前飞书版本不支持读取临时图片，请升级客户端或改用文件选择");
  const data = await new Promise<ArrayBuffer | Uint8Array>((resolve, reject) => manager.readFile({
    filePath: path,
    success: (result) => resolve(result.data),
    fail: (error) => reject(feishuError(error)),
  }));
  const source = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  const bytes = new Uint8Array(source.byteLength);
  bytes.set(source);
  const { extension, mime } = imageType(path);
  return new File([bytes.buffer], `feishu-${Date.now()}.${extension}`, { type: mime });
}

export async function chooseImage(source: "camera" | "album"): Promise<File> {
  if (!window.tt?.chooseMedia) throw new Error("当前环境不支持飞书媒体选择");
  if (!(await configureJsapi())) throw new Error("飞书客户端能力鉴权失败，请重新打开应用");
  const selected = await new Promise<{ tempFilePath: string; size?: number }>((resolve, reject) => {
    window.tt?.chooseMedia?.({
      mediaType: ["image"], sourceType: [source], count: 1, sizeType: ["compressed"], cameraDevice: "back", isSaveToAlbum: "0",
      success: (result) => result.tempFiles[0]?.tempFilePath ? resolve(result.tempFiles[0]) : reject(new Error("未选择图片")),
      fail: (error) => reject(feishuError(error)),
    });
  });
  if (selected.size && selected.size > 15 * 1024 * 1024) throw new Error("图片不能超过 15MB");
  return tempPathToFile(selected.tempFilePath);
}

export async function shareResult(title: string, description: string, url: string, image?: string): Promise<"feishu" | "native" | "clipboard"> {
  if (window.tt?.shareWebContent) {
    if (!(await configureJsapi())) throw new Error("飞书分享能力鉴权失败");
    await new Promise<void>((resolve, reject) => window.tt?.shareWebContent?.({ title, content: description, url, image, success: () => resolve(), fail: (error) => reject(feishuError(error)) }));
    return "feishu";
  }
  if (navigator.share) {
    await navigator.share({ title, text: description, url });
    return "native";
  }
  await navigator.clipboard.writeText(url);
  return "clipboard";
}
