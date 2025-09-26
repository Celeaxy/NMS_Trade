import { createRouter, createWebHistory } from 'vue-router';


import TradeOverview from './components/TradeOverview.vue';
import Stations from './components/Stations.vue';
import Items from './components/Items.vue';
import EditStation from './components/EditStation.vue';
import Search from './components/Search.vue';

import { BASE_ROUTE } from './config';

const routes = [
  { path: '/', redirect: BASE_ROUTE },
  { path: BASE_ROUTE, name: 'TradeOverview', component: TradeOverview },
  { path: BASE_ROUTE + '/stations', name: 'Stations', component: Stations },
  { path: BASE_ROUTE + '/items', name: 'Items', component: Items },
  { path: BASE_ROUTE + '/edit-station/:id', name: 'EditStation', component: EditStation, props: true },
  { path: BASE_ROUTE + '/search', name: 'Search', component: Search },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
