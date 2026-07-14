import { api } from "./api";

const appId = import.meta.env.VITE_FEISHU_APP_ID as string | undefined;

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

export async function requestLoginCode(): Promise<string> {
  if (!appId) throw new Error("缺少 VITE_FEISHU_APP_ID，请先配置飞书应用 ID");
  await sdkReady();
  const tt = window.tt;
  if (!tt) throw new Error("请在飞书客户端内打开应用");

  return new Promise((resolve, reject) => {
    const callbacks = { success: (result: { code: string }) => resolve(result.code), fail: (error: { errMsg?: string; errString?: string }) => reject(feishuError(error)) };
    if (tt.requestAccess) tt.requestAccess({ appID: appId, scopeList: [], ...callbacks });
    else if (tt.requestAuthCode) tt.requestAuthCode({ appId, ...callbacks });
    else reject(new Error("当前飞书版本不支持免登录，请升级客户端"));
  });
}

export async function configureJsapi(): Promise<boolean> {
  if (!isFeishu() || !window.h5sdk?.config) return false;
  try {
    const config = await api.jsapiConfig(location.href.split("#")[0]);
    window.h5sdk.config(config);
    await sdkReady();
    return true;
  } catch {
    return false;
  }
}

async function tempPathToFile(path: string): Promise<File> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("无法读取飞书临时图片");
  const blob = await response.blob();
  return new File([blob], `feishu-${Date.now()}.${blob.type.includes("png") ? "png" : "jpg"}`, { type: blob.type || "image/jpeg" });
}

export async function chooseImage(source: "camera" | "album"): Promise<File> {
  if (!window.tt?.chooseMedia) throw new Error("当前环境不支持飞书媒体选择");
  const path = await new Promise<string>((resolve, reject) => {
    window.tt?.chooseMedia?.({
      mediaType: ["image"], sourceType: [source], count: 1, sizeType: ["compressed"], cameraDevice: "back", isSaveToAlbum: "0",
      success: (result) => result.tempFiles[0]?.tempFilePath ? resolve(result.tempFiles[0].tempFilePath) : reject(new Error("未选择图片")),
      fail: (error) => reject(feishuError(error)),
    });
  });
  return tempPathToFile(path);
}

export async function shareResult(title: string, description: string, url: string, image?: string): Promise<"feishu" | "native" | "clipboard"> {
  if (window.tt?.shareWebContent) {
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
