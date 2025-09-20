<template>
  <div>
    <div class="collapsible-header">
      <button class="collapse-btn" @click="collapsedOpportunities = !collapsedOpportunities">
        <span v-if="collapsedOpportunities">▼</span>
        <span v-else>▲</span>
      </button>
      <h1>Trade Opportunities</h1>
    </div>
    <div v-show="!collapsedOpportunities">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Buy Station</th>
            <th>Sell Station</th>
            <th>% Margin</th>
            <th>Total Gain (per unit)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="op in negativeOps"
            :key="op.itemId + '-' + op.buyStationId + '-' + op.sellStationId"
          >
            <td>{{ op.itemName }}</td>
            <td>{{ op.buyStationName }}</td>
            <td>{{ op.sellStationName }}</td>
            <td>{{ op.margin.toFixed(2) }}%</td>
            <td>{{ op.gain.toFixed(2) }}</td>
          </tr>
          <tr
            v-for="op in positiveOps"
            :key="op.itemId + '-' + op.buyStationId + '-' + op.sellStationId"
          >
            <td>{{ op.itemName }}</td>
            <td>{{ op.buyStationName }}</td>
            <td>{{ op.sellStationName }}</td>
            <td>{{ op.margin.toFixed(2) }}%</td>
            <td>{{ op.gain.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted, computed } from 'vue';
import { Station } from '../station';
import {
  getStationsCache, setStationsCache, getDemandsCache, setDemandsCache, getItemsCache, setItemsCache
} from '../cache';



const stations = ref<Station[]>(getStationsCache()?.map((s: any) => new Station(s.name, s.id)) ?? []);
const collapsedOpportunities = ref(false);
const userToken = localStorage.getItem('user_token');


async function fetchStationsAndDemandsIfNeeded() {
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
    const station = stationMap.get(d.station_id);
    const item = itemsMap.get(d.item_id);
    if (station && item) {
      station.items.push({ item, demand: d.demand });
    }
  }
  stations.value = Array.from(stationMap.values());
}


onMounted(() => {
  fetchStationsAndDemandsIfNeeded();
});

const opportunities = computed(() => {
  const ops: Array<{
    itemId: number;
    itemName: string;
    buyStationId: number;
    buyStationName: string;
    sellStationId: number;
    sellStationName: string;
    margin: number;
    gain: number;
    buyDemand: number;
    sellDemand: number;
  }> = [];
  const allItems: Array<{
    stationId: number;
    stationName: string;
    itemId: number;
    itemName: string;
    baseValue: number;
    demand: number;
  }> = [];
  for (const station of stations.value) {
    for (const tradeItem of station.items) {
      allItems.push({
        stationId: station.id,
        stationName: station.name,
        itemId: tradeItem.item.id,
        itemName: tradeItem.item.name,
        baseValue: tradeItem.item.value,
        demand: tradeItem.demand,
      });
    }
  }
  const itemsById = new Map<number, Array<(typeof allItems)[0]>>();
  for (const entry of allItems) {
    if (!itemsById.has(entry.itemId)) itemsById.set(entry.itemId, []);
    itemsById.get(entry.itemId)!.push(entry);
  }
  for (const [itemId, entries] of itemsById.entries()) {
    let buy = entries[0],
      sell = entries[0];
    for (const entry of entries) {
      if (entry.demand < buy.demand) buy = entry;
      if (entry.demand > sell.demand) sell = entry;
    }
    if (buy.stationId !== sell.stationId && sell.demand > buy.demand) {
      const buyPrice = buy.baseValue * (1 + buy.demand / 100);
      const sellPrice = sell.baseValue * (1 + sell.demand / 100);
      const margin = sell.demand - buy.demand;
      const gain = sellPrice - buyPrice;
      ops.push({
        itemId,
        itemName: buy.itemName,
        buyStationId: buy.stationId,
        buyStationName: buy.stationName,
        sellStationId: sell.stationId,
        sellStationName: sell.stationName,
        margin,
        gain,
        buyDemand: buy.demand,
        sellDemand: sell.demand,
      });
    }
  }
  return ops;
});

const negativeOps = computed(() => opportunities.value.filter((op) => op.buyDemand < 0));
const positiveOps = computed(() => opportunities.value.filter((op) => op.buyDemand >= 0));
</script>

<style scoped>
.collapse-btn {
  border: none;
  background: #eee;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
  margin-right: 8px;
  vertical-align: middle;
}
.collapsible-header {
  display: flex;
  align-items: center;
}
</style>
