import { createRouter, createWebHistory } from 'vue-router';

import TradeOverview from './components/TradeOverview.vue';
import Stations from './components/Stations.vue';
import Items from './components/Items.vue';
import EditStation from './components/EditStation.vue';
import Search from './components/Search.vue';

const routes = [
  { path: '/', name: 'TradeOverview', component: TradeOverview },
  { path: '/stations', name: 'Stations', component: Stations },
  { path: '/items', name: 'Items', component: Items },
  { path: '/edit-station/:id', name: 'EditStation', component: EditStation, props: true },
  { path: '/search', name: 'Search', component: Search },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
