<template>
  <div class="api-list">
    <el-page-header
      @back="$router.push('/')"
      title="返回首页"
      :content="'API列表'"
    />

    <div class="api-content">
      <div class="api-actions">
        <el-button
          type="primary"
          @click="fetchApiList"
          :icon="Refresh"
          size="small"
        >
          刷新
        </el-button>

        <el-button
          type="success"
          @click="$router.push('/create-api')"
          :icon="Plus"
          size="small"
        >
          创建新API
        </el-button>
      </div>

      <el-table :data="apiList" style="width: 100%; margin-top: 20px">
        <el-table-column prop="name" label="API名称" />
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="method" label="方法" width="100" />
        <el-table-column prop="is_public" label="公开" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.is_public ? 'success' : 'info'">
              {{ scope.row.is_public ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="viewApiDetails(scope.row)"
            >
              详情
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="editApi(scope.row)"
              :icon="Edit"
              :loading="loadingEditId === scope.row.id"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="testApi(scope.row)"
              :icon="VideoPlay"
            >
              测试
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="viewApiLogs(scope.row)"
              :icon="Document"
              :loading="loadingLogsId === scope.row.id"
            >
              日志
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteApi(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="detailsVisible" title="API详情" width="70%">
      <div v-if="selectedApi">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="API名称">{{
            selectedApi.name
          }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{
            selectedApi.description
          }}</el-descriptions-item>
          <el-descriptions-item label="路径">{{
            selectedApi.path
          }}</el-descriptions-item>
          <el-descriptions-item label="HTTP方法">{{
            selectedApi.method
          }}</el-descriptions-item>
          <el-descriptions-item label="SQL查询">
            <pre class="sql-query-display">{{ selectedApi.sql_query }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="参数">
            <pre v-if="selectedApi.params">{{
              JSON.parse(selectedApi.params)
            }}</pre>
            <span v-else>无参数</span>
          </el-descriptions-item>
          <el-descriptions-item label="公开API">
            {{ selectedApi.is_public ? "是" : "否" }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ new Date(selectedApi.created_at).toLocaleString() }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="api-test-link">
          <p>API URL示例:</p>
          <el-link type="primary" :href="apiUrl(selectedApi)" target="_blank">
            {{ apiUrl(selectedApi) }}
          </el-link>
        </div>
      </div>
    </el-dialog>

    <!-- API调用日志对话框 -->
    <el-dialog
      v-model="logsVisible"
      :title="`API调用日志 - ${selectedApiName}`"
      width="80%"
    >
      <div v-if="loadingLogs" class="logs-loading">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else>
        <div class="logs-stats">
          <el-alert
            v-if="apiLogs.length === 0"
            type="info"
            show-icon
            :closable="false"
          >
            暂无调用日志记录
          </el-alert>
          <el-row v-else>
            <el-col :span="24">
              <el-statistic title="总调用次数" :value="logsTotal" />
            </el-col>
          </el-row>
        </div>

        <el-table
          v-if="apiLogs.length > 0"
          :data="apiLogs"
          style="width: 100%; margin-top: 20px"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="ip_address" label="来源IP" width="150" />
          <el-table-column prop="response_status" label="状态码" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.response_status)">
                {{ scope.row.response_status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="execution_time" label="执行时间" width="120">
            <template #default="scope">
              {{ scope.row.execution_time }}ms
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="调用时间" width="180">
            <template #default="scope">
              {{ new Date(scope.row.created_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="request_data" label="请求数据">
            <template #default="scope">
              <div class="request-data">
                {{ formatRequestData(scope.row.request_data) }}
              </div>
              <el-button
                type="primary"
                link
                size="small"
                @click="viewRequestDetails(scope.row.request_data)"
              >
                查看详细
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="apiLogs.length > 0" class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="logsTotal"
            :page-size="logsPageSize"
            :current-page="logsCurrentPage"
            @current-change="handleLogsPageChange"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 请求数据详情对话框 -->
    <el-dialog v-model="requestDetailsVisible" title="请求数据详情" width="50%">
      <pre class="request-details-content">{{ requestDetails }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Refresh,
  Plus,
  VideoPlay,
  Edit,
  Document,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRouter } from "vue-router";

// 路由
const router = useRouter();

// API列表相关
const apiList = ref<any[]>([]);
const detailsVisible = ref(false);
const selectedApi = ref<any>(null);
const loadingEditId = ref<number | null>(null);

// API日志相关
const logsVisible = ref(false);
const selectedApiName = ref("");
const selectedApiId = ref<number | null>(null);
const apiLogs = ref<any[]>([]);
const loadingLogs = ref(false);
const loadingLogsId = ref<number | null>(null);
const logsTotal = ref(0);
const logsPageSize = ref(20);
const logsCurrentPage = ref(1);
const requestDetailsVisible = ref(false);
const requestDetails = ref("");

// 初始化
onMounted(() => {
  fetchApiList();
});

// 获取API列表
const fetchApiList = async () => {
  try {
    // 从服务器获取API列表
    const response = await fetch("/api/admin/routes");

    if (!response.ok) {
      const error = (await response.json()) as { statusMessage?: string };
      throw new Error(error.statusMessage || "获取API列表失败");
    }

    const data = (await response.json()) as {
      success: boolean;
      routes: any[];
    };

    if (data.success && Array.isArray(data.routes)) {
      apiList.value = data.routes;
      // ElMessage.success("API列表刷新成功");
    } else {
      throw new Error("获取API列表返回格式错误");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取API列表失败");
  }
};

// 查看API详情
const viewApiDetails = (api: any) => {
  selectedApi.value = api;
  detailsVisible.value = true;
};

// 删除API
const deleteApi = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个API吗？这个操作不可逆。",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 调用删除API接口
    const response = await fetch(`/api/admin/routes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = (await response.json()) as { statusMessage?: string };
      throw new Error(error.statusMessage || "删除API失败");
    }

    ElMessage.success("API删除成功");
    fetchApiList();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除API失败");
    }
  }
};

// 生成API URL
const apiUrl = (api: any) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}${api.path}`;
};

// 跳转到API测试页面
const testApi = (api: any) => {
  router.push({
    path: "/api-tester",
    query: { apiId: api.id },
  });
};

// 跳转到API编辑页面
const editApi = (api: any) => {
  loadingEditId.value = api.id;

  // 先检查API是否存在
  fetch(`/api/admin/routes/${api.id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("API不存在或已被删除");
      }
      return response.json();
    })
    .then(() => {
      router.push({
        path: "/create-api",
        query: { id: api.id },
      });
    })
    .catch((error) => {
      ElMessage.error({
        message: error.message || "无法编辑API，请刷新列表后重试",
        duration: 5000,
      });
      fetchApiList(); // 刷新列表
    })
    .finally(() => {
      loadingEditId.value = null;
    });
};

// 查看API调用日志
const viewApiLogs = async (api: any) => {
  selectedApiName.value = api.name;
  selectedApiId.value = api.id;
  logsCurrentPage.value = 1;
  logsVisible.value = true;
  loadingLogsId.value = api.id;

  await fetchApiLogs();

  loadingLogsId.value = null;
};

// 获取API调用日志
const fetchApiLogs = async () => {
  if (!selectedApiId.value) return;

  loadingLogs.value = true;

  try {
    const offset = (logsCurrentPage.value - 1) * logsPageSize.value;
    const response = await fetch(
      `/api/admin/logs/route/${selectedApiId.value}?limit=${logsPageSize.value}&offset=${offset}`
    );

    if (!response.ok) {
      const error = (await response.json()) as { statusMessage?: string };
      throw new Error(error.statusMessage || "获取API调用日志失败");
    }

    const data = (await response.json()) as {
      success: boolean;
      logs: any[];
      meta: {
        total: number;
        limit: number;
        offset: number;
      };
    };

    if (data.success) {
      apiLogs.value = data.logs;
      logsTotal.value = data.meta.total;
    } else {
      apiLogs.value = [];
      logsTotal.value = 0;
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取API调用日志失败");
    apiLogs.value = [];
    logsTotal.value = 0;
  } finally {
    loadingLogs.value = false;
  }
};

// 处理日志分页变化
const handleLogsPageChange = (page: number) => {
  logsCurrentPage.value = page;
  fetchApiLogs();
};

// 格式化请求数据
const formatRequestData = (requestData: string) => {
  try {
    const data = JSON.parse(requestData);
    return JSON.stringify(data, null, 2);
  } catch {
    return requestData || "无数据";
  }
};

// 获取状态码对应的标签类型
const getStatusType = (status: number) => {
  if (status >= 200 && status < 300) {
    return "success";
  } else if (status >= 400 && status < 500) {
    return "warning";
  } else if (status >= 500) {
    return "danger";
  }
  return "info";
};

// 查看请求详情
const viewRequestDetails = (requestData: string) => {
  try {
    const data = JSON.parse(requestData);
    requestDetails.value = JSON.stringify(data, null, 2);
  } catch {
    requestDetails.value = requestData || "无数据";
  }

  requestDetailsVisible.value = true;
};
</script>

<style scoped>
.api-list {
  padding: 20px;
}

.api-content {
  margin-top: 20px;
}

.api-actions {
  display: flex;
  gap: 10px;
}

.sql-query-display {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: "Courier New", monospace;
}

.api-test-link {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
}

.logs-stats {
  margin-bottom: 20px;
}

.request-data {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.request-details-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: "Courier New", monospace;
  max-height: 400px;
  overflow-y: auto;
}
</style>
