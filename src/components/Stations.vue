<template>
  <v-sheet>
    <h1>Stations</h1>
  <v-list>
      <v-list-item
        v-for="station in stations"
        :key="station.id"
        :title="station.name"
      >
      <template v-slot:append>
        <v-btn icon="mdi-pencil" @click="editStation(station.id)" variant="text"></v-btn>
        <v-btn color="red" icon="mdi-delete" @click="removeStation(station.id)" variant="text"></v-btn>
        </template>
      </v-list-item>

      <v-list-item>
        <v-spacer> </v-spacer>
      </v-list-item>
    </v-list>

  <v-fab icon="mdi-plus" @click="addStationDialog = true" app></v-fab>
  <v-dialog v-model="addStationDialog" max-width="600px">
    <v-sheet>
      <v-form @submit.prevent="addStation" class="d-flex flex-column pa-2">
        <v-text-field v-model="newStationName" label="New station name" />
        <v-btn color="primary" type="submit">Add</v-btn>
      </v-form>
    </v-sheet>
  </v-dialog>
  </v-sheet>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Station } from '../types';
import { StationAPI } from '../crud';
import{ VSheet, VFab, VDialog, VForm, VTextField, VBtn, VList, VListItem, VSpacer} from 'vuetify/components';

const stations = ref<Station[]>([]);

const newStationName = ref('');
const router = useRouter();
const addStationDialog = ref(false);

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
