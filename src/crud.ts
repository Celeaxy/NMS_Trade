import type { _Awaitable } from 'vue-router';
import { cached, type CachedFunction } from './cache';
import type { Item, Station, Demand } from './types';

const TTL = 1000 * 60 * 5; // 5 minutes

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiRequestOptions {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number>;
  body?: unknown;
}

async function apiRequest<T>({ method = 'GET', path, query, body }: ApiRequestOptions): Promise<T> {
  const userToken = localStorage.getItem('user_token');
  if (!userToken) throw new Error('User token not found');

  const queryString = query
    ? '?' + new URLSearchParams(query as Record<string, string>).toString()
    : '';

  const response = await fetch(`https://nms-trade-backend.onrender.com/api/${path}${queryString}`, {
    method,
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) throw new Error(`Request failed: ${response.statusText}`);
  return await response.json();
}

function buildCRUD<T>(
  entity: string,
  fetchFn: CachedFunction<unknown[], T>,
  clearRelated?: () => void
) {
  return {
    fetch: fetchFn,
    create: (body: Record<string, unknown>) =>
      apiRequest<T>({ method: 'POST', path: entity, body }).then(result => {
        fetchFn.clear();
        clearRelated?.();
        return result;
      }),
    update: (idOrQuery: string | Record<string, string | number>, updates: Partial<T>) =>
      apiRequest<T>({
        method: 'PUT',
        path: entity + (typeof idOrQuery === 'string' ? `/${idOrQuery}` : ''),
        query: typeof idOrQuery === 'object' ? idOrQuery : undefined,
        body: updates,
      }).then(result => {
        fetchFn.clear();
        clearRelated?.();
        return result;
      }),
    delete: (idOrQuery: string | Record<string, string | number>) =>
      apiRequest<void>({
        method: 'DELETE',
        path: entity + (typeof idOrQuery === 'string' ? `/${idOrQuery}` : ''),
        query: typeof idOrQuery === 'object' ? idOrQuery : undefined,
      }).then(() => {
        fetchFn.clear();
        clearRelated?.();
      }),
  };
}

const fetchItems = cached(() => apiRequest<Item[]>({ path: 'items' }), TTL);
const fetchStations = cached(() => apiRequest<Station[]>({ path: 'stations' }), TTL);
const fetchDemands = cached(() => apiRequest<Demand[]>({ path: 'demands' }), TTL);

export const ItemAPI = {
  fetch: fetchItems,
  create: (name: string, value: number) =>
    apiRequest<Item>({ method: 'POST', path: 'item', body: { name, value } }).then(item => {
      fetchItems.clear();
      return item;
    }),
  update: (id: number, updates: Partial<Item>) =>
    apiRequest<Item>({ method: 'PUT', path: `item/${id}`, body: updates }).then(item => {
      fetchItems.clear();
      return item;
    }),
  delete: (id: number) =>
    apiRequest<void>({ method: 'DELETE', path: `item/${id}` }).then(() => {
      fetchItems.clear();
      fetchDemands.clear();
    }),
};

export const StationAPI = {
  fetch: fetchStations,
  create: (name: string) =>
    apiRequest<Station>({ method: 'POST', path: 'station', body: { name } }).then(station => {
      fetchStations.clear();
      return station;
    }),
  update: (id: number, updates: Partial<Station>) =>
    apiRequest<Station>({ method: 'PUT', path: `station/${id}`, body: updates }).then(station => {
      fetchStations.clear();
      return station;
    }),
  delete: (id: number) =>
    apiRequest<void>({ method: 'DELETE', path: `station/${id}` }).then(() => {
      fetchStations.clear();
      fetchDemands.clear();
    }),
};

export const DemandAPI = {
  fetch: fetchDemands,
  create: (stationId: number, itemId: number, demandLevel: number) =>
    apiRequest<Demand>({
      method: 'POST', path: 'demand', body: { stationId, itemId, demandLevel }
    }).then(demand => {
      fetchDemands.clear();
      return demand;
    }),
  update: (stationId: number, itemId: number, updates: Partial<Demand>) =>
    apiRequest<Demand>({
      method: 'PUT', path: 'demand', query: { stationId, itemId }, body: updates
    }).then(demand => {
      fetchDemands.clear();
      return demand;
    }),
  delete: (stationId: number, itemId: number) =>
    apiRequest<void>({
      method: 'DELETE', path: 'demand', query: { stationId, itemId }
    }).then(() => {
      fetchDemands.clear();
    }),
};