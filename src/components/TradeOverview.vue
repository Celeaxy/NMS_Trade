<template>
  <div>
    <TradeGraph :chains="filteredChains" />
    <div class="item-toggle-bar">
      <span v-for="item in allRelevantItems" :key="item.id" class="item-toggle">
        <input type="checkbox" v-model="enabledItemIds" :value="item.id" id="item-{{item.id}}" />
        <label :for="'item-' + item.id">{{ item.name }}</label>
      </span>
    </div>
    
    <OpportunitiesSection />
    <TradeChainSection :chains="filteredChains" />
  </div>
</template>

<script setup lang="ts">
import OpportunitiesSection from './Opportunities.vue';
import TradeGraph from './TradeGraph.vue';
import TradeChainSection from './TradeChain.vue';
import { ref, onMounted, watch, computed } from 'vue';
import type { Item } from '../item';
import { Station } from '../station';

import {
  getItemsCache, setItemsCache, getStationsCache, setStationsCache, getDemandsCache, setDemandsCache
} from '../cache';

const items = ref<Item[]>(getItemsCache() ?? []);
const stations = ref<Station[]>(getStationsCache() ?? []);
const chains = ref<any[]>([]);
const userToken = localStorage.getItem('user_token');


// Filter items that have supply and demand
function getRelevantItems(items: Item[], stations: Station[]): Item[] {
  return items.filter(
    ({ id }) =>
      stations.some((station) => station.getSupplyItems().some(({ item }) => item.id === id)) &&
      stations.some((station) => station.getDemandItems().some(({ item }) => item.id === id))
  );
}

// Filter stations for items
function filterStationsForItems(stations: Station[], items: Item[]): Station[] {
  return (
    stations
      .map((station) => {
        const filteredItems = station.items.filter((ti) => items.some((i) => i.id === ti.item.id));
        station.items = filteredItems;
        return station;
      })
      // Only keep stations that still have items
      .filter((station) => station.items.length > 0)
  );
}

/**
 * Create a map of itemId to the station that has the highest demand for that item
 * @param stations
 * @param items
 */
function getHighestDemandStationMap(stations: Station[], items: Item[]): Record<number, Station> {
  const highestDemandStations: Record<number, Station> = {}; // itemId -> Station
  for (const id of items.map((i) => i.id)) {
    let maxDemand = -Infinity;
    let highestDemandStation: Station | null = null;
    stations.forEach((station) => {
      for (const ti of station.items) {
        if (ti.item.id === id && ti.demand > maxDemand) {
          maxDemand = ti.demand;
          highestDemandStation = station;
        }
      }
      if (highestDemandStation) highestDemandStations[id] = highestDemandStation;
    });
  }
  return highestDemandStations;
}

/**
 * Get the station with the highest overall profit potential
 * (sum of all (item base value * demand%) for items with demand > 0
 */
function getHighestValueStation(stations: Station[], items: Item[]): Station | null {
  let maxValue = -Infinity;
  let bestStation: Station | null = null;
  for (const station of stations) {
    let totalValue = 0;
    for (const ti of station.getDemandItems()) {
      if (ti.demand > 0 && items.some((i) => i.id === ti.item.id)) {
        totalValue += ti.item.value * (ti.demand / 100);
      }
    }
    if (totalValue > maxValue) {
      maxValue = totalValue;
      bestStation = station;
    }
  }
  return bestStation;
}

/**
 * Filter items from stations that do not have the highest demand for that item
 * Keep supply items (demand < 0) as is
 * @param stations
 * @param items
 */
function filterDemandOnStations(stations: Station[], items: Item[]): Station[] {
  const highestDemandStationMap = getHighestDemandStationMap(stations, items);
  return (
    stations
      .map((station) => {
        const filteredItems = station.items.filter((ti) => {
          if (!items.some((i) => i.id === ti.item.id)) return false;
          if (ti.demand < 0) return true; // keep supply items
          return highestDemandStationMap[ti.item.id]?.id === station.id;
        });
        station.items = filteredItems;
        return station;
      })
      // Only keep stations that still have items
      .filter((station) => station.items.length > 0)
  );
}

