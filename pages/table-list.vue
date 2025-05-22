<template>
  <div class="table-list">
    <el-page-header @back="$router.go(-1)" title="返回" content="数据表管理" />

    <div class="table-list-content">
      <div class="table-list-header">
        <h2>数据表列表</h2>
        <el-button type="primary" @click="$router.push('/create-table')">
          创建新表
        </el-button>
      </div>

      <el-table
        :data="tables"
        style="width: 100%"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="表名" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column
          prop="field_count"
          label="字段数"
          width="100"
          align="center"
        />
        <el-table-column
          prop="api_route_count"
          label="API数"
          width="100"
          align="center"
        />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewTableDetail(scope.row.id)">
              查看
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="viewTableAPIs(scope.row.id)"
            >
              API
            </el-button>
            <el-popconfirm
              title="确定删除该表吗？所有关联的API也将被删除！"
              @confirm="deleteTable(scope.row.id)"
              confirm-button-type="danger"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="tables.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无数据表">
          <el-button type="primary" @click="$router.push('/create-table')">
            创建第一个表
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 表详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="表详情"
      width="70%"
      destroy-on-close
    >
      <div v-loading="detailLoading">
        <template v-if="selectedTable">
          <h3>{{ selectedTable.name }}</h3>
          <p>{{ selectedTable.description }}</p>

          <div class="table-sql">
            <h4>创建SQL</h4>
            <pre>{{ selectedTable.sql_create }}</pre>
          </div>

          <div class="table-fields">
            <h4>字段列表</h4>
            <el-table :data="tableFields" border>
              <el-table-column prop="name" label="字段名" width="150" />
              <el-table-column prop="type" label="类型" width="120" />
              <el-table-column prop="length" label="长度" width="80" />
              <el-table-column
                prop="description"
                label="描述"
                min-width="200"
              />
              <el-table-column label="约束" width="200">
                <template #default="scope">
                  <el-tag
                    v-if="scope.row.primary_key"
                    size="small"
                    type="success"
                    >主键</el-tag
                  >
                  <el-tag
                    v-if="scope.row.auto_increment"
                    size="small"
                    type="warning"
                    >自增</el-tag
                  >
                  <el-tag v-if="scope.row.unique_field" size="small" type="info"
                    >唯一</el-tag
                  >
                  <el-tag v-if="!scope.row.nullable" size="small" type="danger"
                    >非空</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="default_value"
                label="默认值"
                width="120"
              />
            </el-table>
          </div>
        </template>
      </div>
    </el-dialog>

    <!-- API列表对话框 -->
    <el-dialog
      v-model="apiDialogVisible"
      title="API路由列表"
      width="80%"
      destroy-on-close
    >
      <div v-loading="apiLoading">
        <template v-if="selectedTable">
          <h3>表 {{ selectedTable.name }} 的API路由</h3>

          <el-table :data="tableApis" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="path" label="路径" min-width="200" />
            <el-table-column prop="method" label="方法" width="100" />
            <el-table-column
              prop="crud_operation"
              label="操作类型"
              width="120"
            />
            <el-table-column prop="is_public" label="公开" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.is_public ? 'success' : 'info'">
                  {{ scope.row.is_public ? "是" : "否" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="testApi(scope.row)">
                  测试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </el-dialog>

    <!-- 添加页脚组件 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";
import AppFooter from "~/components/AppFooter.vue";

// 路由器
const router = useRouter();

// 加载状态
const loading = ref(true);
const detailLoading = ref(false);
const apiLoading = ref(false);

// 表格数据
const tables = ref<any[]>([]);

// 选中的表
const selectedTable = ref<any>(null);
const tableFields = ref<any[]>([]);
const tableApis = ref<any[]>([]);

// 对话框可见性
const detailDialogVisible = ref(false);
const apiDialogVisible = ref(false);

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString();
};

// 加载表列表
const loadTables = async () => {
  loading.value = true;
  try {
    const response = await fetch("/api/admin/tables");

    if (!response.ok) {
      throw new Error("获取表列表失败");
    }

    const data = await response.json();

    if (data.success) {
      tables.value = data.tables || [];
    } else {
      throw new Error(data.statusMessage || "获取表列表失败");
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.message || "获取表列表失败",
      duration: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// 查看表详情
const viewTableDetail = async (tableId: number) => {
  detailLoading.value = true;
  detailDialogVisible.value = true;

  try {
    const response = await fetch(`/api/admin/tables/${tableId}`);

    if (!response.ok) {
      throw new Error("获取表详情失败");
    }

    const data = await response.json();

    if (data.success) {
      selectedTable.value = data.table;
      tableFields.value = data.fields || [];
    } else {
      throw new Error(data.statusMessage || "获取表详情失败");
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.message || "获取表详情失败",
      duration: 5000,
    });
    detailDialogVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

// 查看表API
const viewTableAPIs = async (tableId: number) => {
  apiLoading.value = true;
  apiDialogVisible.value = true;

  try {
    const response = await fetch(`/api/admin/tables/${tableId}`);

    if (!response.ok) {
      throw new Error("获取表API失败");
    }

    const data = await response.json();

    if (data.success) {
      selectedTable.value = data.table;
      tableApis.value = data.api_routes || [];
    } else {
      throw new Error(data.statusMessage || "获取表API失败");
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.message || "获取表API失败",
      duration: 5000,
    });
    apiDialogVisible.value = false;
  } finally {
    apiLoading.value = false;
  }
};

// 测试API
const testApi = (api: any) => {
  router.push({
    path: "/api-tester",
    query: { path: api.path, method: api.method },
  });
};

// 删除表
const deleteTable = async (tableId: number) => {
  try {
    const response = await fetch(`/api/admin/tables/${tableId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("删除表失败");
    }

    const data = await response.json();

    if (data.success) {
      ElMessage.success("表删除成功");
      loadTables(); // 重新加载表列表
    } else {
      throw new Error(data.statusMessage || "删除表失败");
    }
  } catch (error: any) {
    ElMessage.error({
      message: error.message || "删除表失败",
      duration: 5000,
    });
  }
};

// 页面加载时获取表列表
onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.table-list {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.table-list-content {
  flex: 1;
  margin-top: 20px;
}

.table-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.empty-state {
  margin: 40px 0;
  display: flex;
  justify-content: center;
}

.table-sql {
  margin: 20px 0;
}

.table-sql pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 200px;
  overflow-y: auto;
}

.table-fields {
  margin: 20px 0;
}
</style>
