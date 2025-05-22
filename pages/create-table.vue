<template>
  <div class="create-table">
    <el-page-header @back="$router.go(-1)" title="返回" content="创建数据表" />

    <div class="table-content">
      <el-form
        :model="tableForm"
        label-width="120px"
        :rules="rules"
        ref="tableFormRef"
      >
        <el-form-item label="表名" prop="name">
          <el-input v-model="tableForm.name" placeholder="输入表名" />
          <div class="help-text">
            表名必须以字母开头，且只能包含字母、数字和下划线
          </div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="tableForm.description"
            type="textarea"
            placeholder="表描述"
          />
        </el-form-item>

        <el-form-item label="表字段">
          <el-button
            type="primary"
            @click="addField"
            :icon="Plus"
            size="small"
            style="margin-bottom: 10px"
          >
            添加字段
          </el-button>

          <div
            v-if="tableForm.fields.length === 0"
            class="empty-fields-placeholder"
          >
            <el-empty description="请添加表字段" />
          </div>

          <div v-else class="field-list">
            <!-- 字段表头 -->
            <div class="field-header">
              <el-row :gutter="10">
                <el-col :span="4">字段名</el-col>
                <el-col :span="3">类型</el-col>
                <el-col :span="2">长度</el-col>
                <el-col :span="8">约束</el-col>
                <el-col :span="4">默认值</el-col>
                <el-col :span="3">操作</el-col>
              </el-row>
            </div>

            <!-- 字段列表 -->
            <div v-for="(field, index) in tableForm.fields" :key="index">
              <TableFieldRow
                :field="field"
                :index="index"
                :fieldsCount="tableForm.fields.length"
                @update:field="
                  (updatedField) => updateField(index, updatedField)
                "
                @remove-field="removeField"
                @move-field="moveField"
                @primary-key-change="handlePrimaryKeyChange"
              />
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">创建表</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="$router.push('/table-list')">查看表列表</el-button>
          <el-button type="info" @click="previewSQL">预览SQL</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- SQL预览对话框 -->
    <el-dialog
      v-model="sqlPreviewVisible"
      title="SQL预览"
      width="60%"
      destroy-on-close
    >
      <pre class="sql-preview">{{ sqlPreview }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sqlPreviewVisible = false">关闭</el-button>
          <el-button type="primary" @click="copySQL">复制SQL</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- API预览对话框 -->
    <el-dialog
      v-model="apiPreviewVisible"
      title="生成的API路由预览"
      width="70%"
      destroy-on-close
    >
      <div class="api-preview-content">
        <h3>该表将生成以下CRUD API端点:</h3>
        <el-table :data="previewApis" style="width: 100%">
          <el-table-column prop="method" label="请求方法" width="100" />
          <el-table-column prop="path" label="API路径" />
          <el-table-column prop="operation" label="操作类型" width="150" />
          <el-table-column prop="description" label="描述" width="200" />
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="apiPreviewVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加页脚组件 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElNotification } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";
import AppFooter from "~/components/AppFooter.vue";
import TableFieldRow from "~/components/TableFieldRow.vue";
import type { TableField, TableSchema } from "~/server/utils/crud-generator";

// 路由器
const router = useRouter();

// 表单引用
const tableFormRef = ref<FormInstance>();

// SQL预览
const sqlPreview = ref("");
const sqlPreviewVisible = ref(false);

// API预览
const apiPreviewVisible = ref(false);

// 表单数据
const tableForm = reactive<TableSchema>({
  name: "",
  description: "",
  fields: [],
});

// 表单规则
const rules = reactive<FormRules>({
  name: [
    { required: true, message: "表名不能为空", trigger: "blur" },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: "表名必须以字母开头，且只能包含字母、数字和下划线",
      trigger: "blur",
    },
  ],
});

// 预览的API列表
const previewApis = computed(() => {
  if (!tableForm.name) return [];

  const tableName = tableForm.name;

  return [
    {
      method: "GET",
      path: `/api/${tableName}`,
      operation: "READ_ALL",
      description: `获取所有${tableName}记录，支持分页`,
    },
    {
      method: "GET",
      path: `/api/${tableName}/:id`,
      operation: "READ_ONE",
      description: `根据ID获取单个${tableName}记录`,
    },
    {
      method: "POST",
      path: `/api/${tableName}`,
      operation: "CREATE",
      description: `创建新的${tableName}记录`,
    },
    {
      method: "PUT",
      path: `/api/${tableName}/:id`,
      operation: "UPDATE",
      description: `更新${tableName}记录`,
    },
    {
      method: "DELETE",
      path: `/api/${tableName}/:id`,
      operation: "DELETE",
      description: `删除${tableName}记录`,
    },
    {
      method: "GET",
      path: `/api/${tableName}/search`,
      operation: "SEARCH",
      description: `搜索${tableName}记录`,
    },
  ];
});

