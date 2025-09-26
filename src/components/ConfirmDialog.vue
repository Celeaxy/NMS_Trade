<template>
  <v-dialog
    max-width="400"
    v-model="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="cancel">Cancel</v-btn>
        <v-btn color="red" variant="flat" @click="confirm">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import {
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VSpacer,
  VBtn,
} from 'vuetify/components';

defineProps({
  title: {
    type: String,
    default: 'Confirm Action',
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?',
  },
});

const modelValue = ref(true);
const emit = defineEmits(['update:modelValue', 'confirm']);

function cancel() {
  emit('update:modelValue', false);
}
function confirm() {
  emit('update:modelValue', false);
  emit('confirm');
}
</script>
