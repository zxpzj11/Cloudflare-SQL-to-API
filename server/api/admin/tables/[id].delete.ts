import { defineEventHandler, getRouterParam, createError } from "h3";

/**
 * 删除表及其关联的API路由
 */
export default defineEventHandler(async (event) => {
  // 安全检查 - 这里应添加实际的认证检查
  // TODO: 实现管理员认证

  try {
    const id = getRouterParam(event, "id");

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: "表ID无效",
      });
    }

    const env = event.context.cloudflare.env;

    // 首先检查表是否存在
    const tableResult = await env.DB.prepare(
      `
      SELECT name FROM db_tables WHERE id = ?
    `
    )
      .bind(id)
      .first<{ name: string }>();

    if (!tableResult) {
      throw createError({
        statusCode: 404,
        statusMessage: "表不存在",
      });
    }

    const tableName = tableResult.name;

    // 删除关联的API路由
    await env.DB.prepare(
      `
      DELETE FROM api_routes WHERE source_table_id = ?
    `
    )
      .bind(id)
      .run();

    // 删除表字段
    await env.DB.prepare(
      `
      DELETE FROM db_fields WHERE table_id = ?
    `
    )
      .bind(id)
      .run();

    // 删除表定义
    await env.DB.prepare(
      `
      DELETE FROM db_tables WHERE id = ?
    `
    )
      .bind(id)
      .run();

    // 删除实际的表
    try {
      // 使用any类型绕过类型检查
      await (env.DB as any).exec(`DROP TABLE IF EXISTS ${tableName}`);
    } catch (error: any) {
      console.error(`删除表 ${tableName} 失败:`, error);
      // 这里我们不抛出错误，因为表定义已经被删除，即使实际表删除失败
    }

    return {
      success: true,
      message: `表 ${tableName} 及其相关数据已删除`,
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
