/**
 * 退出登录 API 端点
 * 使当前会话无效，安全地退出用户登录状态
 */
import { invalidateSession } from "~/server/utils/session";

export default defineEventHandler((event) => {
  try {
    // 使当前会话无效
    invalidateSession(event);

    // 同时清除客户端可见的认证标记
    setCookie(event, "auth_state", "", {
      httpOnly: false,
      path: "/",
      maxAge: 0, // 立即过期
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return {
      success: true,
      message: "已成功退出登录",
    };
  } catch (error) {
    console.error("退出登录处理失败:", error);
    return {
      success: false,
      message: "服务器处理退出登录请求失败",
    };
  }
});
