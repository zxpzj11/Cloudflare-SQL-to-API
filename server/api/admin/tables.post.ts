import { defineEventHandler, readBody, createError } from "h3";
import { CrudGenerator, TableSchema } from "~/server/utils/crud-generator";

/**
 * 创建新表并生成CRUD API
 *
 * 请求体参数:
 * @param {string} name - 表名
 * @param {string} description - 表描述
 * @param {array} fields - 表字段列表
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
    let createTableSQL: string;
    try {
      createTableSQL = CrudGenerator.generateCreateTableSQL(body);
    } catch (error: any) {
      throw createError({
        statusCode: 400,
        statusMessage: `表结构无效: ${error.message}`,
      });
    }

    // 创建表
    const env = event.context.cloudflare.env;
    try {
      console.log(createTableSQL);

      // 执行创建表的SQL - 使用any类型绕过类型检查
      await env.DB.prepare(createTableSQL.trim()).run();

      // 保存表定义到db_tables表
      const tableResult = await env.DB.prepare(
        `
        INSERT INTO db_tables (name, description, schema, sql_create) 
        VALUES (?, ?, ?, ?)
        RETURNING id
      `
      )
        .bind(
          body.name,
          body.description || "",
          JSON.stringify(body),
          createTableSQL
        )
        .first<{ id: number }>();

      if (!tableResult || !tableResult.id) {
        throw new Error("保存表定义失败");
      }

      const tableId = tableResult.id;

      // 保存字段定义到db_fields表
      for (const field of body.fields) {
        await env.DB.prepare(
          `
          INSERT INTO db_fields (
            table_id, name, type, length, precision, scale, 
            nullable, default_value, primary_key, unique_field, 
            auto_increment, description, order_index
          ) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        )
          .bind(
            tableId,
            field.name,
            field.type,
            field.length || null,
            field.precision || null,
            field.scale || null,
            field.nullable === false ? 0 : 1,
            field.default_value || null,
            field.primary_key ? 1 : 0,
            field.unique_field ? 1 : 0,
            field.auto_increment ? 1 : 0,
            field.description || "",
            field.order_index
          )
          .run();
      }

      // 创建CRUD API路由
      const routeIds = await CrudGenerator.createCrudApiRoutes(
        env.DB,
        tableId,
        body
      );

      // 返回成功结果
      return {
        success: true,
        message: "表创建成功并已生成CRUD API",
        table: {
          id: tableId,
          name: body.name,
          field_count: body.fields.length,
        },
        api_routes: {
          count: routeIds.length,
          ids: routeIds,
        },
      };
    } catch (error: any) {
      // 检查是否是表已存在的错误
      if (error.message && error.message.includes("already exists")) {
        throw createError({
          statusCode: 409,
          statusMessage: `表 ${body.name} 已存在`,
        });
      }

      throw error;
    }
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
