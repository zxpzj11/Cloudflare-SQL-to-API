import { defineEventHandler, getRouterParam, createError } from "h3";

/**
 * 获取表详情
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

    // 获取表基本信息
    const tableResult = await env.DB.prepare(
      `
      SELECT *
      FROM db_tables
      WHERE id = ?
    `
    )
      .bind(id)
      .first();

    if (!tableResult) {
      throw createError({
        statusCode: 404,
        statusMessage: "表不存在",
      });
    }

    // 获取表字段
    const fieldsResult = await env.DB.prepare(
      `
      SELECT *
      FROM db_fields
      WHERE table_id = ?
      ORDER BY order_index
    `
    )
      .bind(id)
      .all();

    // 获取相关API路由
    const routesResult = await env.DB.prepare(
      `
      SELECT id, name, path, method, description, crud_operation, is_public
      FROM api_routes
      WHERE source_table_id = ?
      ORDER BY crud_operation
    `
    )
      .bind(id)
      .all();

    // 转换布尔值字段
    const fields = fieldsResult.results.map((field) => ({
      ...field,
      nullable: Boolean(field.nullable),
      primary_key: Boolean(field.primary_key),
      unique_field: Boolean(field.unique_field),
      auto_increment: Boolean(field.auto_increment),
    }));

    // 解析schema字段
    let schema = {};
    try {
      schema = JSON.parse(tableResult.schema as string);
    } catch (error) {
      // 如果解析失败，使用空对象
      console.error("Schema解析失败:", error);
    }

    return {
      success: true,
      table: {
        ...tableResult,
        schema,
      },
      fields,
      api_routes: routesResult.results,
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