// 添加字段
const addField = () => {
  const newField: TableField = {
    name: "",
    type: "string",
    nullable: true,
    primary_key: false,
    unique_field: false,
    auto_increment: false,
    order_index: tableForm.fields.length,
  };

  // 如果没有字段，默认添加一个id主键字段
  if (tableForm.fields.length === 0) {
    newField.name = "id";
    newField.type = "integer";
    newField.primary_key = true;
    newField.auto_increment = true;
    newField.nullable = false;
  }

  tableForm.fields.push(newField);
};

// 更新字段
const updateField = (index: number, updatedField: TableField) => {
  if (index >= 0 && index < tableForm.fields.length) {
    tableForm.fields[index] = updatedField;
  }
};

// 移动字段
const moveField = (index: number, direction: "up" | "down") => {
  if (direction === "up" && index > 0) {
    const temp = tableForm.fields[index];
    tableForm.fields[index] = tableForm.fields[index - 1];
    tableForm.fields[index - 1] = temp;

    // 更新order_index
    updateOrderIndexes();
  } else if (direction === "down" && index < tableForm.fields.length - 1) {
    const temp = tableForm.fields[index];
    tableForm.fields[index] = tableForm.fields[index + 1];
    tableForm.fields[index + 1] = temp;

    // 更新order_index
    updateOrderIndexes();
  }
};

// 更新字段顺序索引
const updateOrderIndexes = () => {
  tableForm.fields.forEach((field, index) => {
    field.order_index = index;
  });
};

// 删除字段
const removeField = (index: number) => {
  if (index >= 0 && index < tableForm.fields.length) {
    tableForm.fields.splice(index, 1);

    // 更新order_index
    updateOrderIndexes();
  }
};

// 处理主键状态变更
const handlePrimaryKeyChange = (index: number, isPrimary: boolean) => {
  // 如果设置为主键，则取消其他字段的主键状态
  if (isPrimary) {
    tableForm.fields.forEach((field, idx) => {
      if (idx !== index && field.primary_key) {
        field.primary_key = false;
        field.auto_increment = false;
      }
    });
  }
};

// 预览SQL
const previewSQL = async () => {
  if (!tableFormRef.value) return;

  try {
    await tableFormRef.value.validate();

    // 调用后端API获取SQL预览
    const response = await fetch("/api/admin/tables/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tableForm),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || "获取SQL预览失败");
    }

    const result = await response.json();
    sqlPreview.value = result.sql;
    sqlPreviewVisible.value = true;

    // 预览API
    setTimeout(() => {
      apiPreviewVisible.value = true;
    }, 500);
  } catch (error: any) {
    ElMessage.error({
      message: error.message || "表单验证失败，请检查字段配置",
      duration: 5000,
    });
  }
};

// 复制SQL
const copySQL = () => {
  navigator.clipboard
    .writeText(sqlPreview.value)
    .then(() => {
      ElNotification({
        title: "成功",
        message: "SQL已复制到剪贴板",
        type: "success",
        duration: 2000,
      });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      ElMessage.error("复制失败，请手动复制");
    });
};

// 提交表单
const submitForm = async () => {
  if (!tableFormRef.value) return;

  await tableFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 检查是否有主键
        const hasPrimaryKey = tableForm.fields.some(
          (field) => field.primary_key
        );
        if (!hasPrimaryKey) {
          ElMessage.warning("表应该至少有一个主键字段");
          return;
        }

        // 调用后端API创建表
        const response = await fetch("/api/admin/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tableForm),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.statusMessage || "创建表失败");
        }

        const result = await response.json();

        ElNotification({
          title: "成功",
          message: `表 ${tableForm.name} 创建成功，生成了 ${result.api_routes.count} 个API路由`,
          type: "success",
          duration: 5000,
        });

        // 重置表单
        resetForm();

        // 跳转到表列表页面
        router.push("/table-list");
      } catch (error: any) {
        ElMessage.error({
          message: error.message || "创建表失败",
          duration: 5000,
        });
      }
    } else {
      ElMessage.warning("请正确填写表单");
    }
  });
};

// 重置表单
const resetForm = () => {
  if (tableFormRef.value) {
    tableFormRef.value.resetFields();
  }

  tableForm.name = "";
  tableForm.description = "";
  tableForm.fields = [];
};

// 初始化时添加默认ID字段
addField();
</script>

<style scoped>
.create-table {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.table-content {
  flex: 1;
  margin-top: 20px;
}

.help-text {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.empty-fields-placeholder {
  margin: 20px 0;
  padding: 30px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.field-header {
  background-color: #f0f2f5;
  padding: 10px 15px;
  font-weight: bold;
  border-radius: 4px;
  margin-bottom: 15px;
}

.sql-preview {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 400px;
  overflow-y: auto;
}

.api-preview-content {
  max-height: 500px;
  overflow-y: auto;
}
</style>
