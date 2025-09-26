<template>
  <v-container class="py-8" max-width="700">
    <v-row justify="center" class="mb-6">
      <v-col cols="12" class="text-center">
        <v-icon size="36" color="primary" class="mb-2">mdi-link-variant</v-icon>
        <h1 class="text-h4 font-weight-bold">Trade Chain</h1>
      </v-col>
    </v-row>
    <v-row v-if="chain.length" dense>
      <template v-for="(chainLink, idx) in chain" :key="chainLink.station.id">
        <v-col cols="12">
          <v-card elevation="3" class="mb-4">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-h6">{{ chainLink.station.name }}</span>
              <v-checkbox
                v-model="collapsedLinks[idx]"
                color="primary"
                hide-details
                density="compact"
                :id="'done-' + idx"
                class="ma-0 pa-0"
              />
            </v-card-title>
            <v-expand-transition>
              <div v-show="!collapsedLinks[idx]">
                <v-card-text class="py-2">
                  <v-row>
                    <v-col cols="12" v-if="chainLink.buys.length">
                      <div class="text-subtitle-2 mb-1 text-grey">Buy:</div>
                      <v-chip
                        v-for="buy in chainLink.buys"
                        :key="buy.item.id"
                        color="primary"
                        variant="tonal"
                        :title="getItemTooltip(buy.item.id)"
                        class="ma-1"
                      >
                        {{ buy.item.name }}
                        <span class="ml-1 text-grey-darken-2">({{ buy.price.toFixed(2) }})</span>
                      </v-chip>
                    </v-col>
                    <v-col cols="12" v-if="chainLink.sells.length">
                      <div class="text-subtitle-2 mb-1 text-grey">Sell:</div>
                      <v-chip
                        v-for="sell in chainLink.sells"
                        :key="sell.item.id"
                        color="success"
                        variant="tonal"
                        :title="getItemTooltip(sell.item.id)"
                        class="ma-1"
                      >
                        {{ sell.item.name }}
                        <span class="ml-1 text-grey-darken-2">({{ sell.price.toFixed(2) }})</span>
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>
        <v-col cols="12" v-if="idx < chain.length - 1">
          <div class="text-center">
            <v-icon color="primary" size="32">mdi-arrow-down-bold</v-icon>
          </div>
        </v-col>
      </template>
    </v-row>
    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-alert type="info" variant="tonal" border="start" color="primary">
          No profitable trade chain found.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Demand, Item, Station } from '../types';
import {
  VContainer,
  VRow,
  VCol,
  VIcon,
  VCard,
  VCardTitle,
  VCardText,
  VChip,
  VCheckbox,
  VExpandTransition,
  VAlert,
} from 'vuetify/components';
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
/* No additional styles needed for clean Vuetify look */
</style>
