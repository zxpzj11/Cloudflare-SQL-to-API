import { defineEventHandler, readBody, createError } from "h3";

/**
 * 批量删除API路由
 *
 * 请求体参数:
 * @param {number[]} ids - 要删除的API路由ID数组
 * @param {boolean} confirmed - 是否已确认删除（包括关联日志）
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

    const env = event.context.cloudflare.env;

    // 构建带有参数占位符的查询
    const placeholders = body.ids.map(() => "?").join(",");

    // 查询API日志中引用的API ID，确保可以安全删除
    const logsResult = await env.DB.prepare(
      `
      SELECT route_id, COUNT(*) as count
      FROM api_logs
      WHERE route_id IN (${placeholders})
      GROUP BY route_id
    `
    )
      .bind(...body.ids)
      .all();

    // 如果有日志引用且未确认，返回警告
    if (
      logsResult.results &&
      logsResult.results.length > 0 &&
      !body.confirmed
    ) {
      const logsWarning = logsResult.results
        .map((log) => `API ID ${log.route_id}: ${log.count} 条日志记录`)
        .join(", ");

      return {
        success: true,
        warning: true,
        message: `以下API有日志记录引用: ${logsWarning}，删除API将同时删除相关日志记录`,
        logsCount: logsResult.results,
      };
    }

    // 删除API日志记录
    await env.DB.prepare(
      `
      DELETE FROM api_logs
      WHERE route_id IN (${placeholders})
    `
    )
      .bind(...body.ids)
      .run();

    // 删除API路由
    const { success, error, meta } = await env.DB.prepare(
      `
      DELETE FROM api_routes 
      WHERE id IN (${placeholders})
    `
    )
      .bind(...body.ids)
      .run();

    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: `数据库错误: ${error || "未知错误"}`,
      });
    }

    return {
      success: true,
      message: `成功删除 ${meta?.changes || 0} 个API路由及相关日志`,
      deleted: meta?.changes || 0,
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
