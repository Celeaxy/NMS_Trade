<template>
  <div>
    <!-- <TradeGraph :demands="demands" :items="items" :stations="stations" /> -->
    <div class="filter-container">
      <button class="filter-toggle" @click="showFilter = !showFilter">
        <span v-if="showFilter">Hide Filters ▲</span>
        <span v-else>Show Filters ▼</span>
      </button>
      <div v-show="showFilter" class="item-toggle-bar">
        <span v-for="item in items" :key="item.id" class="item-toggle">
          <input type="checkbox" v-model="enabledItemIds" :value="item.id" id="item-{{item.id}}" />
          <label :for="'item-' + item.id">{{ item.name }}</label>
        </span>
      </div>
    </div>

    <!-- <OpportunitiesSection /> -->
    <TradeChainSection :demands="filteredDemands" :items="filteredItems" :stations="stations" />
  </div>
</template>

<script setup lang="ts">
import TradeGraph from './TradeGraph.vue';
import TradeChainSection from './TradeChain.vue';
import { ref, computed, onMounted, watch } from 'vue';
import type { Demand, Item, Station } from '../types';
import { DemandAPI, ItemAPI, StationAPI } from '../crud';

const enabledItemIds = ref<number[]>([]);

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const demands = ref<Demand[]>([]);
const showFilter = ref(false);

async function fetchItems() {
  items.value = (await ItemAPI.fetch()).filter((i) => i.tradeGood);
}
async function fetchAll() {
  stations.value = await StationAPI.fetch();
  await fetchItems();
  demands.value = await DemandAPI.fetch();

  console.log('Fetched all data', {
    stations: stations.value,
    items: items.value,
    demands: demands.value,
  });
}

const filteredItems = computed(() => {
  return items.value.filter((i) => enabledItemIds.value.includes(i.id));
});

const filteredDemands = computed(() => {
  return demands.value.filter((d) => enabledItemIds.value.includes(d.itemId));
});

onMounted(async () => {
  await fetchAll();
  // Load enabled item ids from localStorage or default to all
  const stored = localStorage.getItem('enabledItemIds');
  if (stored) {
    try {
      enabledItemIds.value = JSON.parse(stored);
    } catch {
      enabledItemIds.value = items.value.map((i) => i.id);
    }
  } else {
    enabledItemIds.value = items.value.map((i) => i.id);
  }
});

watch(enabledItemIds, (val) => {
  localStorage.setItem('enabledItemIds', JSON.stringify(val));
  // filteredItems and filteredDemands are computed, so they will update automatically
});
</script>

<style scoped>
.filter-container {
  margin-bottom: 18px;
}
.filter-toggle {
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 8px;
}
.filter-toggle:hover {
  background: #125ea2;
}
.item-toggle-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.item-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f3f3f3;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 1rem;
}
.item-toggle input[type='checkbox'] {
  accent-color: #1976d2;
}
</style>
