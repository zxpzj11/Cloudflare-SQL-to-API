<template>
  <el-header class="app-header">
    <div class="header-title">
      <h2>SQL to API | 数据库API管理系统</h2>
    </div>
    <div class="header-menu">
      <el-menu
        mode="horizontal"
        :router="true"
        :default-active="activeRoute"
        class="main-menu"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/api-list">API管理</el-menu-item>
        <el-menu-item index="/table-list">表管理</el-menu-item>
        <el-menu-item index="/api-logs">API日志</el-menu-item>
        <el-menu-item index="/api-tester">API测试</el-menu-item>
        <el-menu-item index="/docs">文档</el-menu-item>
      </el-menu>
    </div>
    <!-- <div class="header-actions">
      <a
        href="https://github.com/你的用户名/你的仓库"
        target="_blank"
        class="github-link"
        title="GitHub 仓库"
      >
        <el-icon><Platform /></el-icon>
      </a>
    </div> -->
  </el-header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Platform } from "@element-plus/icons-vue";

// 获取当前路由路径
const route = useRoute();
const activeRoute = computed(() => route.path);
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e0e0e0;
}

.header-title h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-menu {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.main-menu {
  border-bottom: none;
}

.github-link {
  font-size: 22px;
  color: #606266;
  transition: color 0.3s;
}

.github-link:hover {
  color: #409eff;
}
</style>
