import { defineEventHandler, readBody, createError } from "h3";
import { CrudGenerator, TableSchema } from "~/server/utils/crud-generator";

/**
 * 预览表创建SQL和API
 */
export default defineEventHandler(async (event) => {
  // 安全检查 - 这里应添加实际的认证检查
  // TODO: 实现管理员认证

  try {
    const body = (await readBody(event)) as TableSchema;

    // 验证必填字段
    if (
      !body.name ||
      !body.fields ||
      !Array.isArray(body.fields) ||
      body.fields.length === 0
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "缺少必要字段: name, fields",
      });
    }

    // 生成创建表的SQL语句
    let createTableSQL;
    try {
      createTableSQL = CrudGenerator.generateCreateTableSQL(body);
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        statusMessage: `表结构无效: ${error.message}`,
      });
    }

    // 生成API SQL预览
    const apiPreviews = [
      {
        operation: "READ_ALL",
        sql: CrudGenerator.generateSelectAllSQL(body),
      },
      {
        operation: "READ_ONE",
        sql: CrudGenerator.generateSelectByIdSQL(body),
      },
      {
        operation: "CREATE",
        sql: CrudGenerator.generateInsertSQL(body),
      },
      {
        operation: "UPDATE",
        sql: CrudGenerator.generateUpdateSQL(body),
      },
      {
        operation: "DELETE",
        sql: CrudGenerator.generateDeleteSQL(body),
      },
      {
        operation: "SEARCH",
        sql: CrudGenerator.generateSearchSQL(body),
      },
    ];

    // 返回SQL预览
    return {
      success: true,
      sql: createTableSQL,
      api_previews: apiPreviews,
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
