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
          <v-btn icon="mdi-pencil" @click="editItem(item.id)" variant="text"></v-btn>
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
    <v-fab icon="mdi-plus" @click="handleAddItem" app></v-fab>

    <FormDialog v-model="dialog" :title="dialogTitle" @submit="submit">
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
import { computed, onMounted, ref } from 'vue';
import type { Item } from '../types';
import { ItemAPI } from '../crud';
import { VList, VListItem, VBtn, VFab, VTextField, VSpacer, VContainer } from 'vuetify/components';
import ConfirmDialog from '../components/dialogs/ConfirmDialog.vue';
import FormDialog from '../components/dialogs/FormDialog.vue';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useFormDialog } from '../composables/useFormDialog';

const items = ref<Item[]>([]);

const {
  visible: confirmVisible,
  resolve: confirmResolve,
  message: confirmMessage,
  confirm,
  title: confirmTitle,
} = useConfirmDialog();

const dialogMode = ref<'add' | 'edit'>('add');
const dialogTitle = computed(() => (dialogMode.value === 'add' ? 'Add Item' : 'Edit Item'));

const {
  open: openItemDialog,
  dialog,
  formData,
  submit,
} = useFormDialog({
  name: '',
  value: 0,
});

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

async function handleAddItem() {
  dialogMode.value = 'add';
  const data = await openItemDialog();
  if (!data?.name.trim()) return;
  await ItemAPI.create(data.name, data.value);
  items.value = await ItemAPI.fetch();
}

async function editItem(id: number) {
  const item = getItemById(id);
  if (!item) return;
  dialogMode.value = 'edit';
  const data = await openItemDialog({ name: item.name, value: item.value });
  if (!data?.name.trim()) return;
  const { name, value } = data;
  await ItemAPI.update(id, { name, value });
  items.value = await ItemAPI.fetch();
}

onMounted(async () => {
  items.value = await ItemAPI.fetch();
});
</script>
