/**
 * 会话验证 API 端点
 * 验证当前会话是否有效，用于保护客户端路由
 */
import {
  getSessionId,
  validateSession,
  getSafeSessionInfo,
} from "~/server/utils/session";

export default defineEventHandler((event) => {
  try {
    // 从请求中获取会话ID
    const sessionId = getSessionId(event);

    // 验证会话
    const session = validateSession(sessionId);

    // 生成安全的会话信息（不包含敏感数据）
    const sessionInfo = getSafeSessionInfo(session);

    // 返回验证结果
    return {
      success: true,
      authenticated: !!session, // 会话存在且有效为true，否则为false
      sessionInfo: sessionInfo,
    };
  } catch (error) {
    console.error("会话验证失败:", error);
    return {
      success: false,
      authenticated: false,
      message: "会话验证失败",
    };
  }
});