function calculateChains() {
  const relevantItems = getRelevantItems(items.value, stations.value);
  const relevantItemIds = relevantItems.map((i) => i.id);
  stations.value = filterStationsForItems(stations.value, relevantItems);

  stations.value = filterDemandOnStations(stations.value, items.value); // Demand is always the highest for each item

  // Create a chain so that each item bought at a station is bought from all stations that sell it
  // At each step, buy all items that are in demand at other stations
  const highestDemandStation = getHighestDemandStationMap(stations.value, items.value);
  const startingStation = getHighestValueStation(stations.value, items.value);
  if (!startingStation) {
    chains.value = [];
    return;
  }
  const startIdx = stations.value.findIndex((s) => s.id === startingStation.id);
  if (startIdx === -1) {
    chains.value = [];
    return;
  }
  const chain: Array<{
    station: Station;
    buys: Array<{ item: Item; price: number }>;
    sells: Array<{ item: Item; price: number }>;
  }> = [];
  const visited = new Set<number>();
  const inventory: Record<number, Item> = {}; // itemId -> Item
  let currentIdx = startIdx;
  visited.add(currentIdx);
  // buy all items that are in demand at other stations
  chain.push({ 
    station: stations.value[currentIdx], 
    buys: stations.value[currentIdx].getSupplyItems().map(({ item, demand }) => ({
      item,
      price: item.value * (1 + demand / 100)
    })), 
    sells: [] 
  });
  // Add all bought items to inventory
  for (const ti of stations.value[currentIdx].getSupplyItems()) {
    if (relevantItemIds.includes(ti.item.id)) {
      inventory[ti.item.id] = ti.item;
    }
  }
  while (visited.size < stations.value.length) {
    let nextIdx = -1;
    for (let i = 0; i < stations.value.length; i++) {
      if (visited.has(i)) continue;
      const station = stations.value[i];
      // Check if this station buys any item we currently have in inventory
      if (
        Object.keys(inventory).some((itemId) =>
          station.items.some((ti) => ti.item.id === Number(itemId) && ti.demand > 0)
        )
      ) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx === -1) {
      // No station buys our inventory, pick any unvisited station
      nextIdx = Array.from(Array(stations.value.length).keys()).find((i) => !visited.has(i))!;
    }
    const station = stations.value[nextIdx];
    visited.add(nextIdx);
    const buys: Array<{ item: Item; price: number }> = [];
    const sells: Array<{ item: Item; price: number }> = [];
    for (const ti of station.items) {
      if (ti.demand < 0 && relevantItemIds.includes(ti.item.id)) {
        buys.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        inventory[ti.item.id] = ti.item;
      }
    }
    // Sell all items we have in inventory that are in demand at this station
    for (const ti of station.items) {
      if (ti.demand > 0 && relevantItemIds.includes(ti.item.id) && inventory[ti.item.id]) {
        sells.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        delete inventory[ti.item.id];
      }
    }
    if (buys.length || sells.length) {
      chain.push({ station, buys, sells });
    }
    currentIdx = nextIdx;
  }
  // Add stations that buy items we still have in inventory even if they are already in the chain
  for (const itemId of Object.keys(inventory).map((id) => Number(id))) {
    const targetStation = highestDemandStation[itemId]; // Station with highest demand for this item
    if (!targetStation) continue;
    const targetIdx = stations.value.findIndex((s) => s.id === targetStation.id);
    if (targetIdx === -1 || visited.has(targetIdx)) continue;
    const station = stations.value[targetIdx];
    const buys: Array<{ item: Item; price: number }> = [];
    const sells: Array<{ item: Item; price: number }> = [];
    for (const ti of station.items) {
      if (ti.demand < 0 && relevantItemIds.includes(ti.item.id)) {
        buys.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        inventory[ti.item.id] = ti.item;
      }
    }
    // Sell all items we have in inventory that are in demand at this station
    for (const ti of station.items) {
      if (ti.demand > 0 && relevantItemIds.includes(ti.item.id) && inventory[ti.item.id]) {
        sells.push({ item: ti.item, price: ti.item.value * (1 + ti.demand / 100) });
        delete inventory[ti.item.id];
      }
    }
    if (sells.length) {
      chain.push({ station, buys, sells });
      visited.add(targetIdx);
    }
  }

  // Reorder chain, so that station that only sell items come first
  chain.sort((a, b) => {
    if (a.sells.length === 0 && b.sells.length > 0) return -1;
    if (a.sells.length > 0 && b.sells.length ===  0) return 1;
    return 0;
  });

  chain.sort((a,b) => {
    if (a.sells.some(({item}) => b.buys.some(({item: bItem}) => bItem.id === item.id))) {
      return -1
    }
    return 0
  });

  chains.value = chain;
}

