// src/cache.ts
import { ref } from 'vue';

// Simple in-memory cache for items, stations, and demands
const itemsCache = ref<any[] | null>(null);
const stationsCache = ref<any[] | null>(null);
const demandsCache = ref<any[] | null>(null);

export function getItemsCache() {
  return itemsCache.value;
}
export function setItemsCache(items: any[]) {
  itemsCache.value = items;
}
export function clearItemsCache() {
  itemsCache.value = null;
}

export function getStationsCache() {
  return stationsCache.value;
}
export function setStationsCache(stations: any[]) {
  stationsCache.value = stations;
}
export function clearStationsCache() {
  stationsCache.value = null;
}

export function getDemandsCache() {
  return demandsCache.value;
}
export function setDemandsCache(demands: any[]) {
  demandsCache.value = demands;
}
export function clearDemandsCache() {
  demandsCache.value = null;
}

export function clearAllCache() {
  clearItemsCache();
  clearStationsCache();
  clearDemandsCache();
}
