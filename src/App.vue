<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { onMounted, ref } from 'vue';

function generateUserToken() {
  // Generate a random 8-character hexadecimal string
  return Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const userToken = ref<string | null>(null);

function isHexToken(str: string) {
  return /^[0-9a-fA-F]{8}$/.test(str);
}

const showTokenPrompt = ref(false);
const tokenInput = ref('');
const dialogMode = ref<'choice' | 'input' | 'create'>('choice');

onMounted(() => {
  const token = localStorage.getItem('user_token');
  if (token && isHexToken(token)) {
    userToken.value = token;
  } else {
    showTokenPrompt.value = true;
    dialogMode.value = 'choice';
  }
});

function chooseInput() {
  dialogMode.value = 'input';
}
function chooseCreate() {
  dialogMode.value = 'create';
  createNewToken();
}
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
  // Keep dialog open so user can see/copy token
}
</script>

<template>
  <div>
    <div v-if="showTokenPrompt" class="token-dialog-backdrop">
      <div class="token-dialog">
        <h2>User Token Required</h2>
        <div v-if="dialogMode === 'choice'">
          <p>Please choose an option:</p>
          <button @click="chooseInput">Enter existing user token</button>
          <button @click="chooseCreate">Create new user token</button>
        </div>
        <div v-if="dialogMode === 'input'" class="token-input-section">
          <input v-model="tokenInput" placeholder="Enter your user token" maxlength="8" />
          <button @click="submitToken">Submit</button>
        </div>
        <div v-if="dialogMode === 'create'" class="token-create-section">
          <div>
            Your new token: <b>{{ userToken }}</b>
          </div>
          <div style="margin-top: 1rem">
            <button @click="showTokenPrompt = false">Continue</button>
          </div>
        </div>
      </div>
    </div>
    <div class="layout" v-else>
      <nav class="navbar">
        <RouterLink to="/" active-class="active">Trading</RouterLink>
        <RouterLink to="/stations" active-class="active">Stations</RouterLink>
        <RouterLink to="/items" active-class="active">Items</RouterLink>
        <div class="user-token-bar">
          <span
            >User Token: <code>{{ userToken }}</code></span
          >
        </div>
      </nav>
      <main class="main-content">
        <Suspense>
          <template #default>
            <RouterView />
          </template>
          <template #fallback>
            <div class="loading">Loading view...</div>
          </template>
        </Suspense>
      </main>
    </div>
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

/* Dialog styles */ .token-dialog-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height:
100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
z-index: 1000; } .token-dialog { background: #fff; padding: 2rem 2.5rem; border-radius: 10px;
box-shadow: 0 2px 16px rgba(0,0,0,0.2); min-width: 320px; text-align: center; } .token-dialog button
{ margin: 0.5rem 0.5rem 1rem 0.5rem; padding: 0.5rem 1.2rem; font-size: 1rem; border-radius: 6px;
border: none; background: #1976d2; color: #fff; cursor: pointer; transition: background 0.2s; }
.token-dialog button:hover { background: #125ea2; } .token-input-section, .token-create-section {
margin-top: 1rem; } .token-input-section input { padding: 0.4rem 0.8rem; font-size: 1rem;
border-radius: 4px; border: 1px solid #ccc; margin-right: 0.5rem; }
