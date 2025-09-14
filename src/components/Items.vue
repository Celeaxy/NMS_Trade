
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
import { getLocalStorageItem, setLocalStorageItem } from '../storage';

const items = ref<Item[]>([]);
const newItemName = ref('');
const newItemValue = ref(0);

onMounted(() => {
  items.value = getLocalStorageItem<Item[]>('items') ?? [];
});

function addItem() {
  if (!newItemName.value.trim()) return;
  const newItem: Item = {
    name: newItemName.value.trim(),
    id: items.value.length ? Math.max(...items.value.map(i => i.id)) + 1 : 1,
    value: newItemValue.value
  };
  items.value.push(newItem);
  setLocalStorageItem('items', items.value);
  newItemName.value = '';
  newItemValue.value = 0;
}

function removeItem(id: number) {
  items.value = items.value.filter(i => i.id !== id);
  setLocalStorageItem('items', items.value);
}
</script>
