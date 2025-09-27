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
            @click="handleDelete(item.id)"
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
      v-model="confirmVisible"
      :title="confirmTitle"
      :message="confirmMessage"
      @resolve="confirmResolve"
    />
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Item } from '../types';
import { ItemAPI } from '../crud';
import { VList, VListItem, VBtn, VFab, VTextField, VSpacer, VContainer } from 'vuetify/components';
import ConfirmDialog from '../components/dialogs/ConfirmDialog.vue';
import FormDialog from '../components/dialogs/FormDialog.vue';
import { useConfirmDialog } from '../composables/useConfirmDialog';

const items = ref<Item[]>([]);
const addItemDialog = ref(false);

const formData = ref({
  name: '',
  value: 0,
});

const {
  visible: confirmVisible,
  resolve: confirmResolve,
  message: confirmMessage,
  confirm,
  title: confirmTitle,
} = useConfirmDialog();

function getItemById(id: number | null): Item | null {
  return items.value.find((i) => i.id === id) || null;
}

async function handleDelete(id: number) {
  const ok = await confirm(
    `Are you sure you want to delete ${getItemById(id)?.name}?`,
    'Delete Item'
  );
  if (!ok) return;

  await ItemAPI.delete(id);
  items.value = await ItemAPI.fetch();
}

async function addItem() {
  const name = formData.value.name.trim();
  console.log('Adding item', name, formData.value.value);
  if (!name) return;

  await ItemAPI.create(name, formData.value.value);

  formData.value.name = '';
  formData.value.value = 0;

  items.value = await ItemAPI.fetch();
}

onMounted(async () => {
  items.value = await ItemAPI.fetch();
});
</script>
