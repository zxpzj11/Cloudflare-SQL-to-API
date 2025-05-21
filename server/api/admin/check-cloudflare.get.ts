/**
 * Cloudflare变量检查API
 * 用于验证应用是否正确使用Cloudflare变量
 */
import { checkCloudflareVariables } from "~/server/utils/cloudflare-check";
import { getSessionId, validateSession } from "~/server/utils/session";

export default defineEventHandler(async (event) => {
  try {
    // 验证会话（只有管理员可以访问此接口）
    const sessionId = getSessionId(event);
    const session = validateSession(sessionId);

    if (!session) {
      return {
        success: false,
        message: "未授权访问，请先登录",
        status: 401,
      };
    }

    // 运行Cloudflare变量检查
    const report = checkCloudflareVariables(event);

    // 返回检查结果
    return {
      success: true,
      message: "Cloudflare变量检查完成",
      data: {
        report,
        inCloudflareEnv: !!event.context.cloudflare,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Cloudflare变量检查失败:", error);

    return {
      success: false,
      message: `检查失败: ${error.message || "未知错误"}`,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
});
