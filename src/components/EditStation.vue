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
            <v-btn icon="mdi-pencil" @click="handleEditDemand(demand)" variant="text"></v-btn>
            <v-btn color="red" icon="mdi-delete" @click="handleDelete(demand)" variant="text">
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

    <FormDialog v-model="demandDialog" @submit="createAndSubmit" :title="demandTitle">
      <template #form>
        <v-combobox
          v-model="demandFormData.item"
          v-model:search="itemFilter"
          :hide-no-data="false"
          :items="availableItems"
          item-title="name"
          return-object
          label="Search or select item..."
          :clearable="dialogMode !== 'edit'"
          :menu-props="{ maxHeight: '200px' }"
          :readonly="dialogMode === 'edit'"
          auto-select-first
          @update:model-value="onNewItemSelected"
          ref="combobox"
          @keydown.enter="handleKeySelect"
          @keydown.tab="handleKeySelect"
        >
          <template #no-data>
            <v-list-item
              @click="setNewItemMode"
              :class="{ 'bg-primary text-white': selectedItemId === -1 }"
            >
              <v-list-item-title>Add new item...</v-list-item-title>
            </v-list-item>
          </template>
        </v-combobox>
        <v-text-field
          v-if="demandFormData.newItem"
          v-model.number="demandFormData.newItem.value"
          type="number"
          label="Value at the current station"
          class="mb-2"
        />
        <v-text-field
          v-model.number="demandFormData.demandLevel"
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
  VCombobox,
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

const dialogMode = ref<'add' | 'edit'>('add');
const {
  open: openDemandDialog,
  submit: submitDemand,
  dialog: demandDialog,
  formData: demandFormData,
  title: demandTitle,
} = useFormDialog<{
  item: Item | null;
  demandLevel: number;
  newItem?: { name: string; value: number };
}>({
  item: null,
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
  dialogMode.value = 'add';
  const data = await openDemandDialog(undefined, 'Add Demand');
  if (!data?.item) return;

  await DemandAPI.create(stationId, data.item.id, data.demandLevel);
  await fetchAll();
}

async function handleEditDemand(demand: Demand) {
  dialogMode.value = 'edit';
  const item = getItemById(demand.itemId) || null;
  const data = await openDemandDialog({ item, demandLevel: demand.demandLevel }, 'Edit Demand');
  if (!data?.item) return;
  await DemandAPI.update(stationId, demand.itemId, { demandLevel: data.demandLevel });
  await fetchAll();
}

async function handleDelete(demand: Demand) {
  const ok = await confirm(
    `Are you sure you want to delete ${getItemById(demand.itemId)?.name} from ${station.value?.name}?`,
    'Delete Demand'
  );
  if (!ok) return;
  await DemandAPI.delete(stationId, demand.itemId);
  await fetchAll();
}

async function saveChanges() {
  await StationAPI.update(stationId, {
    name: stationName.value,
  });
  router.push({ name: 'Stations' });
}

function onNewItemSelected(val: string | Item | null) {
  if (typeof val === 'string') {
    demandFormData.value.newItem = { name: val, value: 0 };
  } else {
    demandFormData.value.newItem = undefined;
  }
}

async function createAndSubmit() {
  if (demandFormData.value.newItem && demandFormData.value.newItem.name.trim() !== '') {
    const baseValue =
      Math.round(
        (demandFormData.value.newItem.value / (1 + demandFormData.value.demandLevel / 100)) * 100
      ) / 100; // Rounded to 2 decimal places

    const createdItem = await ItemAPI.create(demandFormData.value.newItem.name, baseValue);
    if (createdItem && demandFormData) {
      demandFormData.value.item = createdItem;
    }
    demandFormData.value.newItem = undefined;
  }
  submitDemand();
}

const combobox = ref();

function setNewItemMode() {
  combobox.value?.blur();
}

const filteredItems = computed(() => {
  const query = itemFilter.value.toLowerCase().trim();
  return availableItems.value.filter((item) => item.name.toLowerCase().includes(query));
});

const noFilteredItems = computed(() => filteredItems.value.length === 0);
function handleKeySelect(_: KeyboardEvent) {
  if (noFilteredItems.value && itemFilter.value.trim()) {
    setNewItemMode();
  }
}
</script>
