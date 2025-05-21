<template>
  <div class="api-tester">
    <el-page-header
      @back="$router.go(-1)"
      title="返回"
      :content="'API测试工具'"
    />

    <div class="tester-content">
      <el-card class="tester-card">
        <template #header>
          <div class="card-header">
            <h3>API测试工具</h3>
          </div>
        </template>

        <el-form :model="testForm" label-width="120px">
          <el-form-item label="选择API">
            <el-select
              v-model="testForm.selectedApi"
              placeholder="选择要测试的API"
              @change="onApiSelected"
            >
              <el-option
                v-for="api in apiList"
                :key="api.id"
                :label="`${api.name} (${api.method} ${api.path})`"
                :value="api.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="请求URL" v-if="testForm.selectedApi">
            <el-input v-model="testForm.url" disabled />
          </el-form-item>

          <el-form-item label="HTTP方法" v-if="testForm.selectedApi">
            <el-tag :type="methodTagType">{{ testForm.method }}</el-tag>
          </el-form-item>

          <template v-if="testForm.selectedApi && testForm.params.length > 0">
            <el-divider>参数</el-divider>

            <el-form-item
              v-for="param in testForm.params"
              :key="param.name"
              :label="param.name"
              :required="param.required"
            >
              <el-input
                v-if="param.type === 'string'"
                v-model="param.value"
                :placeholder="`${param.description || '输入参数值'}`"
              />
              <el-input-number
                v-else-if="param.type === 'number'"
                v-model="param.value"
                :placeholder="`${param.description || '输入参数值'}`"
              />
              <el-switch
                v-else-if="param.type === 'boolean'"
                v-model="param.value"
              />
              <el-date-picker
                v-else-if="param.type === 'date'"
                v-model="param.value"
                type="date"
                :placeholder="`${param.description || '选择日期'}`"
              />
            </el-form-item>
          </template>

          <el-form-item
            v-if="testForm.selectedApi && testForm.method !== 'GET'"
          >
            <el-divider>请求体 (JSON)</el-divider>
            <client-only>
              <div class="editor-container">
                <div ref="jsonEditorContainer" class="json-editor"></div>
              </div>
              <template #fallback>
                <div class="editor-placeholder">
                  <el-skeleton :rows="5" animated />
                </div>
              </template>
            </client-only>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="sendRequest"
              :disabled="!testForm.selectedApi"
            >
              发送请求
            </el-button>
            <el-button @click="resetTest">重置</el-button>
          </el-form-item>
        </el-form>

        <el-divider v-if="testForm.selectedApi">响应结果</el-divider>

        <div v-if="response.loading" class="response-loading">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="response.data" class="response-container">
          <div class="response-meta">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="状态">
                <el-tag
                  :type="
                    response.status >= 200 && response.status < 300
                      ? 'success'
                      : 'danger'
                  "
                >
                  {{ response.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="耗时"
                >{{ response.time }}ms</el-descriptions-item
              >
              <el-descriptions-item label="大小">{{
                formatBytes(response.size)
              }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <el-tabs v-model="responseTab" class="response-tabs">
            <el-tab-pane label="响应数据" name="data">
              <pre class="response-json">{{
                JSON.stringify(response.data, null, 2)
              }}</pre>
            </el-tab-pane>
            <el-tab-pane label="响应头" name="headers">
              <el-table :data="headersData" style="width: 100%">
                <el-table-column prop="name" label="名称" width="200" />
                <el-table-column prop="value" label="值" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>

    <!-- 添加页脚组件 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  nextTick,
  computed,
  shallowRef,
  onUnmounted,
} from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import { useNuxtApp } from "#app";
import AppFooter from "~/components/AppFooter.vue";

// 获取路由
const route = useRoute();

// 获取nuxt应用实例，用于访问loadMonacoCDN函数
const nuxtApp = useNuxtApp();

// API列表
const apiList = ref<any[]>([]);

// 响应标签页
const responseTab = ref("data");

// 表单数据
const testForm = reactive({
  selectedApi: null as number | null,
  url: "",
  method: "",
  params: [] as Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    value: any;
  }>,
  jsonBody: "{}",
});

// 响应数据
const response = reactive({
  loading: false,
  data: null as any,
  status: 0,
  time: 0,
  size: 0,
  headers: new Map<string, string>(),
});

// 响应头数据
const headersData = ref<Array<{ name: string; value: string }>>([]);

// JSON编辑器相关
const jsonEditorContainer = ref<HTMLElement | null>(null);
const monaco = shallowRef();
const jsonEditor = shallowRef();

// 初始化
onMounted(async () => {
  // 设置页面标题 (确保只在客户端运行)
  document.title = "SQL to API - API测试工具";

  await fetchApiList();

  // 使用CDN加载Monaco编辑器
  if (typeof window !== "undefined") {
    try {
      monaco.value = await nuxtApp.$loadMonacoCDN();
      if (monaco.value) {
        await nextTick();
        initJsonEditor();

        // 添加窗口大小变化的监听器，确保编辑器正确调整大小
        window.addEventListener("resize", () => {
          if (jsonEditor.value) {
            jsonEditor.value.layout();
          }
        });
      }
    } catch (error) {
      console.error("Failed to load monaco-editor:", error);
      ElMessage.error("编辑器加载失败，请刷新页面重试");
    }
  }

  // 从URL参数中获取预选的API ID
  const apiIdFromUrl = route.query.apiId;
  if (apiIdFromUrl) {
    // 确保apiList已经加载完成
    if (apiList.value.length > 0) {
      // 转换为数字类型并设置选中的API
      const apiId = Number(apiIdFromUrl);
      if (!isNaN(apiId)) {
        testForm.selectedApi = apiId;
        onApiSelected(apiId);
      }
    } else {
      // 如果API列表尚未加载，等待列表加载后再次尝试选择API
      const checkApiListInterval = setInterval(() => {
        if (apiList.value.length > 0) {
          clearInterval(checkApiListInterval);
          const apiId = Number(apiIdFromUrl);
          if (!isNaN(apiId)) {
            testForm.selectedApi = apiId;
            onApiSelected(apiId);
          }
        }
      }, 500);

      // 设置超时以防止无限检查
      setTimeout(() => clearInterval(checkApiListInterval), 5000);
    }
  }
});

// 在组件卸载时清理
onUnmounted(() => {
  // 移除事件监听器
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", () => {
      if (jsonEditor.value) {
        jsonEditor.value.layout();
      }
    });
  }

  // 销毁编辑器实例
  if (jsonEditor.value) {
    jsonEditor.value.dispose();
  }
});

