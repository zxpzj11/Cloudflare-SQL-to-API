import { defineEventHandler, getRouterParam, createError } from "h3";

/**
 * 获取单个API路由详情
 */
export default defineEventHandler(async (event) => {
  // 安全检查 - 这里应添加实际的认证检查
  // TODO: 实现管理员认证

  try {
    const id = getRouterParam(event, "id");

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: "API ID无效",
      });
    }

    const env = event.context.cloudflare.env;

    // 查询单个API路由详情
    const route = await env.DB.prepare(
      `
      SELECT * FROM api_routes WHERE id = ?
    `
    )
      .bind(id)
      .first();

    if (!route) {
      throw createError({
        statusCode: 404,
        statusMessage: "API路由未找到",
      });
    }

    return {
      success: true,
      route,
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: `服务器错误: ${error.message || "未知错误"}`,
    });
  }
});
