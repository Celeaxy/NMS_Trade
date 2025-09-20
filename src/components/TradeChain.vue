<template>
  <div class="trade-chain-container">
    <div class="collapsible-header">
      <button class="collapse-btn" @click="collapsedChain = !collapsedChain">
        <span v-if="collapsedChain">▼</span>
        <span v-else>▲</span>
      </button>
      <h1>Trade Chain</h1>
    </div>
    <div v-show="!collapsedChain">
      <div v-if="chains.length">
        <template v-for="(chain, idx) in chains" :key="chain.station.id">
          <div class="station-card">
            <div class="station-header">
              <strong>{{ chain.station.name }}</strong>
            </div>
            <div class="trade-details">
              <div v-if="chain.buys.length" class="trade-list buys">
                <span class="trade-label">Buy:</span>
                <span
                  v-for="buy in chain.buys"
                  :key="buy.item.id"
                  class="trade-item"
                  :title="getItemTooltip(buy.item.id)"
                >
                  {{ buy.item.name }} <span class="trade-value">({{ buy.price.toFixed(2) }})</span>
                </span>
              </div>
              <div v-if="chain.sells.length" class="trade-list sells" style="margin-top: 8px">
                <span class="trade-label">Sell:</span>
                <span
                  v-for="sell in chain.sells"
                  :key="sell.item.id"
                  class="trade-item"
                  :title="getItemTooltip(sell.item.id)"
                >
                  {{ sell.item.name }}
                  <span class="trade-value">({{ sell.price.toFixed(2) }})</span>
                </span>
              </div>
            </div>
          </div>
          <div v-if="idx < chains.length - 1" class="arrow">⇩</div>
        </template>
      </div>
      <div v-else class="no-chain">
        <p>No profitable trade chain found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Item } from '../item';
import { Station } from '../station';

const props = defineProps<{ chains: Array<{ station: Station; buys: Array<{ item: Item; price: number }>; sells: Array<{ item: Item; price: number }> }> }>();
const collapsedChain = ref(false);

function getItemTooltip(itemId: number): string {
  // Find all stations where this item is bought and sold in the chain
  const buyStations: string[] = [];
  let sellStation: string | null = null;
  for (const chain of props.chains) {
    if (chain.buys.some((buy) => buy.item.id === itemId)) {
      buyStations.push(chain.station.name);
    }
    if (chain.sells.some((sell) => sell.item.id === itemId)) {
      sellStation = chain.station.name;
    }
  }
  let tooltip = '';
  if (buyStations.length) {
    tooltip += `Bought at: ${buyStations.join(', ')}`;
  }
  if (sellStation) {
    tooltip += (tooltip ? '\n' : '') + `Sold at: ${sellStation}`;
  }
  return tooltip;
}
</script>

<style scoped>
.trade-chain-container {
  max-width: 700px;
  margin: 32px auto;
  background: #f8f9fa;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px 24px;
}
.collapsible-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.collapse-btn {
  border: none;
  background: #e3e6ea;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 20px;
  cursor: pointer;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: background 0.2s;
}
.collapse-btn:hover {
  background: #d1d5db;
}
.station-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  padding: 20px 18px;
  transition: box-shadow 0.2s;
}
.station-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
.station-header {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 10px;
  color: #2c3e50;
}
.trade-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 8px;
}
.trade-list {
  display: flex;
  align-items: center;
  gap: 8px;
}
.trade-label {
  font-weight: 500;
  color: #6c757d;
  margin-right: 4px;
}
.trade-item {
  background: #eaf6fb;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 1rem;
  color: #1976d2;
  cursor: pointer;
  transition: background 0.2s;
}
.trade-item:hover {
  background: #d0e7f7;
}
.trade-value {
  color: #495057;
  font-size: 0.95em;
  margin-left: 2px;
}
.arrow {
  text-align: center;
  font-size: 1.5rem;
  color: #1976d2;
  margin: 16px 0;
}
.no-chain {
  text-align: center;
  color: #888;
  font-size: 1.1rem;
  margin-top: 32px;
}
</style>