// 初始化JSON编辑器
const initJsonEditor = () => {
  if (!monaco.value || !jsonEditorContainer.value) return;

  try {
    jsonEditor.value = monaco.value.editor.create(jsonEditorContainer.value, {
      value: testForm.jsonBody,
      language: "json",
      theme: "vs",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: "on",
      glyphMargin: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      automaticLayout: true, // 添加自动布局支持
    });

    jsonEditor.value.onDidChangeModelContent(() => {
      try {
        const value = jsonEditor.value?.getValue() || "{}";
        JSON.parse(value); // 验证JSON有效性
        testForm.jsonBody = value;
      } catch (e) {
        // JSON无效，不更新
      }
    });

    // 强制编辑器重新计算布局
    jsonEditor.value.layout();
  } catch (error) {
    console.error("Monaco editor initialization failed:", error);
    ElMessage.error("编辑器初始化失败，请刷新页面重试");
  }
};

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
      // 只显示公开的API，或者之后实现认证后可以显示所有API
      apiList.value = data.routes.filter((route: any) => route.is_public);
    } else {
      throw new Error("获取API列表返回格式错误");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取API列表失败");
  }
};

// 选择API时的处理
const onApiSelected = (apiId: number) => {
  const api = apiList.value.find((a) => a.id === apiId);
  if (!api) return;

  testForm.url = window.location.origin + api.path;
  testForm.method = api.method;

  // 解析参数
  testForm.params = [];
  try {
    const params = JSON.parse(api.params || "{}");
    for (const [name, config] of Object.entries(params)) {
      testForm.params.push({
        name,
        type: (config as any).type || "string",
        required: (config as any).required || false,
        description: (config as any).description || "",
        value: null,
      });
    }
  } catch (e) {
    console.error("解析参数错误", e);
  }

  // 重置响应
  response.data = null;

  // 重置JSON编辑器
  if (jsonEditor.value) {
    jsonEditor.value.setValue("{}");
  }
};

