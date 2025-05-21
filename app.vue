<template>
  <div class="app-root">
    <AppHeader v-if="!isLoginPage" />
    <NuxtPage />
    <GithubCorner />
  </div>
</template>

<script setup lang="ts">
// 全局引入Element Plus样式
import "element-plus/dist/index.css";
import GithubCorner from "~/components/GithubCorner.vue";
import AppHeader from "~/components/AppHeader.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isLoginPage = computed(() => route.path === "/login");
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
