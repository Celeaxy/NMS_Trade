<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
// Vuetify components
import {
  VApp,
  VAppBar,
  VAppBarNavIcon,
  VDivider,
  VAppBarTitle,
  VNavigationDrawer,
  VList,
  VListItem,
  VBtn,
  VSpacer,
  VMain,
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VTextField,
} from 'vuetify/components';
import { useDisplay } from 'vuetify';

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

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const drawer = ref(!isMobile.value);

function toggleDrawer() {
  if (isMobile.value) {
    drawer.value = !drawer.value;
  }
}

import { useRouter } from 'vue-router';

const searchQuery = ref('');
const router = useRouter();

async function search() {
  if (!searchQuery.value.trim()) return;
  router.push({ name: 'Search', query: { q: searchQuery.value } });
}
</script>

<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon
        @click="toggleDrawer"
        class="d-md-flex"
        v-if="isMobile"
      ></v-app-bar-nav-icon>
      <v-app-bar-title>NMS Trade</v-app-bar-title>

      <v-text-field
        v-model="searchQuery"
        append-inner-icon="mdi-magnify"
        density="compact"
        label="Search items"
        variant="solo"
        hide-details
        single-line
        @click:append-inner="search"
        @keydown.enter="search"
        clearable
        class="mx-5"
      />
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      app
      class="d-md-flex"
      :temporary="isMobile"
      :permanent="!isMobile"
    >
      <v-list nav>
        <v-list-item>
          <RouterLink to="/" @click.native="toggleDrawer">Trading</RouterLink>
        </v-list-item>
        <v-list-item>
          <RouterLink to="/stations" @click.native="toggleDrawer">Stations</RouterLink>
        </v-list-item>
        <v-list-item>
          <RouterLink to="/items" @click.native="toggleDrawer">Items</RouterLink>
        </v-list-item>
        <v-divider />
        <v-list-item>
          <div class="user-token-bar v-user-token-bar">
            <span
              >User Token: <code>{{ userToken }}</code></span
            >
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <RouterView />
    </v-main>
    <v-dialog v-model="showTokenPrompt" persistent max-width="400">
      <v-card>
        <v-card-title>User Token</v-card-title>
        <v-card-text>
          <v-text-field v-model="tokenInput" label="Enter your user token" type="password" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitToken">Save</v-btn>
          <v-btn variant="text" @click="showTokenPrompt = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<style scoped>
.v-user-token-bar {
  margin: 16px 0 0 0;
  text-align: center;
  font-size: 0.98rem;
  color: #888;
}
.v-user-token-bar code {
  background: #f3f3f3;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.98em;
  color: #1976d2;
}

/* Dialog styles */
.token-dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.token-dialog {
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
  min-width: 320px;
  text-align: center;
}
.token-dialog button {
  margin: 0.5rem 0.5rem 1rem 0.5rem;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  border-radius: 6px;
  border: none;
  background: #1976d2;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.token-dialog button:hover {
  background: #125ea2;
}
.token-input-section,
.token-create-section {
  margin-top: 1rem;
}
.token-input-section input {
  padding: 0.4rem 0.8rem;
  font-size: 1rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-right: 0.5rem;
}
</style>
