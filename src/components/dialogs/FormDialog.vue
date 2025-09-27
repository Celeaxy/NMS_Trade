<template>
  <v-dialog
    v-model="modelValue"
    max-width="500"
    @update:model-value="(val) => emit('update:modelValue', val)"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>
        <slot name="form" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="submit">Submit</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VSpacer,
  VBtn,
} from 'vuetify/components';
const modelValue = ref(true);
defineProps({
  title: {
    type: String,
    default: 'Form',
  },
});

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);

function cancel() {
  emit('update:modelValue', false);
  emit('cancel');
}
function submit() {
  emit('submit');
  emit('update:modelValue', false);
}
</script>
