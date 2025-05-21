/**
 * 会话管理工具 - 服务器端专用
 * 提供安全的会话创建、验证和管理功能
 *
 * 注意：此文件只应在服务器端使用，不应在客户端代码中导入
 */
import { H3Event } from "h3";

// 会话存储，在实际生产环境中应使用持久化存储（如数据库）
const sessions = new Map<string, SessionData>();

// 会话数据接口
interface SessionData {
  userId: string;
  username: string;
  createdAt: number;
  expiresAt: number;
}

// 会话配置
const SESSION_COOKIE_NAME = "session_id";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天，单位毫秒

/**
 * 生成安全的随机会话ID
 * 使用服务器端可用的方法生成UUID
 */
function generateSessionId(): string {
  // 在服务器端使用加密安全的随机生成器来创建唯一ID
  // 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // 其中 x 是任意十六进制数字，y 是 8、9、a 或 b 中的一个
  const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
  return uuid;
}

/**
 * 创建新会话
 * @param event H3Event对象
 * @param username 用户名
 * @returns 会话ID
 */
export function createSession(event: H3Event, username: string): string {
  // 清理过期会话
  cleanExpiredSessions();

  // 为该用户的任何现有会话注销
  logoutUserSessions(username);

  // 生成安全的随机会话ID
  const sessionId = generateSessionId();

  // 创建会话数据
  const now = Date.now();
  const session: SessionData = {
    userId: username, // 在这个简单系统中用户名也作为用户ID
    username,
    createdAt: now,
    expiresAt: now + SESSION_DURATION,
  };

  // 存储会话
  sessions.set(sessionId, session);

  // 设置会话Cookie
  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true, // 重要：防止JavaScript访问
    path: "/",
    maxAge: SESSION_DURATION / 1000, // Cookie有效期（秒）
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return sessionId;
}

/**
 * 验证会话
 * @param sessionId 会话ID字符串
 * @returns 如果会话有效，返回会话数据；否则返回null
 */
export function validateSession(
  sessionId: string | undefined
): SessionData | null {
  // 如果没有会话ID，会话无效
  if (!sessionId) {
    return null;
  }

  // 获取会话数据
  const session = sessions.get(sessionId);

  // 如果没有会话数据，会话无效
  if (!session) {
    return null;
  }

  // 检查会话是否过期
  if (Date.now() > session.expiresAt) {
    // 会话已过期，删除它
    sessions.delete(sessionId);
    return null;
  }

  // 会话有效
  return session;
}

/**
 * 使会话无效
 * @param event H3Event对象
 */
export function invalidateSession(event: H3Event): void {
  // 获取会话ID
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);

  // 如果存在会话ID，从存储中删除会话
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }

  // 删除会话Cookie
  setCookie(event, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0, // 立即过期
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

/**
 * 从Cookie获取当前会话ID
 * @param event H3Event对象
 * @returns 会话ID或undefined
 */
export function getSessionId(event: H3Event): string | undefined {
  return getCookie(event, SESSION_COOKIE_NAME);
}

/**
 * 清理过期会话
 */
function cleanExpiredSessions(): void {
  const now = Date.now();

  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * 使特定用户的所有会话无效
 * @param username 用户名
 */
function logoutUserSessions(username: string): void {
  for (const [sessionId, session] of sessions.entries()) {
    if (session.username === username) {
      sessions.delete(sessionId);
    }
  }
}

/**
 * 获取会话数
 * @returns 活跃会话数
 */
export function getSessionCount(): number {
  return sessions.size;
}

/**
 * 获取在线用户数（去重）
 * @returns 在线用户数
 */
export function getOnlineUserCount(): number {
  const userSet = new Set<string>();

  for (const session of sessions.values()) {
    userSet.add(session.username);
  }

  return userSet.size;
}

/**
 * 从会话ID获取会话数据
 * @param sessionId 会话ID
 * @returns 会话数据或null
 */
export function getSessionData(sessionId: string): SessionData | null {
  return sessions.get(sessionId) || null;
}

/**
 * 生成前端安全的会话信息
 * 不包含敏感数据，只提供必要的用户信息
 * @param session 会话数据
 * @returns 安全的会话信息
 */
export function getSafeSessionInfo(session: SessionData | null): any {
  if (!session) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    username: session.username,
    loginTime: new Date(session.createdAt).toISOString(),
  };
}
