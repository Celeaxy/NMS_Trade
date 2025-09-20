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
    <form @submit.prevent="addItemToStation" class="search-dropdown-form">
      <div class="search-dropdown">
        <input
          v-model="itemFilter"
          ref="itemInput"
          placeholder="Search or select item..."
          @focus="dropdownOpen = true"
          @blur="setTimeout(() => (dropdownOpen = false), 200)"
          @keydown.tab.prevent="handleTabSelect"
        />
        <ul v-if="dropdownOpen" class="dropdown-list">
          <li
            v-for="item in filteredAvailableItems"
            :key="item.id"
            @mousedown.prevent="selectItem(item.id)"
            :class="{ selected: selectedItemId === item.id }"
          >
            {{ item.name }} (Value: {{ item.value }})
          </li>
          <li
            v-if="filteredAvailableItems.length === 0"
            @mousedown.prevent="selectItem(-1)"
            :class="{ selected: selectedItemId === -1 }"
          >
            Add new item...
          </li>
        </ul>
      </div>
      <div v-if="selectedItemId === -1" class="new-item-fields">
        <input v-model.number="newItemValue" type="number" placeholder="Value" ref="valueInput" />
      </div>
      <label>
        Demand (%):
        <input
          v-model.number="newDemand"
          type="number"
          step="any"
          placeholder="Demand (%)"
          ref="demandInput"
        />
      </label>
      <button type="submit">Add Item</button>
    </form>
    <button @click="saveStation">Save All Changes</button>
  </div>
  <div v-else>
    <p>Station not found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Station } from '../station';
import type { Item } from '../item';

import {
  getStationsCache, setStationsCache, clearStationsCache,
  getItemsCache, setItemsCache, clearItemsCache,
  getDemandsCache, setDemandsCache, clearDemandsCache
} from '../cache';


const route = useRoute();
const router = useRouter();
const stationId = Number(route.params.id);
const stations = ref<Station[]>([]);
const station = ref<Station | null>(null);
const stationName = ref('');
const items = ref<Item[]>([]);
const userToken = localStorage.getItem('user_token');
const selectedItemId = ref<number | null>(null);
const newDemand = ref(0);
const newItemValue = ref(0);
const dropdownOpen = ref(false);
const itemInput = ref<HTMLInputElement | null>(null);
const demandInput = ref<HTMLInputElement | null>(null);
const valueInput = ref<HTMLInputElement | null>(null);


async function fetchAll() {
  if (!userToken) return;
  const [stationsRes, demandsRes, itemsRes] = await Promise.all([
  fetch(`https://nms-trade-backend.onrender.com/api/stations?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/demands?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/items?userToken=${userToken}`)
  ]);
  const stationsArr = await stationsRes.json();
  const demandsArr = await demandsRes.json();
  const itemsArr = await itemsRes.json();
  const itemsMap = new Map<number, any>();
  for (const item of itemsArr) itemsMap.set(item.id, item);
  const stationMap = new Map<number, Station>();
  for (const s of stationsArr) stationMap.set(s.id, new Station(s.name, s.id));
  for (const d of demandsArr) {
    const st = stationMap.get(d.station_id);
    const item = itemsMap.get(d.item_id);
    if (st && item) {
      st.items.push({ item, demand: d.demand });
    }
  }
  stations.value = Array.from(stationMap.values());
  station.value = stations.value.find((s) => s.id === stationId) ?? null;
  if (station.value) {
    stationName.value = station.value.name;
  }
  items.value = itemsArr;
}

async function fetchAllIfNeeded() {
  if (!userToken) return;
  let stationsArr = getStationsCache();
  let demandsArr = getDemandsCache();
  let itemsArr = getItemsCache();
  if (!stationsArr || !demandsArr || !itemsArr) {
    const [stationsRes, demandsRes, itemsRes] = await Promise.all([
  fetch(`https://nms-trade-backend.onrender.com/api/stations?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/demands?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/items?userToken=${userToken}`)
    ]);
    stationsArr = await stationsRes.json();
    demandsArr = await demandsRes.json();
    itemsArr = await itemsRes.json();
    if (stationsArr) setStationsCache(stationsArr);
    if (demandsArr) setDemandsCache(demandsArr);
    if (itemsArr) setItemsCache(itemsArr);
  }
  // Defensive: fallback to empty arrays if still null
  stationsArr = stationsArr ?? [];
  demandsArr = demandsArr ?? [];
  itemsArr = itemsArr ?? [];
  const itemsMap = new Map<number, any>();
  for (const item of itemsArr) itemsMap.set(item.id, item);
  const stationMap = new Map<number, Station>();
  for (const s of stationsArr) stationMap.set(s.id, new Station(s.name, s.id));
  for (const d of demandsArr) {
    const st = stationMap.get(d.station_id);
    const item = itemsMap.get(d.item_id);
    if (st && item) {
      st.items.push({ item, demand: d.demand });
    }
  }
  stations.value = Array.from(stationMap.values());
  station.value = stations.value.find((s) => s.id === stationId) ?? null;
  if (station.value) {
    stationName.value = station.value.name;
  }
  items.value = itemsArr;
}

