<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
</script>

<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/" active-class="active">Opportunities</RouterLink>
      <RouterLink to="/stations" active-class="active">Stations</RouterLink>
      <RouterLink to="/items" active-class="active">Items</RouterLink>
      <RouterLink to="/trade-chain" active-class="active">Trade Chain</RouterLink>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.navbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f5f5f5;
  padding: 2rem 1rem;
  width: 220px;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100vh;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
}

.main-content {
  margin-left: 220px;
  padding: 2rem;
  flex: 1;
}

.active {
  font-weight: bold;
  color: #42b883;
  text-decoration: underline;
}
</style>
