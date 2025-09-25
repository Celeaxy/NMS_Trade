<template>
  <div v-if="station">
    <h1>Edit Station</h1>
    <form @submit.prevent="saveStation">
      <input v-model="stationName" placeholder="Station name" />
      <button type="submit">Save Name</button>
    </form>
    <h2>Item Demands</h2>
    <ul>
      <li v-for="demand in demands" :key="demand.itemId">
        {{ getItemById(demand.itemId)?.name }}
        <input v-model.number="demand.demandLevel" type="number" />
        <span>%</span>
        <button @click="removeItem(demand.itemId)">Remove</button>
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
          @blur="closeDropdownWithDelay"
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
import type { Station, Item, Demand } from '../types';

import { ItemAPI, StationAPI, DemandAPI } from '../crud';

const route = useRoute();
const router = useRouter();

const stationId = Number(route.params.id);
const station = ref<Station | null>(null);
const stationName = ref('');

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const demands = ref<Demand[]>([]);

const selectedItemId = ref<number | null>(null);
const newDemand = ref<number>(0);
const newItemValue = ref<number>(0);
const dropdownOpen = ref(false);
const itemInput = ref<HTMLInputElement | null>(null);
const demandInput = ref<HTMLInputElement | null>(null);
const valueInput = ref<HTMLInputElement | null>(null);

async function fetchAll() {
  stations.value = await StationAPI.fetch();
  items.value = await ItemAPI.fetch();
  demands.value = (await DemandAPI.fetch()).filter((demand) => demand.stationId === stationId);
}

onMounted(async () => {
  await fetchAll();
  station.value = stations.value.find((s) => s.id === stationId) || null;
  stationName.value = station.value ? station.value.name : '';
});

const itemFilter = ref('');
const availableItems = computed(() => {
  if (!station.value) return [];
  const usedIds = demands.value.map((demand) => demand.itemId);
  return items.value.filter((item) => !usedIds.includes(item.id));
});

const filteredAvailableItems = computed(() => {
  if (!itemFilter.value.trim()) return availableItems.value;
  return availableItems.value.filter((item) =>
    item.name.toLowerCase().includes(itemFilter.value.trim().toLowerCase())
  );
});

function getItemById(id: number): Item | undefined {
  return items.value.find((item) => item.id === id);
}
function resetNewItemInput() {
  itemFilter.value = '';
  newItemValue.value = 0;
}

async function addItemToStation() {
  if (selectedItemId.value === null) return;
  let item: Item | undefined;
  if (selectedItemId.value === -1) {
    if (!itemFilter.value.trim()) return;
    const baseValue = Number(
      (newDemand.value !== 0
        ? newItemValue.value / (1 + newDemand.value / 100)
        : newItemValue.value
      ).toFixed(2)
    );

    const newItem = await ItemAPI.create(itemFilter.value.trim(), baseValue);
    resetNewItemInput();
    await fetchAll();
    item = newItem;
  } else {
    item = items.value.find((i) => i.id === selectedItemId.value);
  }

  if (!item) return;
  console.log(stationId, item.id, newDemand.value);
  await DemandAPI.create(stationId, item.id, newDemand.value);
  await fetchAll();
  selectedItemId.value = null;
  newDemand.value = 0;
  nextTick(() => {
    itemFilter.value = '';
    itemInput.value?.focus();
  });
}

async function removeItem(itemId: number) {
  await ItemAPI.delete(itemId);
  await fetchAll();
}

async function saveStation() {
  await StationAPI.update(stationId, {
    name: stationName.value,
  });
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
