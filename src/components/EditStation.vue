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
              @click="
                itemToDelete = demand.itemId;
                showConfirmDelete = true;
              "
              variant="text"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-list-item>
        <v-list-item v-else>
          <v-list-item-title>No item demands set.</v-list-item-title>
        </v-list-item>
        <v-btn icon="mdi-plus" @click="addDemandDialog = true"></v-btn>
      </v-list>

      <v-btn type="submit" color="primary" class="mt-4">Save Changes</v-btn>
    </v-form>
    <v-alert v-else type="error" class="mt-6">Station not found.</v-alert>

    <FormDialog v-model="addDemandDialog" title="Add Demand" @submit="addItemToStation">
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
          v-model.number="newItemValue"
          type="number"
          label="Value"
          ref="valueInput"
          class="mb-2"
        />
        <v-text-field
          v-model.number="newDemand"
          type="number"
          step="any"
          label="Demand (%)"
          ref="demandInput"
          class="mb-2"
        />
      </template>
    </FormDialog>

    <ConfirmDialog
      v-model="showConfirmDelete"
      title="Delete Demand"
      :message="`Are you sure you want to delete demand for ${getItemById(itemToDelete)?.name}?`"
      @confirm="deleteDemand"
    />
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

const route = useRoute();
const router = useRouter();

const stationId = Number(route.params.id);
const station = ref<Station | null>(null);
const stationName = ref('');

const items = ref<Item[]>([]);
const stations = ref<Station[]>([]);
const demands = ref<Demand[]>([]);

const selectedItemId = ref<number | null>(null);
const newDemand = ref<number>(0);
const newItemValue = ref<number>(0);

const itemToDelete = ref<number | null>(null);
const addDemandDialog = ref(false);
const showConfirmDelete = ref(false);

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

function resetNewItemInput() {
  itemFilter.value = '';
  newItemValue.value = 0;
  selectedItemId.value = null;
}

async function addItemToStation() {
  if (selectedItemId.value === null) return;
  let item: Item | undefined;
  if (selectedItemId.value === -1) {
    if (!itemFilter.value.trim()) return;
    const baseValue = Number(
      (newDemand.value !== 0
        ? newItemValue.value / (1 + newDemand.value / 100)
        : newItemValue.value
      ).toFixed(2)
    );

    const newItem = await ItemAPI.create(itemFilter.value.trim(), baseValue);
    resetNewItemInput();
    await fetchAll();
    item = newItem;
  } else {
    item = items.value.find((i) => i.id === selectedItemId.value);
  }

  if (!item) return;
  await DemandAPI.create(stationId, item.id, newDemand.value);
  await fetchAll();
  selectedItemId.value = null;
  newDemand.value = 0;
  itemFilter.value = '';
}

async function deleteDemand() {
  if (itemToDelete.value !== null) {
    const demand = demands.value.find(
      (d) => d.stationId === stationId && d.itemId === itemToDelete.value
    );
    if (demand) {
      await DemandAPI.delete(stationId, itemToDelete.value);
      await fetchAll();
    }
    itemToDelete.value = null;
  }
  showConfirmDelete.value = false;
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
