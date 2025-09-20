<template>
  <div>
    <h1>Items</h1>
    <form @submit.prevent="addItem">
      <input v-model="newItemName" placeholder="New item name" />
      <input v-model.number="newItemValue" type="number" placeholder="Value" />
      <button type="submit">Add Item</button>
    </form>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }} (Value: {{ item.value }})
        <button @click="removeItem(item.id)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import type { Item } from '../item';
import { getItemsCache, setItemsCache, clearItemsCache } from '../cache';



const items = ref<Item[]>(getItemsCache() ?? []);
const newItemName = ref('');
const newItemValue = ref(0);
const userToken = localStorage.getItem('user_token');



async function fetchItemsIfNeeded() {
  if (!userToken) return;
  let cached = getItemsCache();
  if (!cached) {
  const res = await fetch(`https://nms-trade-backend.onrender.com/api/items?userToken=${userToken}`);
    cached = await res.json();
  if (cached) setItemsCache(cached);
  }
  items.value = cached ?? [];
}


onMounted(() => {
  fetchItemsIfNeeded();
});



async function addItem() {
  if (!newItemName.value.trim() || !userToken) return;
  // Find max id on backend
  const maxId = items.value.length ? Math.max(...items.value.map((i) => i.id)) : 0;
  const newItem: Item = {
    name: newItemName.value.trim(),
    id: maxId + 1,
    value: newItemValue.value,
  };
  await fetch('https://nms-trade-backend.onrender.com/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...newItem, userToken })
  });
  clearItemsCache();
  await fetchItemsIfNeeded();
  newItemName.value = '';
  newItemValue.value = 0;
}



async function removeItem(id: number) {
  if (!userToken) return;
  await fetch(`https://nms-trade-backend.onrender.com/api/items/${id}?userToken=${userToken}`, { method: 'DELETE' });
  clearItemsCache();
  await fetchItemsIfNeeded();
}
</script>
