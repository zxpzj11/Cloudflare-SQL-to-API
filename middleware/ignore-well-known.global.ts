/**
 * 全局路由中间件，用于忽略特定路径的访问警告
 * 主要针对 /.well-known/ 开头的请求路径和 Chrome DevTools 相关请求
 */
export default defineNuxtRouteMiddleware((to) => {
  // 仅匹配特定的已知问题路径，避免过度拦截
  const ignorePaths = [
    "/.well-known/appspecific/com.chrome.devtools.json",
    "/.well-known/appspecific/co",
  ];

  if (ignorePaths.includes(to.path)) {
    // 使用 abortNavigation 中止导航以避免警告
    return abortNavigation();
  }
});
