<template>
    <div>
        <h1>Trade Opportunities</h1>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Buy Station</th>
                    <th>Sell Station</th>
                    <th>% Margin</th>
                    <th>Total Gain (per unit)</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="op in opportunities" :key="op.itemId + '-' + op.buyStationId + '-' + op.sellStationId">
                    <td>{{ op.itemName }}</td>
                    <td>{{ op.buyStationName }}</td>
                    <td>{{ op.sellStationName }}</td>
                    <td>{{ op.margin.toFixed(2) }}%</td>
                    <td>{{ op.gain.toFixed(2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Station } from '../station';
import { getLocalStorageItem } from '../storage';

const stations = ref<Station[]>([]);

onMounted(() => {
    stations.value = getLocalStorageItem<Station[]>('stations') ?? [];
});

// Compute trade opportunities
const opportunities = computed(() => {
    const ops: Array<{
        itemId: number;
        itemName: string;
        buyStationId: number;
        buyStationName: string;
        sellStationId: number;
        sellStationName: string;
        margin: number;
        gain: number;
    }> = [];

    // Flatten all items with their station
    const allItems: Array<{
        stationId: number;
        stationName: string;
        itemId: number;
        itemName: string;
        baseValue: number;
        demand: number;
    }> = [];
    for (const station of stations.value) {
        for (const tradeItem of station.items) {
            allItems.push({
                stationId: station.id,
                stationName: station.name,
                itemId: tradeItem.item.id,
                itemName: tradeItem.item.name,
                baseValue: tradeItem.item.value,
                demand: tradeItem.demand,
            });
        }
    }

    // For each item, find best buy/sell station pair
    const itemsById = new Map<number, Array<typeof allItems[0]>>();
    for (const entry of allItems) {
        if (!itemsById.has(entry.itemId)) itemsById.set(entry.itemId, []);
        itemsById.get(entry.itemId)!.push(entry);
    }

    for (const [itemId, entries] of itemsById.entries()) {
        // Find lowest demand (best buy) and highest demand (best sell)
        let buy = entries[0], sell = entries[0];
        for (const entry of entries) {
            if (entry.demand < buy.demand) buy = entry;
            if (entry.demand > sell.demand) sell = entry;
        }
        if (buy.stationId !== sell.stationId && sell.demand > buy.demand) {
            const buyPrice = buy.baseValue * (1 + buy.demand / 100);
            const sellPrice = sell.baseValue * (1 + sell.demand / 100);
            const margin = sell.demand - buy.demand;
            const gain = sellPrice - buyPrice;
            ops.push({
                itemId,
                itemName: buy.itemName,
                buyStationId: buy.stationId,
                buyStationName: buy.stationName,
                sellStationId: sell.stationId,
                sellStationName: sell.stationName,
                margin,
                gain,
            });
        }
    }

    return ops;
});
</script>
