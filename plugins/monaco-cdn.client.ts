import { defineNuxtPlugin } from "#app";

/**
 * 客户端插件，用于从CDN加载Monaco Editor
 * 避免了本地模块和源映射的问题
 */
export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      loadMonacoCDN: () => {
        return new Promise((resolve, reject) => {
          if (typeof window === "undefined") {
            return reject(new Error("Cannot load Monaco Editor in SSR mode"));
          }

          // 如果Monaco已加载，直接返回
          if ((window as any).monaco) {
            return resolve((window as any).monaco);
          }

          // 加载Monaco CDN脚本
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js";
          script.onload = () => {
            const require = (window as any).require;

            require.config({
              paths: {
                vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs",
              },
            });

            // 加载Monaco编辑器主模块
            require(["vs/editor/editor.main"], () => {
              resolve((window as any).monaco);
            });
          };
          script.onerror = (err) => reject(err);
          document.head.appendChild(script);
        });
      },
    },
  };
});