// 发送请求
const sendRequest = async () => {
  if (!testForm.selectedApi) return;

  // 检查必填参数
  const missingParams = testForm.params
    .filter((p) => p.required && (p.value === null || p.value === undefined))
    .map((p) => p.name);

  if (missingParams.length > 0) {
    ElMessage.warning(`请填写必填参数: ${missingParams.join(", ")}`);
    return;
  }

  response.loading = true;
  const startTime = Date.now();

  try {
    // 构建请求参数
    let url = testForm.url;
    let requestInit: RequestInit = {
      method: testForm.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // 处理GET请求参数
    if (testForm.method === "GET" && testForm.params.length > 0) {
      const queryParams = new URLSearchParams();
      testForm.params.forEach((param) => {
        if (param.value !== null && param.value !== undefined) {
          queryParams.append(param.name, String(param.value));
        }
      });
      url = `${url}?${queryParams.toString()}`;
    }
    // 处理其他请求方法的请求体
    else if (testForm.method !== "GET") {
      let bodyData: any = {};

      // 添加表单中的参数
      testForm.params.forEach((param) => {
        if (param.value !== null && param.value !== undefined) {
          bodyData[param.name] = param.value;
        }
      });

      // 合并JSON编辑器中的JSON
      try {
        if (jsonEditor.value) {
          const editorJson = JSON.parse(jsonEditor.value.getValue());
          bodyData = { ...bodyData, ...editorJson };
        }
      } catch (e) {
        ElMessage.warning("JSON请求体格式无效");
        response.loading = false;
        return;
      }

      requestInit.body = JSON.stringify(bodyData);
    }

    // 发送请求
    const res = await fetch(url, requestInit);

    // 计算时间
    const endTime = Date.now();
    response.time = endTime - startTime;

    // 处理响应头
    response.headers.clear();
    headersData.value = [];
    res.headers.forEach((value, name) => {
      response.headers.set(name, value);
      headersData.value.push({ name, value });
    });

    // 处理响应状态
    response.status = res.status;

    // 处理响应数据
    const data = await res.json();
    response.data = data;

    // 计算大小
    response.size = new TextEncoder().encode(JSON.stringify(data)).length;
  } catch (error: any) {
    ElMessage.error(error.message || "请求发送失败");
    response.data = { error: error.message || "请求失败" };
  } finally {
    response.loading = false;
  }
};

// 重置测试
const resetTest = () => {
  testForm.selectedApi = null;
  testForm.url = "";
  testForm.method = "";
  testForm.params = [];

  if (jsonEditor.value) {
    jsonEditor.value.setValue("{}");
  }

  response.data = null;
};

// 格式化字节大小
const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 计算HTTP方法对应的Tag类型
const methodTagType = computed(() => {
  switch (testForm.method) {
    case "GET":
      return "success";
    case "POST":
      return "primary";
    case "PUT":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "info";
  }
});
</script>

<style scoped>
.api-tester {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tester-content {
  margin-top: 20px;
  flex: 1;
}

.tester-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-top: 10px;
}

.json-editor {
  height: 180px;
  width: 1000px;
}

.response-container {
  margin-top: 20px;
}

.response-meta {
  margin-bottom: 20px;
}

.response-json {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: "Courier New", monospace;
  font-size: 14px;
}

.response-tabs {
  margin-top: 20px;
}

.response-loading {
  margin-top: 20px;
}

.editor-placeholder {
  height: 180px;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}
</style>
