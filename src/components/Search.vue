<template>
  <v-container class="mt-8">
    Search Results for "{{ searchQuery }}"
    <v-card
      v-if="results.length"
      v-for="result in results"
      :key="result.item + '-' + result.station"
    >
      <v-card-title></v-card-title>
      <v-card-text>
        <div>
          <strong>Item:</strong> {{ result.item }}<br />
          <strong>Station:</strong> {{ result.station }}<br />
          <strong>Demand Level:</strong> {{ result.demandLevel }}
        </div>
      </v-card-text>
    </v-card>
    <v-card v-else type="info" class="mt-4">No results for {{ searchQuery }}.</v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ItemAPI, StationAPI, DemandAPI } from '../crud';
import { VContainer, VCard, VCardTitle, VCardText } from 'vuetify/components';
type SearchResult = {
  item: string;
  station: string;
  demandLevel: number;
};

const route = useRoute();
const searchQuery = ref((route.query.q as string) || '');
const results = ref<SearchResult[]>([]);

const loading = ref(true);

async function fetchResult(query: string) {
  if (!query) return;
  const [items, stations, demands] = await Promise.all([
    ItemAPI.fetch(),
    StationAPI.fetch(),
    DemandAPI.fetch(),
  ]);
  const itemIds = items
    .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    .map((i) => i.id);
  const itemDemands = demands.filter((d) => itemIds.includes(d.itemId));
  if (!itemDemands.length) return;
  for (const itemId of itemIds) {
    const highestItemDemand = itemDemands
      .filter((d) => d.itemId === itemId)
      .sort((a, b) => b.demandLevel - a.demandLevel)[0];
    const lowestItemDemand = itemDemands
      .filter((d) => d.itemId === itemId)
      .sort((a, b) => a.demandLevel - b.demandLevel)[0];
    results.value.push({
      item: items.find((i) => i.id === itemId)?.name || 'Unknown',
      station: stations.find((s) => s.id === highestItemDemand.stationId)?.name || 'Unknown',
      demandLevel: highestItemDemand.demandLevel,
    });
    if (highestItemDemand.stationId !== lowestItemDemand.stationId) {
      results.value.push({
        item: items.find((i) => i.id === itemId)?.name || 'Unknown',
        station: stations.find((s) => s.id === lowestItemDemand.stationId)?.name || 'Unknown',
        demandLevel: lowestItemDemand.demandLevel,
      });
    }
  }
}

fetchResult(searchQuery.value).finally(() => (loading.value = false));

watch(
  () => route.query.q,
  (newQuery) => {
    searchQuery.value = (newQuery as string) || '';
    results.value = [];
    loading.value = true;
    fetchResult(searchQuery.value).finally(() => (loading.value = false));
  }
);
</script>
