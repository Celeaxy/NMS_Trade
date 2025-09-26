<template>
  <v-container>
    <h1>Items</h1>
    <v-list>
      <v-list-item
        v-for="item in items"
        :key="item.id"
        :title="item.name"
        :subtitle="'Value: ' + item.value"
      >
        <template v-slot:append>
          <v-btn color="red" icon="mdi-delete" @click="removeItem(item.id)" variant="text"></v-btn>
        </template>
      </v-list-item>
      <v-list-item>
        <v-spacer> </v-spacer>
      </v-list-item>
    </v-list>
    <v-fab icon="mdi-plus" @click="addItemDialog = true" app></v-fab>
    <v-dialog v-model="addItemDialog" max-width="600px">
      <v-sheet>
        <v-form @submit.prevent="addItem" class="d-flex flex-column pa-2">
          <v-text-field v-model="newItemName" label="New item name" />
          <v-text-field v-model.number="newItemValue" type="number" label="Value" />
          <v-btn color="primary" type="submit">Add</v-btn>
        </v-form>
      </v-sheet>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Item } from '../types';
import { ItemAPI } from '../crud';
import {
  VSheet,
  VList,
  VListItem,
  VBtn,
  VFab,
  VDialog,
  VForm,
  VTextField,
  VSpacer,
  VContainer,
} from 'vuetify/components';

const items = ref<Item[]>([]);
const newItemName = ref('');
const newItemValue = ref(0);
const addItemDialog = ref(false);

async function addItem() {
  const name = newItemName.value.trim();
  if (!name) return;

  await ItemAPI.create(name, newItemValue.value);

  newItemName.value = '';
  newItemValue.value = 0;

  items.value = await ItemAPI.fetch();
}

async function removeItem(id: number) {
  await ItemAPI.delete(id);
  items.value = await ItemAPI.fetch();
}

onMounted(async () => {
  items.value = await ItemAPI.fetch();
});
</script>
