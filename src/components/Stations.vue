<template>
  <div>
    <h1>Stations</h1>
    <form @submit.prevent="addStation">
      <input v-model="newStationName" placeholder="New station name" />
      <button type="submit">Add Station</button>
    </form>
    <ul>
      <li v-for="station in stations" :key="station.id">
        {{ station.name }}
        <button @click="removeStation(station.id)">Remove</button>
        <router-link :to="{ name: 'EditStation', params: { id: station.id } }">Edit</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Station } from '../types';
import { StationAPI } from '../crud';

const stations = ref<Station[]>([]);

const newStationName = ref('');
const router = useRouter();

async function addStation() {
  const name = newStationName.value.trim();
  if (!name) return;

  const newStation = await StationAPI.create(name);

  router.push({ name: 'EditStation', params: { id: newStation.id } });
}

async function removeStation(id: number) {
  await StationAPI.delete(id);
  stations.value = await StationAPI.fetch();
}

onMounted(async () => {
  stations.value = await StationAPI.fetch();
});

watch(
  stations,
  (newStations) => {
    console.log('Stations updated:', newStations);
  },
  { deep: true }
);
</script>
