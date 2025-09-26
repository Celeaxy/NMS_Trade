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
          <v-btn
            color="red"
            icon="mdi-delete"
            @click="
              itemToDelete = item.id;
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
    <v-fab icon="mdi-plus" @click="addItemDialog = true" app></v-fab>

    <FormDialog v-model="addItemDialog" title="Add Item" @submit="addItem">
      <template #form>
        <v-text-field v-model="formData.name" label="Name" />
        <v-text-field type="number" v-model.number="formData.value" label="Value" />
      </template>
    </FormDialog>

    <ConfirmDialog
      v-model="showConfirmDelete"
      title="Delete Item"
      :message="`Are you sure you want to delete ${getItemById(itemToDelete)?.name}?`"
      @confirm="deleteItem"
    />
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Item } from '../types';
import { ItemAPI } from '../crud';
import { VList, VListItem, VBtn, VFab, VTextField, VSpacer, VContainer } from 'vuetify/components';
import ConfirmDialog from './ConfirmDialog.vue';
import FormDialog from './FormDialog.vue';
const items = ref<Item[]>([]);
const newItemName = ref('');
const newItemValue = ref(0);
const addItemDialog = ref(false);

const showConfirmDelete = ref(false);
const itemToDelete = ref<number | null>(null);

const formData = ref({
  name: '',
  value: 0,
});

function getItemById(id: number | null): Item | null {
  return items.value.find((i) => i.id === id) || null;
}

async function deleteItem() {
  if (itemToDelete.value !== null) {
    await ItemAPI.delete(itemToDelete.value);
    items.value = await ItemAPI.fetch();
  }
}

async function addItem() {
  const name = newItemName.value.trim();
  if (!name) return;

  await ItemAPI.create(name, newItemValue.value);

  formData.value.name = '';
  formData.value.value = 0;

  items.value = await ItemAPI.fetch();
}

onMounted(async () => {
  items.value = await ItemAPI.fetch();
});
</script>
