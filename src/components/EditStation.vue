

<template>
  <div v-if="station">
    <h1>Edit Station</h1>
    <form @submit.prevent="saveStation">
      <input v-model="stationName" placeholder="Station name" />
      <button type="submit">Save Name</button>
    </form>
    <h2>Item Demands</h2>
    <ul>
      <li v-for="tradeItem in station.items" :key="tradeItem.item.id">
        {{ tradeItem.item.name }}
        <input v-model.number="tradeItem.demand" type="number" />
        <span>%</span>
        <button @click="removeItem(tradeItem.item.id)">Remove</button>
      </li>
    </ul>
    <h3>Add Item to Station</h3>
    <form @submit.prevent="addItemToStation">
      <select v-model.number="selectedItemId">
        <option v-for="item in availableItems" :key="item.id" :value="item.id">
          {{ item.name }} (Value: {{ item.value }})
        </option>
      </select>
    <input v-model="newDemand" type="number" step="any" placeholder="Demand (%)" />  <button type="submit">Add Item</button>
    </form>
    <button @click="saveStation">Save All Changes</button>
  </div>
  <div v-else>
    <p>Station not found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Station } from '../station';
import type { Item } from '../item';
import { getLocalStorageItem, setLocalStorageItem } from '../storage';

const route = useRoute();
const router = useRouter();
const stationId = Number(route.params.id);
const stations = ref<Station[]>([]);
const station = ref<Station | null>(null);
const stationName = ref('');
const items = ref<Item[]>([]);
const selectedItemId = ref<number | null>(null);
const newDemand = ref(0);

onMounted(() => {
  stations.value = getLocalStorageItem<Station[]>('stations') ?? [];
  station.value = stations.value.find(s => s.id === stationId) ?? null;
  if (station.value) {
    stationName.value = station.value.name;
  }
  items.value = getLocalStorageItem<Item[]>('items') ?? [];
});

const availableItems = computed(() => {
  if (!station.value) return [];
  const usedIds = station.value.items.map(ti => ti.item.id);
  return items.value.filter(item => !usedIds.includes(item.id));
});

function addItemToStation() {
  if (!station.value || selectedItemId.value === null) return;
  const item = items.value.find(i => i.id === selectedItemId.value);
  if (!item) return;
  station.value.items.push({ item, demand: newDemand.value });
  setLocalStorageItem('stations', stations.value);
  selectedItemId.value = null;
  newDemand.value = 0;
}

function removeItem(itemId: number) {
  if (!station.value) return;
  station.value.items = station.value.items.filter(ti => ti.item.id !== itemId);
  setLocalStorageItem('stations', stations.value);
}

function saveStation() {
  if (!station.value) return;
  station.value.name = stationName.value;
  setLocalStorageItem('stations', stations.value);
  router.push('/stations');
}
</script>
