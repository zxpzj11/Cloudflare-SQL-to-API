/**
 * 登录 API 端点
 * 处理用户登录请求，验证凭据并创建安全会话
 */
import { createSession } from "~/server/utils/session";
import {
  getClientIP,
  getEnvVariable,
  getCloudflareMeta,
} from "~/server/utils/cloudflare";

interface LoginRequestBody {
  username: string;
  password: string;
  turnstileToken: string;
}

// Turnstile验证响应接口
interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
  action?: string;
  cdata?: string;
}

/**
 * 验证Turnstile令牌
 * @param token Turnstile令牌
 * @param event H3事件对象
 * @returns 验证结果
 */
async function verifyTurnstileToken(
  token: string,
  event: any
): Promise<boolean> {
  try {
    // 获取Cloudflare元数据
    const cfMeta = getCloudflareMeta(event);

    // 获取Turnstile密钥
    const turnstileSecretKey = getEnvVariable(
      event,
      "TURNSTILE_SECRET_KEY",
      "1x0000000000000000000000000000000AA"
    );

    // 请求参数
    const formData = new FormData();
    formData.append("secret", turnstileSecretKey);
    formData.append("response", token);
    formData.append("remoteip", cfMeta.ip);

    console.log(formData);
    // 添加额外Cloudflare数据以提高验证准确性
    if (cfMeta.country) {
      formData.append("cf-country", cfMeta.country);
    }
    console.log(formData);

    // 发送验证请求
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    // 获取验证结果
    const result = (await verifyResponse.json()) as TurnstileVerifyResponse;

    return result.success === true;
  } catch (error) {
    console.error("Turnstile验证失败:", error);
    return false;
  }
}

export default defineEventHandler(async (event) => {
  try {
    // 获取请求体中的数据
    const { username, password, turnstileToken } =
      await readBody<LoginRequestBody>(event);

    // 参数验证
    if (!username || !password) {
      return {
        success: false,
        message: "用户名和密码不能为空",
      };
    }

    // 验证Turnstile令牌
    if (!turnstileToken) {
      return {
        success: false,
        message: "人机验证未完成",
      };
    }

    // 验证Turnstile令牌
    const isTokenValid = await verifyTurnstileToken(turnstileToken, event);

    if (!isTokenValid) {
      return {
        success: false,
        message: "人机验证失败，请重试",
      };
    }

    // 优先使用Cloudflare环境变量获取管理员凭据
    const adminUsername = getEnvVariable(event, "ADMIN_USERNAME");
    const adminPassword = getEnvVariable(event, "ADMIN_PASSWORD");

    // 验证凭据
    if (!adminUsername || !adminPassword) {
      console.error("环境变量或配置中未设置管理员凭据");
      return {
        success: false,
        message: "系统未正确配置管理员凭据，请联系管理员",
      };
    }

    // 验证用户名和密码
    if (username !== adminUsername || password !== adminPassword) {
      return {
        success: false,
        message: "用户名或密码错误",
      };
    }

    // 登录成功，创建安全会话
    const sessionId = createSession(event, username);

    // 同时设置一个客户端可见的认证标记（非httpOnly）
    // 这样客户端可以检测到登录状态，而不暴露实际的会话ID
    setCookie(event, "auth_state", "authenticated", {
      httpOnly: false, // 客户端可见
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7天
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // 返回会话创建成功的响应
    return {
      success: true,
      message: "登录成功",
      sessionId, // 可以选择是否返回会话ID（生产环境可考虑移除）
    };
  } catch (error) {
    console.error("登录处理失败:", error);
    return {
      success: false,
      message: "服务器处理请求失败",
    };
  }
});
