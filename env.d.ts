/// <reference types="./worker-configuration.d.ts" />
/// <reference types="vite/client" />

declare module "h3" {
  interface H3EventContext {
    cf: CfProperties;
    cloudflare: {
      request: Request;
      env: Env;
      context: ExecutionContext;
    };
  }
}

// Cloudflare Worker 环境类型定义
interface Env {
  DB: D1Database;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

export {};
