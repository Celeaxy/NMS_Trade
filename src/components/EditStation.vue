<template>
  <v-container>
    <h1>Edit Station</h1>
    <v-form v-if="station" @submit.prevent="saveChanges">
      <v-text-field
        v-model="stationName"
        label="Station Name"
        prepend-inner-icon="mdi-domain"
        required
      />
      <v-list density="compact">
        <v-list-item v-if="demands.length" v-for="demand in demands" :key="demand.itemId">
          <v-list-item-title>
            {{ getItemById(demand.itemId)?.name }}
          </v-list-item-title>
          <v-list-item-subtitle> Demand: {{ demand.demandLevel }}% </v-list-item-subtitle>
          <template #append>
            <v-btn
              color="red"
              icon="mdi-delete"
              @click="handleDelete(demand.itemId)"
              variant="text"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-list-item>
        <v-list-item v-else>
          <v-list-item-title>No item demands set.</v-list-item-title>
        </v-list-item>
        <v-btn icon="mdi-plus" @click="handleAddDemand"></v-btn>
      </v-list>

      <v-btn type="submit" color="primary" class="mt-4">Save Changes</v-btn>
    </v-form>
    <v-alert v-else type="error" class="mt-6">Station not found.</v-alert>

    <FormDialog v-model="demandDialog" title="Add Demand" @submit="submitDemandDialog">
      <template #form>
        <v-autocomplete
          v-model="selectedItemId"
          :items="availableItems"
          item-title="name"
          item-value="id"
          label="Search or select item..."
          :search-input.sync="itemFilter"
          clearable
          :menu-props="{ maxHeight: '200px' }"
          @update:model-value="onAutocompleteSelect"
          class="mb-2"
        >
          <template #no-data>
            <v-list-item :class="{ 'bg-primary text-white': selectedItemId === -1 }">
              <v-list-item-title>Add new item...</v-list-item-title>
            </v-list-item>
          </template>
        </v-autocomplete>
        <v-text-field
          v-if="selectedItemId === -1"
          v-model.number="formData.itemId"
          type="number"
          label="Value"
          class="mb-2"
        />
        <v-text-field
          v-model.number="formData.demandLevel"
          type="number"
          step="any"
          label="Demand (%)"
          class="mb-2"
        />
      </template>
    </FormDialog>

    <ConfirmDialog v-model="visible" :title="title" :message="message" @resolve="resolve" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Station, Item, Demand } from '../types';

import { ItemAPI, StationAPI, DemandAPI } from '../crud';
import {
  VContainer,
  VForm,
  VTextField,
  VBtn,
  VList,
  VListItem,
  VAutocomplete,
  VAlert,
  VIcon,
  VListItemSubtitle,
  VListItemTitle,
} from 'vuetify/components';
import ConfirmDialog from './dialogs/ConfirmDialog.vue';
import FormDialog from './dialogs/FormDialog.vue';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useFormDialog } from '../composables/useFormDialog';

const route = useRoute();
const router = useRouter();

const stationId = Number(route.params.id);
const station = ref<Station | null>(null);
const stationName = ref('');

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const demands = ref<Demand[]>([]);

const selectedItemId = ref<number | null>(null);

const {
  open: openDemandDialog,
  submit: submitDemandDialog,
  dialog: demandDialog,
  formData,
} = useFormDialog<{ itemId: number | null; demandLevel: number }>({
  itemId: null,
  demandLevel: 0,
});

const { confirm, visible, title, message, resolve } = useConfirmDialog();
async function fetchAll() {
  stations.value = await StationAPI.fetch();
  items.value = await ItemAPI.fetch();
  demands.value = (await DemandAPI.fetch()).filter((demand) => demand.stationId === stationId);
}

onMounted(async () => {
  await fetchAll();
  station.value = stations.value.find((s) => s.id === stationId) || null;
  stationName.value = station.value ? station.value.name : '';
});

const itemFilter = ref('');
const availableItems = computed(() => {
  if (!station.value) return [];
  const usedIds = demands.value.map((demand) => demand.itemId);
  return items.value.filter((item) => !usedIds.includes(item.id));
});

function getItemById(id: number | null): Item | undefined {
  return items.value.find((item) => item.id === id);
}

async function handleAddDemand() {
  const data = await openDemandDialog();
  if (!data?.itemId) return;
  await DemandAPI.create(stationId, data.itemId, data.demandLevel);
  await fetchAll();
}

async function handleDelete(itemId: number) {
  const ok = await confirm(
    `Are you sure you want to delete ${getItemById(itemId)?.name} from ${station.value?.name}?`,
    'Delete Demand'
  );
  if (!ok) return;
  await DemandAPI.delete(stationId, itemId);
  await fetchAll();
}

async function saveChanges() {
  await StationAPI.update(stationId, {
    name: stationName.value,
  });
  router.push({ name: 'Stations' });
}

function selectItem(id: number) {
  selectedItemId.value = id;
  if (id !== -1) {
    const item = availableItems.value.find((i) => i.id === id);
    itemFilter.value = item ? item.name : '';
  }
}

function onAutocompleteSelect(val: number | null) {
  if (val === null) {
    selectedItemId.value = null;
    return;
  }
  selectItem(val);
}
</script>
