/// <reference types="vite/client" />

type FeishuCallback<T = Record<string, unknown>> = {
  success?: (result: T) => void;
  fail?: (error: { errMsg?: string; errString?: string; errno?: number }) => void;
};

interface FeishuTT {
  requestAccess?: (options: FeishuCallback<{ code: string; state?: string }> & { appID: string; scopeList: string[]; state: string }) => void;
  requestAuthCode?: (options: FeishuCallback<{ code: string }> & { appId: string }) => void;
  chooseMedia?: (
    options: FeishuCallback<{ tempFiles: Array<{ tempFilePath: string; type: string; size?: number }> }> & {
      mediaType: string[];
      sourceType: string[];
      count: number;
      sizeType: string[];
      cameraDevice: string;
      isSaveToAlbum: string;
    },
  ) => void;
  shareWebContent?: (options: FeishuCallback & { title: string; content: string; url: string; image?: string }) => void;
  getFileSystemManager?: () => {
    readFile: (options: FeishuCallback<{ data: ArrayBuffer | Uint8Array }> & { filePath: string }) => void;
  };
}

interface FeishuH5SDK {
  ready: (callback: () => void) => void;
  config?: (options: Record<string, unknown>) => void;
  error?: (callback: (error: unknown) => void) => void;
}

interface Window {
  tt?: FeishuTT;
  h5sdk?: FeishuH5SDK;
}
