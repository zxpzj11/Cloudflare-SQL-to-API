<template>
  <div class="app-container">
    <el-container>
      <el-aside width="200px">
        <el-menu default-active="/" class="el-menu-vertical" router>
          <el-menu-item index="/">
            <el-icon><el-icon-house /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/create-api">
            <el-icon><el-icon-plus /></el-icon>
            <span>创建API</span>
          </el-menu-item>
          <el-menu-item index="/api-list">
            <el-icon><el-icon-menu /></el-icon>
            <span>API列表</span>
          </el-menu-item>
          <el-menu-item index="/api-logs">
            <el-icon><el-icon-data-analysis /></el-icon>
            <span>API日志</span>
          </el-menu-item>
          <el-menu-item index="/api-tester">
            <el-icon><el-icon-tickets /></el-icon>
            <span>API测试</span>
          </el-menu-item>
          <el-menu-item index="/docs">
            <el-icon><el-icon-document /></el-icon>
            <span>使用文档</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <!-- <el-header>
          <h2>SQL to API - Cloudflare Workers</h2>
        </el-header> -->
        <el-main>
          <el-card>
            <template #header>
              <div class="card-header">
                <h3>欢迎使用SQL to API平台</h3>
              </div>
            </template>
            <div class="welcome-content">
              <p>
                这是一个基于Cloudflare Workers和D1数据库的SQL到API转换平台。
              </p>
              <p>您可以通过简单地编写SQL查询，快速创建REST API端点。</p>

              <el-divider>功能特点</el-divider>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-card class="feature-card">
                    <el-icon class="feature-icon"
                      ><el-icon-magic-stick
                    /></el-icon>
                    <h4>简单易用</h4>
                    <p>只需编写SQL语句，即可发布REST API</p>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="feature-card">
                    <el-icon class="feature-icon"
                      ><el-icon-lightning
                    /></el-icon>
                    <h4>高性能</h4>
                    <p>基于Cloudflare全球网络，快速响应请求</p>
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="feature-card">
                    <el-icon class="feature-icon"><el-icon-lock /></el-icon>
                    <h4>安全可靠</h4>
                    <p>内置SQL注入防护，保障数据安全</p>
                  </el-card>
                </el-col>
              </el-row>

              <el-divider>开始使用</el-divider>

              <el-button type="primary" @click="$router.push('/create-api')">
                开始创建API
              </el-button>
            </div>
          </el-card>
        </el-main>
        <el-footer>
          <p>
            © 2025 SQL to API Platform | Powered by
            <a
              href="https://github.com/123xiao/Cloudflare-SQL-to-API"
              target="_blank"
              >Cloudflare-SQL-to-API</a
            >
          </p>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import {
  House as ElIconHouse,
  Connection as ElIconConnection,
  Tickets as ElIconTickets,
  MagicStick as ElIconMagicStick,
  Lightning as ElIconLightning,
  Lock as ElIconLock,
  Document as ElIconDocument,
  Plus as ElIconPlus,
  Menu as ElIconMenu,
  DataAnalysis as ElIconDataAnalysis,
} from "@element-plus/icons-vue";
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.el-aside {
  background-color: #f5f7fa;
  color: #333;
  border-right: 1px solid #dcdfe6;
}

.el-footer {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}

.el-menu-vertical {
  height: 100%;
  border-right: none;
}

.el-card {
  margin-bottom: 20px;
}

.feature-card {
  text-align: center;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  font-size: 30px;
  color: #409eff;
  margin-bottom: 10px;
}

.welcome-content {
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
