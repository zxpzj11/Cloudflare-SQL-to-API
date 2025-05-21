<template>
  <div class="docs-page">
    <el-page-header @back="$router.go(-1)" title="返回" :content="'使用文档'" />

    <el-card class="docs-card">
      <template #header>
        <div class="card-header">
          <h2>SQL to API 使用文档</h2>
        </div>
      </template>

      <el-scrollbar height="calc(100vh - 200px)">
        <div class="docs-content">
          <h3>介绍</h3>
          <p>
            SQL to API是一个让您能够通过编写SQL语句快速创建REST
            API的平台。本文档将指导您如何使用该平台的各项功能。
          </p>

          <el-divider />

          <h3>快速开始</h3>
          <ol>
            <li>在左侧菜单中，点击<strong>API管理</strong>。</li>
            <li>切换到<strong>创建API</strong>标签页。</li>
            <li>填写API名称、描述、路径和HTTP方法。</li>
            <li>在SQL编辑器中输入您想要执行的SQL查询。</li>
            <li>如果需要参数，点击<strong>添加参数</strong>按钮。</li>
            <li>点击<strong>创建API</strong>按钮提交您的API。</li>
          </ol>

          <el-divider />

          <h3>SQL编写指南</h3>
          <p>您可以使用标准SQL语法编写查询，但有以下限制：</p>
          <ul>
            <li>
              不允许使用<code>DROP</code>和<code>ALTER</code>语句以保护数据库安全。
            </li>
            <li>
              支持<code>SELECT</code>、<code>INSERT</code>、<code>UPDATE</code>和<code>DELETE</code>操作。
            </li>
            <li>
              确保查询针对已存在的表，例如<code>users</code>、<code>api_routes</code>等。
            </li>
          </ul>

          <h4>示例查询</h4>
          <el-collapse>
            <el-collapse-item title="基本查询" name="1">
              <pre>
SELECT * FROM users WHERE id > 10 ORDER BY created_at DESC LIMIT 20</pre
              >
            </el-collapse-item>
            <el-collapse-item title="带参数的查询" name="2">
              <pre>
SELECT * FROM users WHERE username LIKE :search ORDER BY id</pre
              >
              <p>参数定义：</p>
              <ul>
                <li>search (字符串): 用户名搜索关键字</li>
              </ul>
            </el-collapse-item>
            <el-collapse-item title="插入数据" name="3">
              <pre>
INSERT INTO users (username, email) VALUES (:username, :email)</pre
              >
              <p>参数定义：</p>
              <ul>
                <li>username (字符串): 用户名</li>
                <li>email (字符串): 电子邮箱</li>
              </ul>
            </el-collapse-item>
            <el-collapse-item title="更新数据" name="4">
              <pre>UPDATE users SET username = :username WHERE id = :id</pre>
              <p>参数定义：</p>
              <ul>
                <li>username (字符串): 新用户名</li>
                <li>id (数字): 用户ID</li>
              </ul>
            </el-collapse-item>
          </el-collapse>

          <el-divider />

          <h3>参数定义</h3>
          <p>
            您可以在SQL查询中使用<code>:参数名</code>的形式定义参数，然后在参数定义表格中添加对应的参数配置：
          </p>
          <ul>
            <li>
              <strong>参数名</strong>：必须与SQL中的<code>:参数名</code>匹配
            </li>
            <li><strong>类型</strong>：支持字符串、数字、布尔值和日期类型</li>
            <li><strong>必填</strong>：设置参数是否为必填项</li>
            <li><strong>描述</strong>：参数用途说明</li>
          </ul>

          <el-divider />

          <h3>API测试</h3>
          <p>创建API后，您可以使用<strong>API测试</strong>工具验证您的API：</p>
          <ol>
            <li>在左侧菜单点击<strong>API测试</strong>。</li>
            <li>从下拉菜单选择您要测试的API。</li>
            <li>如果API需要参数，填写参数值。</li>
            <li>对于非GET请求，您可以在JSON编辑器中添加额外的请求体内容。</li>
            <li>点击<strong>发送请求</strong>按钮。</li>
            <li>在响应区域查看API调用结果。</li>
          </ol>

          <el-divider />

          <h3>安全建议</h3>
          <ul>
            <li>
              谨慎使用<strong>公开API</strong>选项，公开API不需要认证即可访问。
            </li>
            <li>对于敏感操作，确保使用适当的权限控制。</li>
            <li>定期检查API日志以监控使用情况。</li>
            <li>不要在SQL中硬编码敏感信息，而是使用参数传递。</li>
          </ul>

          <el-divider />

          <h3>故障排除</h3>
          <el-collapse>
            <el-collapse-item title="API创建失败" name="trouble1">
              <ul>
                <li>检查SQL语法是否正确</li>
                <li>确保路径和方法组合唯一</li>
                <li>路径应只包含字母、数字、下划线和连字符</li>
              </ul>
            </el-collapse-item>
            <el-collapse-item title="API调用返回404" name="trouble2">
              <ul>
                <li>确认API路径是否正确</li>
                <li>检查HTTP方法是否匹配</li>
                <li>确保API已成功创建</li>
              </ul>
            </el-collapse-item>
            <el-collapse-item title="API调用参数错误" name="trouble3">
              <ul>
                <li>检查参数名称是否与定义匹配</li>
                <li>确保提供了所有必需参数</li>
                <li>检查参数值的类型是否正确</li>
              </ul>
            </el-collapse-item>
          </el-collapse>

          <el-divider />

          <h3>联系我们</h3>
          <p>如果您有任何问题或建议，请联系我们的支持团队。</p>

          <!-- <div class="footer-info">
            <p>SQL to API平台 - 版本 1.0.0</p>
            <p>© 2025 版权所有</p>
          </div> -->
        </div>
      </el-scrollbar>
    </el-card>

    <!-- 添加页脚组件 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import AppFooter from "~/components/AppFooter.vue";

// 设置页面标题 (确保只在客户端运行)
onMounted(() => {
  document.title = "SQL to API - 使用文档";
});

// 无需额外的逻辑
</script>

<style scoped>
.docs-page {
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.docs-card {
  margin-top: 20px;
  flex: 1;
}

.docs-content {
  padding: 10px;
}

.card-header {
  display: flex;
  align-items: center;
}

.docs-content h3 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #409eff;
}

.docs-content h4 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: #606266;
}

.docs-content p,
.docs-content ul,
.docs-content ol {
  margin-bottom: 1em;
  line-height: 1.6;
}

pre {
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-family: "Courier New", monospace;
  margin-bottom: 10px;
}

code {
  background-color: #f8f8f8;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
}

.footer-info {
  margin-top: 40px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
