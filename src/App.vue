<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { onMounted, ref } from 'vue';


function generateUserToken() {
  // Generate a random 8-character hexadecimal string
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const userToken = ref<string | null>(null);



function isHexToken(str: string) {
  return /^[0-9a-fA-F]{8}$/.test(str);
}

const showTokenPrompt = ref(false);
const tokenInput = ref('');

onMounted(() => {
  const token = localStorage.getItem('user_token');
  if (token && isHexToken(token)) {
    userToken.value = token;
  } else {
    showTokenPrompt.value = true;
  }
});

function submitToken() {
  const val = tokenInput.value.trim();
  if (isHexToken(val)) {
    localStorage.setItem('user_token', val);
    userToken.value = val;
    showTokenPrompt.value = false;
  }
}

function createNewToken() {
  const newToken = generateUserToken();
  localStorage.setItem('user_token', newToken);
  userToken.value = newToken;
  showTokenPrompt.value = false;
}
</script>

<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/" active-class="active">Trading</RouterLink>
      <RouterLink to="/stations" active-class="active">Stations</RouterLink>
      <RouterLink to="/items" active-class="active">Items</RouterLink>
      <div class="user-token-bar">
        <span>User Token: <code>{{ userToken }}</code></span>
      </div>
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
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
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

.user-token-bar {
  margin-top: 32px;
  padding: 10px 0 0 0;
  text-align: center;
  font-size: 0.98rem;
  color: #888;
  border-top: 1px solid #e0e0e0;
}

.user-token-bar code {
  background: #f3f3f3;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.98em;
  color: #1976d2;
}
</style>
