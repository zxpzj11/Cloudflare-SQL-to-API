import { defineEventHandler, getRouterParam, createError } from "h3";

/**
 * 删除API路由
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

    // 查询API是否存在
    const existingRoute = await env.DB.prepare(
      `
      SELECT id FROM api_routes WHERE id = ?
    `
    )
      .bind(id)
      .first();

    if (!existingRoute) {
      throw createError({
        statusCode: 404,
        statusMessage: "API路由不存在",
      });
    }

    // 删除API路由
    const { success, error } = await env.DB.prepare(
      `
      DELETE FROM api_routes WHERE id = ?
    `
    )
      .bind(id)
      .run();

    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: `删除失败: ${error || "未知错误"}`,
      });
    }

    // 清理相关的日志记录
    await env.DB.prepare(
      `
      DELETE FROM api_logs WHERE route_id = ?
    `
    )
      .bind(id)
      .run();

    return {
      success: true,
      message: "API路由已删除",
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
