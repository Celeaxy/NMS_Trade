<template>
  <div>
    <div class="legend">
      <span class="legend-item" style="background:#4caf50"></span> Only Buys
      <span class="legend-item" style="background:#1976d2"></span> Only Sells
      <span class="legend-item" style="background:#ffb74d"></span> Buys & Sells
      <span class="legend-item" style="background:#bdbdbd"></span> No Trades
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

use([GraphChart, TitleComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{ chains: any[] }>();

const stations = computed(() => {
  // Extract all unique stations from chains
  const stationMap = new Map<
    string,
    { id: string; name: string; buys: string[]; sells: string[] }
  >();
  for (const chain of props.chains) {
    const buys = chain.buys.map((b: any) => b.item.name);
    const sells = chain.sells.map((s: any) => s.item.name);
    stationMap.set(String(chain.station.id), {
      id: String(chain.station.id),
      name: chain.station.name,
      buys,
      sells,
    });
  }
  return Array.from(stationMap.values());
});

const option = computed(() => {
  const nodes = stations.value.map((station) => {
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
    source: string;
    target: string;
    label: { show: boolean; formatter: string };
    symbol: string[];
  }> = [];
  for (const source of stations.value) {
    for (const item of source.sells) {
      for (const target of stations.value) {
        if (source.id !== target.id && target.buys.includes(item)) {
          links.push({
            source: source.id,
            target: target.id,
            label: {
              show: false,
              formatter: item,
            },
            symbol: ['arrow', 'circle'],
          });
        }
      }
    }
  }
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
