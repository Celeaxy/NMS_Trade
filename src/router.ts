import { createRouter, createWebHistory } from 'vue-router';

import Opportunities from './components/Opportunities.vue';
import Stations from './components/Stations.vue';
import Items from './components/Items.vue';
import EditStation from './components/EditStation.vue';
import TradeChain from './components/TradeChain.vue';

const routes = [
  { path: '/', name: 'Opportunities', component: Opportunities },
  { path: '/stations', name: 'Stations', component: Stations },
  { path: '/items', name: 'Items', component: Items },
  { path: '/edit-station/:id', name: 'EditStation', component: EditStation, props: true },
  { path: '/trade-chain', name: 'TradeChain', component: TradeChain },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