const allRelevantItems = computed(() =>
  items.value.slice().sort((a, b) => a.name.localeCompare(b.name))
);
const enabledItemIds = ref<number[]>([]);

const filteredChains = computed(() => {
  // Filter chains to only include enabled items in buys/sells
  return chains.value.map(chain => ({
    station: chain.station,
    buys: chain.buys.filter((b: { item: Item }) => enabledItemIds.value.includes(b.item.id)),
    sells: chain.sells.filter((s: { item: Item }) => enabledItemIds.value.includes(s.item.id)),
  }));
});



async function fetchDataIfNeeded() {
  if (!userToken) return;
  // Only fetch if cache is empty
  let itemsArr = getItemsCache();
  let stationsArr = getStationsCache();
  let demandsArr = getDemandsCache();
  if (!itemsArr || !stationsArr || !demandsArr) {
    const [itemsRes, stationsRes, demandsRes] = await Promise.all([
  fetch(`https://nms-trade-backend.onrender.com/api/items?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/stations?userToken=${userToken}`),
  fetch(`https://nms-trade-backend.onrender.com/api/demands?userToken=${userToken}`)
    ]);
    itemsArr = await itemsRes.json();
    stationsArr = await stationsRes.json();
    demandsArr = await demandsRes.json();
    if (itemsArr) setItemsCache(itemsArr);
    if (stationsArr) setStationsCache(stationsArr);
    if (demandsArr) setDemandsCache(demandsArr);
  }
  // Defensive: fallback to empty arrays if still null
  itemsArr = itemsArr ?? [];
  stationsArr = stationsArr ?? [];
  demandsArr = demandsArr ?? [];
  // Build items map
  const itemsMap = new Map<number, Item>();
  for (const item of itemsArr) {
    itemsMap.set(item.id, item);
  }
  items.value = itemsArr;
  // Build stations with items/demands
  const stationMap = new Map<number, Station>();
  for (const s of stationsArr) {
    stationMap.set(s.id, new Station(s.name, s.id));
  }
  for (const d of demandsArr) {
    const station = stationMap.get(d.station_id);
    const item = itemsMap.get(d.item_id);
    if (station && item) {
      station.items.push({ item, demand: d.demand });
    }
  }
  stations.value = Array.from(stationMap.values());
  // Load enabled item ids from localStorage or default to all
  const saved = JSON.parse(localStorage.getItem('enabledItemIds') || 'null');
  enabledItemIds.value = saved && saved.length ? saved : items.value.map(i => i.id);
  calculateChains();
}

onMounted(() => {
  fetchDataIfNeeded();
});

watch(enabledItemIds, (val) => {
  localStorage.setItem('enabledItemIds', JSON.stringify(val));
});

</script>

<style scoped>
.item-toggle-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
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
