<template>
  <!-- <el-header class="app-header">
    <div class="header-title">
      <h2>SQL to API - Cloudflare Workers</h2>
    </div>
    <div class="header-actions">
      <a
        href="https://github.com/123xiao/Cloudflare-SQL-to-API"
        target="_blank"
        class="github-link"
        title="GitHub 仓库"
      >
        <el-icon><Platform /></el-icon>
      </a>
    </div>
  </el-header> -->
</template>

<script setup lang="ts">
import { Platform } from "@element-plus/icons-vue";
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

.github-link {
  font-size: 22px;
  color: #606266;
  transition: color 0.3s;
}

.github-link:hover {
  color: #409eff;
}
</style>
