<template>
  <v-dialog max-width="400">
    <v-card>
      <v-card-title class="text-h6">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="$emit('resolve', false)">Cancel</v-btn>
        <v-btn color="red" variant="flat" @click="$emit('resolve', true)">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
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

defineEmits(['resolve']);
</script>
