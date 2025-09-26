<template>
  <v-container>
    <v-expansion-panels>
      <v-expansion-panel title="Filters">
        <v-expansion-panel-text>
          <v-chip-group v-model="enabledItemIds" column multiple selected-class="text-primary">
            <v-chip v-for="item in items" :key="item.id" :text="item.name" :value="item.id" label />
          </v-chip-group>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <TradeChainSection :demands="filteredDemands" :items="filteredItems" :stations="stations" />
  </v-container>
  <v-container> </v-container>
  <!-- <TradeGraph :demands="demands" :items="items" :stations="stations" /> -->

  <!-- <OpportunitiesSection /> -->
</template>

<script setup lang="ts">
import {
  VExpansionPanel,
  VExpansionPanels,
  VExpansionPanelText,
  VChipGroup,
  VChip,
  VContainer,
} from 'vuetify/components';

import TradeChainSection from './TradeChain.vue';
import { ref, computed, onMounted, watch } from 'vue';
import type { Demand, Item, Station } from '../types';
import { DemandAPI, ItemAPI, StationAPI } from '../crud';
const enabledItemIds = ref<number[]>([]);

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const demands = ref<Demand[]>([]);

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
