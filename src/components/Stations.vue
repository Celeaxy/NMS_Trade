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
        <router-link :to="`/edit-station/${station.id}`">Edit</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Station } from '../station';
import { getStationsCache, setStationsCache, clearStationsCache } from '../cache';



const stations = ref<Station[]>(getStationsCache()?.map((s: any) => new Station(s.name, s.id)) ?? []);
const newStationName = ref('');
const router = useRouter();
const userToken = localStorage.getItem('user_token');



async function fetchStationsIfNeeded() {
  if (!userToken) return;
  let cached = getStationsCache();
  if (!cached) {
    const res = await fetch(`/api/stations?userToken=${userToken}`);
    cached = await res.json();
    if (cached) setStationsCache(cached);
  }
  stations.value = (cached ?? []).map((s: any) => new Station(s.name, s.id));
}


onMounted(() => {
  fetchStationsIfNeeded();
});



async function addStation() {
  if (!newStationName.value.trim() || !userToken) return;
  const maxId = stations.value.length ? Math.max(...stations.value.map((s) => s.id)) : 0;
  const newStation = { id: maxId + 1, name: newStationName.value.trim(), userToken };
  await fetch('/api/stations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newStation)
  });
  clearStationsCache();
  await fetchStationsIfNeeded();
  newStationName.value = '';
  router.push(`/edit-station/${newStation.id}`);
}



async function removeStation(id: number) {
  if (!userToken) return;
  await fetch(`/api/stations/${id}?userToken=${userToken}`, { method: 'DELETE' });
  clearStationsCache();
  await fetchStationsIfNeeded();
}
</script>
