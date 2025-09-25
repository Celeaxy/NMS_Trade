<template>
  <div class="trade-chain-container">
    <div class="trade-chain-header">
      <h1>Trade Chain</h1>
    </div>
    <div v-if="chain.length">
      <template v-for="(chainLink, idx) in chain" :key="chainLink.station.id">
        <div class="station-card">
          <div class="station-header-row">
            <div class="station-header-title">
              <strong>{{ chainLink.station.name }}</strong>
            </div>
            <div class="station-header-checkbox">
              <input type="checkbox" v-model="collapsedLinks[idx]" id="done-{{idx}}" />
              <label :for="'done-' + idx">Done</label>
            </div>
          </div>
          <div class="trade-details" v-show="!collapsedLinks[idx]">
            <div v-if="chainLink.buys.length" class="trade-list buys">
              <span class="trade-label">Buy:</span>
              <span
                v-for="buy in chainLink.buys"
                :key="buy.item.id"
                class="trade-item"
                :title="getItemTooltip(buy.item.id)"
              >
                {{ buy.item.name }} <span class="trade-value">({{ buy.price.toFixed(2) }})</span>
              </span>
            </div>
            <div v-if="chainLink.sells.length" class="trade-list sells" style="margin-top: 8px">
              <span class="trade-label">Sell:</span>
              <span
                v-for="sell in chainLink.sells"
                :key="sell.item.id"
                class="trade-item"
                :title="getItemTooltip(sell.item.id)"
              >
                {{ sell.item.name }}
                <span class="trade-value">({{ sell.price.toFixed(2) }})</span>
              </span>
            </div>
          </div>
        </div>
        <div v-if="idx < chain.length - 1" class="arrow">⇩</div>
      </template>
    </div>
    <div v-else class="no-chain">
      <p>No profitable trade chain found.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Demand, Item, Station } from '../types';

const props = defineProps<{
  stations: Station[];
  items: Item[];
  demands: Demand[];
}>();

interface ChainLink {
  station: Station;
  buys: { item: Item; price: number }[];
  sells: { item: Item; price: number }[];
}

const chain = ref<ChainLink[]>([]);
const collapsedChain = ref(false);
// Track collapsed state for each chain link (not persisted)
const collapsedLinks = ref<boolean[]>([]);

function getItemById(id: number): Item | undefined {
  return props.items.find((i) => i.id === id);
}

function getPrice(itemId: number, demand: number): number | null {
  const item = getItemById(itemId);
  if (!item) return null;
  return item.value * (1 + demand / 100);
}

function getItemTooltip(itemId: number): string {
  const item = getItemById(itemId);
  if (!item) return 'Unknown item';
  return `${item.name}\nBase Value: ${item.value.toFixed(2)}`;
}

function calculateChains() {
  const { stations, demands, items } = props;
  const itemIds = items
    .map((i) => i.id)
    .filter(
      (id) =>
        demands.some((d) => d.itemId === id && d.demandLevel < 0) &&
        demands.some((d) => d.itemId === id && d.demandLevel > 0)
    );
  // Find all relevant supplies
  const supplies = demands.filter((d) => d.demandLevel < 0 && itemIds.includes(d.itemId));
  // Only consider the highest demand for each item
  const demanders: typeof demands = [];
  for (const id of itemIds) {
    const highest = demands
      .filter((d) => d.itemId === id && d.demandLevel > 0)
      .reduce((max, curr) => (curr.demandLevel > max.demandLevel ? curr : max), {
        demandLevel: -Infinity,
      } as (typeof demands)[number]);
    if (highest && highest.demandLevel > -Infinity) demanders.push(highest);
  }

  // Build dependency graph: stationId -> Set of stationIds it depends on (suppliers)
  const dependencies = new Map<number, Set<number>>();
  stations.forEach((station) => dependencies.set(station.id, new Set()));
  for (const demand of demanders) {
    const suppliers = supplies.filter((s) => s.itemId === demand.itemId).map((s) => s.stationId);
    for (const supplierId of suppliers) {
      if (supplierId !== demand.stationId) {
        dependencies.get(demand.stationId)?.add(supplierId);
      }
    }
  }

  // Topological sort
  const sorted: number[] = [];
  const tempMark = new Set<number>();
  const permMark = new Set<number>();
  function visit(n: number) {
    if (permMark.has(n)) return;
    if (tempMark.has(n)) return; // cycle, skip
    tempMark.add(n);
    for (const dep of dependencies.get(n) ?? []) {
      visit(dep);
    }
    permMark.add(n);
    sorted.push(n);
  }
  for (const station of stations) {
    visit(station.id);
  }

  // Build stationMap for supplies/demands
  const stationMap = new Map<
    number,
    {
      supplies: { itemId: number; demandLevel: number }[];
      demands: { itemId: number; demandLevel: number }[];
    }
  >();
  stations.forEach((station) => {
    const s = supplies
      .filter((d) => d.stationId === station.id)
      .map((d) => ({ itemId: d.itemId, demandLevel: d.demandLevel }));
    const d = demanders
      .filter((d) => d.stationId === station.id)
      .map((d) => ({ itemId: d.itemId, demandLevel: d.demandLevel }));
    stationMap.set(station.id, { supplies: s, demands: d });
  });

  chain.value = [];
  for (const stationId of sorted) {
    const station = stations.find((s) => s.id === stationId);
    if (!station) continue;
    const { supplies, demands } = stationMap.get(stationId) ?? { supplies: [], demands: [] };
    if (supplies.length === 0 && demands.length === 0) continue;
    chain.value.push({
      station,
      buys: supplies.map((supply) => ({
        item: items.find((i) => i.id === supply.itemId)!,
        price: getPrice(supply.itemId, supply.demandLevel)!,
      })),
      sells: demands.map((demand) => ({
        item: items.find((i) => i.id === demand.itemId)!,
        price: getPrice(demand.itemId, demand.demandLevel)!,
      })),
    });
  }
  // After building chain.value:
  collapsedLinks.value = chain.value.map(() => false);
}

watch(
  () => [props.stations, props.items, props.demands],
  () => {
    calculateChains();
  },
  { deep: true }
);
</script>

<style scoped>
.trade-chain-container {
  max-width: 700px;
  margin: 32px auto;
  background: #f8f9fa;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px 24px;
}
.trade-chain-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.collapse-btn {
  border: none;
  background: #e3e6ea;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: background 0.2s;
}
.collapse-btn:hover {
  background: #d1d5db;
}
.station-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  padding: 20px 18px;
  transition: box-shadow 0.2s;
}
.station-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
.station-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}
.station-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.station-header-title {
  font-size: 1.1rem;
  font-weight: bold;
}
.station-header-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
}
.station-header-checkbox label {
  font-size: 0.98rem;
  color: #1976d2;
  cursor: pointer;
}
.trade-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 8px;
}
.trade-list {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trade-label {
  font-weight: 500;
  color: #6c757d;
  margin-right: 4px;
}
.trade-item {
  background: #eaf6fb;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 1rem;
  color: #1976d2;
  cursor: pointer;
  transition: background 0.2s;
}
.trade-item:hover {
  background: #d0e7f7;
}
.trade-value {
  color: #495057;
  font-size: 0.95em;
  margin-left: 2px;
}
.arrow {
  text-align: center;
  font-size: 1.5rem;
  color: #1976d2;
  margin: 16px 0;
}
.no-chain {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  margin-top: 32px;
}
.collapsible-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
</style>
