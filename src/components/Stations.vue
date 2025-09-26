<template>
  <v-container>
    <h1>Stations</h1>
    <v-list>
      <v-list-item v-for="station in stations" :key="station.id" :title="station.name">
        <template v-slot:append>
          <v-btn icon="mdi-pencil" @click="editStation(station.id)" variant="text"></v-btn>
          <v-btn
            color="red"
            icon="mdi-delete"
            @click="
              stationToDelete = station.id;
              showConfirmDelete = true;
            "
            variant="text"
          ></v-btn>
        </template>
      </v-list-item>

      <v-list-item>
        <v-spacer> </v-spacer>
      </v-list-item>
    </v-list>

    <v-fab icon="mdi-plus" @click="addStationDialog = true" app></v-fab>

    <FormDialog v-model="addStationDialog" title="Add Station" @submit="addStation">
      <template #form>
        <v-text-field v-model="newStationName" label="New station name" />
      </template>
    </FormDialog>

    <ConfirmDialog
      v-model="showConfirmDelete"
      title="Delete Station"
      :message="`Are you sure you want to delete ${getStationById(stationToDelete)?.name}?`"
      @confirm="deleteStation"
    />
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Station } from '../types';
import { StationAPI } from '../crud';
import { VFab, VTextField, VBtn, VList, VListItem, VSpacer, VContainer } from 'vuetify/components';
import ConfirmDialog from './ConfirmDialog.vue';
import FormDialog from './FormDialog.vue';

const stations = ref<Station[]>([]);

const newStationName = ref('');
const router = useRouter();
const addStationDialog = ref(false);

const showConfirmDelete = ref(false);
const stationToDelete = ref<number | null>(null);

function getStationById(id: number | null): Station | null {
  return stations.value.find((s) => s.id === id) || null;
}

async function deleteStation() {
  if (stationToDelete.value !== null) {
    await StationAPI.delete(stationToDelete.value);
    stations.value = await StationAPI.fetch();
    stationToDelete.value = null;
  }
  showConfirmDelete.value = false;
}

async function addStation() {
  const name = newStationName.value.trim();
  if (!name) return;

  const newStation = await StationAPI.create(name);

  router.push({ name: 'EditStation', params: { id: newStation.id } });
}

function editStation(id: number) {
  router.push({ name: 'EditStation', params: { id } });
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
