/**
 * Cloudflare变量验证工具
 * 帮助开发者验证是否正确使用了Cloudflare特有的变量和功能
 */
import { H3Event } from "h3";
import { getClientIP, getCloudflareMeta, getEnvVariable } from "./cloudflare";

/**
 * 验证Cloudflare环境变量和功能
 * @param event H3事件对象
 * @returns 验证报告
 */
export function checkCloudflareVariables(event: H3Event): Record<string, any> {
  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    isCloudflareEnvironment: false,
    variables: {},
    headers: {},
    cf: {},
  };

  // 检查是否在Cloudflare环境中运行
  report.isCloudflareEnvironment = !!event.context.cloudflare;

  // 环境变量检查
  if (event.context.cloudflare?.env) {
    report.variables.fromCloudflare = true;

    // 检查常用环境变量
    const checkVars = [
      "ADMIN_USERNAME",
      "ADMIN_PASSWORD",
      "TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET_KEY",
    ];

    for (const key of checkVars) {
      const value = getEnvVariable(event, key);
      report.variables[key] = {
        exists: !!value,
        source: value ? getEnvVariableSource(event, key) : "none",
      };
    }

    // 检查数据库绑定
    report.variables.DB = {
      exists: !!(event.context.cloudflare.env as Record<string, any>)["DB"],
      isD1Database: !!(event.context.cloudflare.env as Record<string, any>)[
        "DB"
      ]?.prepare,
    };
  } else {
    report.variables.fromCloudflare = false;
  }

  // 检查Cloudflare特有头信息
  const cfHeaders = [
    "CF-Connecting-IP",
    "CF-IPCountry",
    "CF-RAY",
    "CF-Visitor",
  ];

  for (const header of cfHeaders) {
    const value = event.context.cloudflare?.request?.headers?.get(header);
    report.headers[header] = {
      exists: !!value,
      value: value ? (header.includes("IP") ? "已获取但隐藏" : value) : null,
    };
  }

  // 检查CF对象
  if (event.context.cloudflare?.request?.cf) {
    report.cf.exists = true;
    const cf = event.context.cloudflare.request.cf as Record<string, any>;

    // 检查一些常见的CF属性
    const cfProperties = [
      "country",
      "region",
      "city",
      "continent",
      "timezone",
      "clientTrusted",
      "botManagement",
    ];

    for (const prop of cfProperties) {
      report.cf[prop] = {
        exists: cf[prop] !== undefined,
        value: prop === "botManagement" ? "存在但不显示详情" : cf[prop],
      };
    }
  } else {
    report.cf.exists = false;
  }

  // 获取IP和元数据
  report.clientIp = getClientIP(event);
  report.meta = getCloudflareMeta(event);

  return report;
}

/**
 * 确定环境变量的来源
 */
function getEnvVariableSource(event: H3Event, key: string): string {
  if (event.context.cloudflare?.env) {
    const env = event.context.cloudflare.env as Record<string, any>;
    if (env[key] !== undefined) return "cloudflare.env";
  }

  const config = useRuntimeConfig();
  // @ts-ignore
  if (config[key] !== undefined) return "runtimeConfig";

  if (process.env[key] !== undefined) return "process.env";

  return "unknown";
}
