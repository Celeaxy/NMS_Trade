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
          @blur="setTimeout(() => dropdownOpen = false, 200)"
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
          <li v-if="filteredAvailableItems.length === 0" @mousedown.prevent="selectItem(-1)" :class="{ selected: selectedItemId === -1 }">Add new item...</li>
        </ul>
      </div>
      <div v-if="selectedItemId === -1" class="new-item-fields">
        <input v-model.number="newItemValue" type="number" placeholder="Value" ref="valueInput" />
      </div>
      <label>
        Demand (%):
        <input v-model.number="newDemand" type="number" step="any" placeholder="Demand (%)" ref="demandInput" />
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
const newItemValue = ref(0);
const dropdownOpen = ref(false);
const itemInput = ref<HTMLInputElement | null>(null);
const demandInput = ref<HTMLInputElement | null>(null);
const valueInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  stations.value = getLocalStorageItem<Station[]>('stations') ?? [];
  station.value = stations.value.find(s => s.id === stationId) ?? null;
  if (station.value) {
    stationName.value = station.value.name;
  }
  items.value = getLocalStorageItem<Item[]>('items') ?? [];
});

const itemFilter = ref('');
const availableItems = computed(() => {
  if (!station.value) return [];
  const usedIds = station.value.items.map(ti => ti.item.id);
  return items.value.filter(item => !usedIds.includes(item.id));
});
const filteredAvailableItems = computed(() => {
  if (!itemFilter.value.trim()) return availableItems.value;
  return availableItems.value.filter(item => item.name.toLowerCase().includes(itemFilter.value.trim().toLowerCase()));
});

function addItemToStation() {
  if (!station.value || selectedItemId.value === null) return;
  let item: Item | undefined;
  if (selectedItemId.value === -1) {
    // Add new item
    if (!itemFilter.value.trim()) return;
    const newId = items.value.length ? Math.max(...items.value.map(i => i.id)) + 1 : 1;
    // Calculate base value from local value and demand
    const baseValue = newDemand.value !== 0
      ? newItemValue.value / (1 + newDemand.value / 100)
      : newItemValue.value;
    item = { id: newId, name: itemFilter.value.trim(), value: Math.round(baseValue * 100) / 100 };
    items.value.push(item);
    setLocalStorageItem('items', items.value);
    itemFilter.value = '';
    newItemValue.value = 0;
  } else {
    item = items.value.find(i => i.id === selectedItemId.value);
  }
  if (!item) return;
  station.value.items.push({ item, demand: newDemand.value });
  setLocalStorageItem('stations', stations.value);
  selectedItemId.value = null;
  newDemand.value = 0;
  nextTick(() => {
    itemFilter.value = '';
    itemInput.value?.focus();
  });
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

function selectItem(id: number) {
  selectedItemId.value = id;
  if (id !== -1) {
    const item = availableItems.value.find(i => i.id === id);
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
