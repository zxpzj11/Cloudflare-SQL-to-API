// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },

  nitro: {
    preset: "cloudflare_module",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  modules: ["nitro-cloudflare-dev"],

  // 设置vite配置
  vite: {
    build: {
      sourcemap: false,
    },
  },

  // 添加CSP头以允许CDN加载
  app: {
    head: {
      meta: [
        {
          "http-equiv": "Content-Security-Policy",
          content:
            "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';",
        },
      ],
    },
  },
});
