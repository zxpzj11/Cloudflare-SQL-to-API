/**
 * 全局认证中间件
 * 使用服务端会话验证机制确保每个页面的访问安全
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 排除的路径：登录页和API路径
  const excludedPaths = ["/login", "/.well-known"];

  // 检查是否是排除的路径
  const isExcludedPath = (path: string) => {
    return excludedPaths.some(
      (excluded) => path === excluded || path.startsWith(`${excluded}/`)
    );
  };

  // 如果目标路径是排除的路径，则记录日志并允许访问
  if (isExcludedPath(to.path)) {
    console.log("路径已排除，不需要验证:", to.path);
    return;
  }

  // 对于所有其他路径，都需要向服务端验证会话有效性
  try {
    // 向服务端验证会话
    const { data: verifyResult } = await useFetch("/api/admin/verify-session", {
      method: "GET",
      // 避免缓存，确保每次都进行实时验证
      key: `verify-session-${Date.now()}`,
    });

    // 添加调试日志
    console.log("服务端会话验证结果:", verifyResult.value);

    // 判断用户是否已认证
    const isAuthenticated = verifyResult.value?.authenticated === true;

    // 如果用户未登录，重定向到登录页面
    if (!isAuthenticated) {
      console.log("服务端验证未通过，重定向到登录页");
      return navigateTo("/login", { replace: true });
    }

    // 将会话信息保存到全局状态
    // 使用类型断言处理可能的类型问题
    const sessionInfo =
      verifyResult.value && typeof verifyResult.value === "object"
        ? (verifyResult.value as any).sessionInfo || { authenticated: true }
        : { authenticated: true };

    useState("session", () => sessionInfo);

    // 如果用户已登录但访问登录页，重定向到首页
    if (isAuthenticated && to.path === "/login") {
      console.log("已认证，从登录页重定向到首页");
      return navigateTo("/");
    }

    // 认证通过，允许访问请求的路径
    console.log("会话验证通过，允许访问:", to.path);
  } catch (error) {
    // 验证过程中出错，为安全起见，重定向到登录页
    console.error("会话验证过程发生错误:", error);
    return navigateTo("/login", { replace: true });
  }
});
