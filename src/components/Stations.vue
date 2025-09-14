
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
import { Station } from '../station';
import { getLocalStorageItem, setLocalStorageItem } from '../storage';

const stations = ref<Station[]>([]);
const newStationName = ref('');

onMounted(() => {
  stations.value = getLocalStorageItem<Station[]>('stations') ?? [];
});

function addStation() {
  if (!newStationName.value.trim()) return;
  const newStation = new Station(newStationName.value.trim(),
    stations.value.length ? Math.max(...stations.value.map(s => s.id)) + 1 : 1);
  stations.value.push(newStation);
  setLocalStorageItem('stations', stations.value);
  newStationName.value = '';
}

function removeStation(id: number) {
  stations.value = stations.value.filter(s => s.id !== id);
  setLocalStorageItem('stations', stations.value);
}
</script>
