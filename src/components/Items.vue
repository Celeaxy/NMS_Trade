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
import { ref, } from 'vue';
import type { Item } from '../types';
import { ItemAPI } from '../crud';

const items = ref<Item[]>(await ItemAPI.fetch());
const newItemName = ref('');
const newItemValue = ref(0);


async function addItem() {
  const name = newItemName.value.trim()
  if (!name) return;

  await ItemAPI.create(name, newItemValue.value);

  newItemName.value = '';
  newItemValue.value = 0;

  items.value = await ItemAPI.fetch();
}

async function removeItem(id: number) {
  await ItemAPI.delete(id);
  items.value = await ItemAPI.fetch();
}
</script>
