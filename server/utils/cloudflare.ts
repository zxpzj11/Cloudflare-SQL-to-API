/**
 * Cloudflare工具函数
 * 提供统一的方式来访问Cloudflare特有的变量和功能
 */
import { H3Event } from "h3";

/**
 * 获取客户端真实IP地址
 * 优先使用Cloudflare的CF-Connecting-IP头
 */
export function getClientIP(event: H3Event): string {
  // 优先级顺序：CF-Connecting-IP > X-Forwarded-For > 直接IP
  if (event.context.cloudflare?.request?.headers) {
    // Cloudflare Workers环境
    const cfIP =
      event.context.cloudflare.request.headers.get("CF-Connecting-IP");
    if (cfIP) return cfIP;

    const forwardedIP =
      event.context.cloudflare.request.headers.get("X-Forwarded-For");
    if (forwardedIP) return forwardedIP.split(",")[0].trim();

    const realIP = event.context.cloudflare.request.headers.get("X-Real-IP");
    if (realIP) return realIP;
  }

  // 常规Node.js环境下的备选方案
  const nodeForwardedIP = event.node?.req?.headers?.["x-forwarded-for"];
  if (nodeForwardedIP) {
    return Array.isArray(nodeForwardedIP)
      ? nodeForwardedIP[0]
      : nodeForwardedIP.split(",")[0].trim();
  }

  // 最后的备选项
  return event.node?.req?.socket?.remoteAddress || "未知";
}

/**
 * 获取Cloudflare环境变量
 * 优先从Cloudflare环境中获取变量
 */
export function getEnvVariable(
  event: H3Event,
  key: string,
  defaultValue: string = ""
): string {
  // 优先从Cloudflare环境中获取
  // 使用类型安全的方式访问环境变量
  if (event.context.cloudflare?.env) {
    // 由于env是动态的，使用特殊访问方式避免类型错误
    const env = event.context.cloudflare.env as Record<string, any>;
    const cfValue = env[key];
    if (cfValue !== undefined && cfValue !== null) return String(cfValue);
  }

  // 然后从运行时配置中获取
  const config = useRuntimeConfig();
  // @ts-ignore - 运行时配置是动态的
  const configValue = config[key];
  if (configValue !== undefined && configValue !== null)
    return String(configValue);

  // 最后从常规环境变量中获取
  const envValue = process.env[key];
  if (envValue !== undefined && envValue !== null) return envValue;

  // 如果都没有，返回默认值
  return defaultValue;
}

/**
 * 获取Cloudflare请求头信息
 * 安全地获取请求头，优先从Cloudflare环境中获取
 */
export function getRequestHeader(
  event: H3Event,
  headerName: string
): string | null {
  // 优先从Cloudflare环境中获取
  if (event.context.cloudflare?.request?.headers) {
    const value = event.context.cloudflare.request.headers.get(headerName);
    if (value) return value;
  }

  // 备选：从标准Node请求中获取
  const nodeHeader = event.node?.req?.headers?.[headerName.toLowerCase()];
  if (nodeHeader) {
    return Array.isArray(nodeHeader) ? nodeHeader[0] : nodeHeader;
  }

  return null;
}

/**
 * 获取Cloudflare特有信息
 * 返回一组Cloudflare特有的请求信息，用于增强安全和分析
 */
export function getCloudflareMeta(event: H3Event): Record<string, any> {
  const meta: Record<string, any> = {
    ip: getClientIP(event),
    country: null,
    region: null,
    city: null,
    userAgent: null,
    isBrowser: false,
    isBot: false,
    botManagement: null,
    requestTime: new Date().toISOString(),
  };

  // 仅在Cloudflare环境下可用的信息
  if (event.context.cloudflare?.request?.cf) {
    const cf = event.context.cloudflare.request.cf as Record<string, any>;

    // 地理位置信息
    meta.country = cf.country || null;
    meta.region = cf.region || null;
    meta.city = cf.city || null;

    // 机器人检测信息
    meta.isBrowser = cf.clientTrusted === true;

    // 修复botManagement访问方式
    if (cf.botManagement && typeof cf.botManagement === "object") {
      const botManagement = cf.botManagement as Record<string, any>;
      meta.isBot = !!(
        botManagement.score !== undefined && botManagement.score < 30
      );
      meta.botManagement = botManagement;
    }
  }

  // 通用信息
  meta.userAgent = getRequestHeader(event, "User-Agent");
  meta.referer = getRequestHeader(event, "Referer");

  return meta;
}
