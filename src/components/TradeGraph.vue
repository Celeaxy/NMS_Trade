<template>
  <div>
    <div class="legend">
      <span class="legend-item" style="background: #4caf50"></span> Only Buys
      <span class="legend-item" style="background: #1976d2"></span> Only Sells
      <span class="legend-item" style="background: #ffb74d"></span> Buys & Sells
      <span class="legend-item" style="background: #bdbdbd"></span> No Trades
    </div>
    <div style="height: 1000px; width: 100%">
      <v-chart :option="option" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { Demand, Item, Station } from '../types';

use([GraphChart, TitleComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{ demands: Demand[]; items: Item[]; stations: Station[] }>();

const option = computed(() => {
  const { stations, demands, items } = props;
  const nodes = stations.map((station) => {
    let color = '#bdbdbd'; // default gray
    if (station.buys.length && !station.sells.length) {
      color = '#4caf50'; // green for only buying
    } else if (!station.buys.length && station.sells.length) {
      color = '#1976d2'; // blue for only selling
    } else if (station.buys.length && station.sells.length) {
      color = '#ffb74d'; // light orange for both
    }
    return {
      id: station.id,
      name: station.name,
      symbolSize: 50,
      itemStyle: { color },
      tooltip: {
        show: true,
        formatter: () => {
          let tip = `<b>${station.name}</b>`;
          if (station.buys.length) tip += `<br>Buys: ${station.buys.join(', ')}`;
          if (station.sells.length) tip += `<br>Sells: ${station.sells.join(', ')}`;
          return tip;
        },
      },
    };
  });
  // Create directed links from selling stations to buying stations for each item
  const links: Array<{
    sourceId: number;
    targetId: number;
    label: { show: boolean; formatter: string };
    symbol: string[];
  }> = [];

  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        data: nodes,
        force: {
          repulsion: 3000,
          edgeLength: [200, 200],
        },
        links,
        label: { show: true },
        edgeLabel: { show: true, formatter: (params: any) => params.data.label.formatter },
        lineStyle: { color: '#888', width: 2 },
        // edgeSymbol: ['arrow', 'circle'],
        edgeSymbolSize: [16, 8],
      },
    ],
  };
});
</script>

<style scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
  font-size: 1rem;
}
.legend-item {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 6px;
  border: 1.5px solid #888;
  vertical-align: middle;
}
</style>
