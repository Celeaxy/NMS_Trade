<template>
  <div>
    <h1>Trade Chain</h1>
    <div v-if="chains.length">
        <div v-for="(chain, idx) in chains" :key="chain.station.id">
          <div> <strong>{{ chain.station.name }}</strong> </div>
          <span v-if="chain.buys.length">
            Buy:
            <span v-for="buy in chain.buys" :key="buy.item.id">
              {{ buy.item.name }} ({{ buy.price.toFixed(2) }})
            </span>
          </span>
          <span v-if="chain.sells.length">
            Sell:
            <span v-for="sell in chain.sells" :key="sell.item.id">
              {{ sell.item.name }} ({{ sell.price.toFixed(2) }})
            </span>
          </span>
          <h2 v-if="idx < chains.length - 1">⇩</h2>
        </div>
    </div>
    <div v-else>
      <p>No profitable trade chain found.</p>
    </div>
    <!-- Chain is calculated automatically -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { getLocalStorageItem } from '../storage';
import type { Item } from '../item';
import { Station } from '../station';

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const chains = ref<Array<{ station: Station, buys: Array<{ item: Item, price: number }>, sells: Array<{ item: Item, price: number }> }>>([]);

// Optimal trade chain calculation
function calculateChains() {
  const result: Array<{ station: Station, buys: Array<{ item: Item, price: number }>, sells: Array<{ item: Item, price: number }> }> = [];
  // Track which items are in demand at which stations
  const itemDemandStations: Record<number, number[]> = {};
  for (const item of items.value) {
    itemDemandStations[item.id] = stations.value
      .map((station, idx) => station.items.some(ti => ti.item.id === item.id && ti.demand > 0) ? idx : -1)
      .filter(idx => idx !== -1);
  }
  // Filter stations to only those that have items with demand
  stations.value = stations.value.filter(station => station.items.some(ti => ti.demand !== 0));
  // Identify for each item which station has the most profitable sell price
  

  // Traverse stations sequentially
  let inventory: { [itemId: number]: { item: Item, buyPrice: number } } = {};
  for (let i = 0; i < stations.value.length; i++) {
    const station = stations.value[i];
    const buys: Array<{ item: Item, price: number }> = [];
    const sells: Array<{ item: Item, price: number }> = [];
    // Buy items that are in demand at a future station
    for (const ti of station.items) {
      const futureDemand = itemDemandStations[ti.item.id].find(idx => idx > i);
      if (ti.demand < 0 && futureDemand !== undefined) {
        buys.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        inventory[ti.item.id] = { item: ti.item, buyPrice: ti.item.value * (1 + ti.demand / 100) };
      }
      // NEW: Also buy items with negative demand if they can be sold at a later station
      if (ti.demand < 0 && itemDemandStations[ti.item.id].some(idx => idx > i)) {
        if (!inventory[ti.item.id]) {
          buys.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
          inventory[ti.item.id] = { item: ti.item, buyPrice: ti.item.value * (1 + ti.demand / 100) };
        }
      }
    }
    // Sell items in inventory that are in demand at this station
    for (const ti of station.items) {
      if (ti.demand > 0 && inventory[ti.item.id]) {
        sells.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        delete inventory[ti.item.id];
      }
    }
    if (buys.length || sells.length) {
      result.push({ station, buys, sells });
    }
  }
  chains.value = result;
}

onMounted(() => {
  items.value = getLocalStorageItem<Item[]>('items') ?? [];
  stations.value = getLocalStorageItem<Station[]>('stations') ?? [];
  calculateChains();
});

watch([items, stations], calculateChains, { deep: true });
</script>
