import { defineEventHandler, readBody, createError } from "h3";

/**
 * 批量更新API路由状态
 *
 * 请求体参数:
 * @param {number[]} ids - 要更新的API路由ID数组
 * @param {boolean} is_public - 是否公开
 */
export default defineEventHandler(async (event) => {
  // 安全检查 - 这里应添加实际的认证检查
  // TODO: 实现管理员认证

  try {
    const body = await readBody(event);

    // 验证必填字段
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "缺少必要字段: ids（数组）",
      });
    }

    // 验证is_public是否为布尔值
    if (typeof body.is_public !== "boolean") {
      throw createError({
        statusCode: 400,
        statusMessage: "is_public必须是布尔值",
      });
    }

    const env = event.context.cloudflare.env;

    // 构建带有参数占位符的查询
    const placeholders = body.ids.map(() => "?").join(",");
    const isPublicValue = body.is_public ? 1 : 0;

    // 更新API路由
    const { success, error, meta } = await env.DB.prepare(
      `
      UPDATE api_routes 
      SET is_public = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `
    )
      .bind(isPublicValue, ...body.ids)
      .run();

    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: `数据库错误: ${error || "未知错误"}`,
      });
    }

    return {
      success: true,
      message: `批量${body.is_public ? "公开" : "设为非公开"}API路由成功`,
      updated: meta?.changes || body.ids.length,
      status: body.is_public,
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