onMounted(() => {
  fetchAllIfNeeded();
});

const itemFilter = ref('');
const availableItems = computed(() => {
  if (!station.value) return [];
  const usedIds = station.value.items.map((ti) => ti.item.id);
  return items.value.filter((item) => !usedIds.includes(item.id));
});
const filteredAvailableItems = computed(() => {
  if (!itemFilter.value.trim()) return availableItems.value;
  return availableItems.value.filter((item) =>
    item.name.toLowerCase().includes(itemFilter.value.trim().toLowerCase())
  );
});


async function addItemToStation() {
  if (!station.value || selectedItemId.value === null || !userToken) return;
  let item: Item | undefined;
  if (selectedItemId.value === -1) {
    if (!itemFilter.value.trim()) return;
    const newId = items.value.length ? Math.max(...items.value.map((i) => i.id)) + 1 : 1;
    const baseValue = newDemand.value !== 0 ? newItemValue.value / (1 + newDemand.value / 100) : newItemValue.value;
    item = { id: newId, name: itemFilter.value.trim(), value: Math.round(baseValue * 100) / 100 };
  await fetch('https://nms-trade-backend.onrender.com/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, userToken })
    });
    itemFilter.value = '';
    newItemValue.value = 0;
    clearItemsCache();
    clearStationsCache();
    clearDemandsCache();
    await fetchAllIfNeeded();
    item = items.value.find((i) => i.id === newId);
  } else {
    item = items.value.find((i) => i.id === selectedItemId.value);
  }
  if (!item) return;
  await fetch('https://nms-trade-backend.onrender.com/api/demands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ station_id: station.value.id, item_id: item.id, demand: newDemand.value, userToken })
  });
  clearDemandsCache();
  clearStationsCache();
  await fetchAllIfNeeded();
  selectedItemId.value = null;
  newDemand.value = 0;
  nextTick(() => {
    itemFilter.value = '';
    itemInput.value?.focus();
  });
}


async function removeItem(itemId: number) {
  if (!station.value || !userToken) return;
  await fetch(`https://nms-trade-backend.onrender.com/api/demands/${station.value.id}/${itemId}?userToken=${userToken}`, { method: 'DELETE' });
  clearDemandsCache();
  clearStationsCache();
  await fetchAllIfNeeded();
}


async function saveStation() {
  if (!station.value || !userToken) return;
  await fetch(`https://nms-trade-backend.onrender.com/api/stations/${station.value.id}?userToken=${userToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: stationName.value })
  });
  clearStationsCache();
  await fetchAllIfNeeded();
  router.push('/stations');
}

function selectItem(id: number) {
  selectedItemId.value = id;
  if (id !== -1) {
    const item = availableItems.value.find((i) => i.id === id);
    itemFilter.value = item ? item.name : '';
    nextTick(() => {
      demandInput.value?.focus();
    });
  } else {
    nextTick(() => {
      valueInput.value?.focus();
    });
  }
  dropdownOpen.value = false;
}

function handleTabSelect() {
  if (filteredAvailableItems.value.length > 0) {
    selectItem(filteredAvailableItems.value[0].id);
  } else {
    selectItem(-1);
  }
}

function closeDropdownWithDelay() {
  setTimeout(() => (dropdownOpen.value = false), 200);
}
</script>

<style scoped>
.search-dropdown-form {
  position: relative;
  max-width: 400px;
}
.search-dropdown {
  position: relative;
}
.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ccc;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dropdown-list li {
  padding: 8px 12px;
  cursor: pointer;
}
.dropdown-list li.selected,
.dropdown-list li:hover {
  background: #42b883;
  color: #fff;
}
</style>
