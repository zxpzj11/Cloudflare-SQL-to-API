import { defineEventHandler, createError } from "h3";

/**
 * 获取所有表
 */
export default defineEventHandler(async (event) => {
  // 安全检查 - 这里应添加实际的认证检查
  // TODO: 实现管理员认证

  try {
    const env = event.context.cloudflare.env;

    // 查询所有表
    const tablesResult = await env.DB.prepare(
      `
      SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.created_at, 
        t.updated_at,
        COUNT(f.id) as field_count
      FROM db_tables t
      LEFT JOIN db_fields f ON t.id = f.table_id
      GROUP BY t.id
      ORDER BY t.name
    `
    ).all();

    if (!tablesResult.success) {
      throw new Error(tablesResult.error || "获取表列表失败");
    }

    // 获取每个表的API路由数量
    for (const table of tablesResult.results) {
      const routeCount = await env.DB.prepare(
        `
        SELECT COUNT(*) as count
        FROM api_routes
        WHERE source_table_id = ?
      `
      )
        .bind(table.id)
        .first<{ count: number }>();

      table.api_route_count = routeCount?.count || 0;
    }

    return {
      success: true,
      tables: tablesResult.results,
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
