import { openDB } from 'idb';
import { $, noSerialize, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DBSchema, IDBPDatabase, IndexKey, IndexNames, StoreKey, StoreNames, StoreValue } from 'idb';
import type { Ingredient } from './ingredient';
import type { Recipe } from './recipe';
import type { NoSerialize} from '@builder.io/qwik';
import type { Menu } from './menu';
import type { Shop } from './shop';

interface DB extends DBSchema {
  ingredient: {
    key: string;
    value: Ingredient;
  };
  recipe:{
    key: string;
    value: Recipe;
  };
  menu:{
    key: string;
    value: Menu;
  }
  shop:{
    key: string;
    value: Shop;
  }
}

export async function getDB() {
  return openDB<DB>('cookbook', 1, {
    upgrade: (db) => {
      db.createObjectStore('ingredient', {
        keyPath: 'id',
      });
      db.createObjectStore("recipe", {
        keyPath: "id",
      });
      db.createObjectStore("menu", {
        keyPath: "id",
      });
      db.createObjectStore('shop', {
        keyPath: 'id',
      });
    }
  });
}
const changeEvent = (name: string) => `idb.${name}.change`;
interface StoreChange<Name extends StoreNames<DB>> {
  storeName: Name;
  action: 'add' | 'update' | 'delete';
  key: StoreKey<DB, Name>;
  value: DB[Name]["value"]; 
}

class IDBChangeEvent<Name extends StoreNames<DB>> extends CustomEvent<StoreChange<Name>> {
  constructor(
    action: 'add' | 'update' | 'delete',
    storeName: Name,
    value: StoreValue<DB, Name>,
    key: StoreKey<DB, Name>,
  ) {
    const detail = { storeName, action, value, key };
    super(changeEvent(storeName), { detail })
  }
}


interface StoreKeyParams<Name extends StoreNames<DB>> {
  query?: StoreKey<DB, Name> | IDBKeyRange | null | IndexKey<DB, Name, IndexNames<DB, Name>>;
  count?: number;
}
interface GetStoreKeyParams<Name extends StoreNames<DB>> extends StoreKeyParams<Name> {
  name: Name;
  indexName?: IndexNames<DB, Name>;
}
function getStoreKey<Name extends StoreNames<DB>>(params: GetStoreKeyParams<Name>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    search.set(key, JSON.stringify(value));
  }
  return search.toString();
}

const cache: Record<string, any> = {};
const listeners: Record<string, number> = {};
const container: { db?: NoSerialize<Promise<IDBPDatabase<DB>>> } = {};
const getIDB = $(() => {
  container.db ||= noSerialize(getDB());
  return container.db!;
});

const invalidate = $((changes: StoreChange<any>) => {
  for (const key in cache) {
    const search = new URLSearchParams(key);
    const name = JSON.parse(search.get('name')!);
    if (name !== changes.storeName) continue;
    const query = JSON.parse(search.get('query') ?? 'null');
    if (typeof query !== 'object' && changes.key !== query) continue;
    delete cache[key]; 
  }
});

export const store = <Name extends StoreNames<DB>>(name: Name) => {
    
  /** READ */
  const get = $(async (
    query: StoreKey<DB, Name>
  ): Promise<DB[Name]["value"] | undefined> => {
    const key = getStoreKey({ name, query });
    if (cache[key]) return cache[key];
    const db = await getIDB();
    const result = await db.get(name, query);
    cache[key] = result;
    return result;
  });

  const getAll = $(async (
    query?: StoreKey<DB, Name> | IDBKeyRange | null,
    count?: number
  ): Promise<DB[Name]["value"][]> => {
    const key = getStoreKey({ name, query, count });
    if (cache[key]) return cache[key];
    const db = await getIDB();
    const result = await db.getAll(name, query, count);
    cache[key] = result;
    return result;
  });

  const getFromIndex = $(async function<IndexName extends IndexNames<DB, Name>>(
    indexName: IndexName,
    query: IndexKey<DB, Name, IndexName> | IDBKeyRange,
  ): Promise<DB[Name]["value"] | undefined> {
    const key = getStoreKey({ name, query, indexName });
    if (cache[key]) return cache[key];
    const db = await getIDB();
    const result = await db.getFromIndex(name, indexName, query);
    cache[key] = result;
    return result;
  });

  
  const getAllFromIndex = $(async function<IndexName extends IndexNames<DB, Name>>(
    indexName: IndexName,
    query: IndexKey<DB, Name, IndexName> | IDBKeyRange,
    count?: number
  ): Promise<DB[Name]["value"][]> {
    const key = getStoreKey({ name, query, indexName, count });
    if (cache[key]) return cache[key];
    const db = await getIDB();
    const result = await db.getAllFromIndex(name, indexName, query, count);
    cache[key] = result;
    return result;
  });

  /** WRITE */
  const add = $(async (
    value: StoreValue<DB, Name>,
    key?: StoreKey<DB, Name> | IDBKeyRange
  ) => {
    const db = await getIDB();
    const id = await db.add(name, value as StoreValue<DB, Name>, key);
    const event = new IDBChangeEvent('add', name, value as StoreValue<DB, Name>, id);
    await invalidate(event.detail);
    db.dispatchEvent(event);
    return id;
  });

  const put = $(async (
    value: StoreValue<DB, Name>,
    key?: StoreKey<DB, Name> | IDBKeyRange
  ) => {
    const db = await getIDB();
    const id = await db.put(name, value as StoreValue<DB, Name>, key);
    const event = new IDBChangeEvent('add', name, value as StoreValue<DB, Name>, id);
    await invalidate(event.detail);
    db.dispatchEvent(event);
    return id;
  });

  // TODO: Use a transaction
  const update = $(async (
    key: StoreKey<DB, Name>,
    cb: (current?: StoreValue<DB, Name>) => StoreValue<DB, Name> | Promise<StoreValue<DB, Name>>
  ) => {
    const db = await getDB();
    const tx = db.transaction(name, 'readwrite');
    tx.store.get(key);
    const current = await get(key);
    const value = await cb(current);
    const id = current ? await put(value, key) : await add(value, key);
    return id;
  });

  /** LISTEN */
  const listen = $(async (
    params: StoreKeyParams<Name>,
    cb: (event: CustomEvent<StoreChange<Name>>) => void
  ) => {
    const key = getStoreKey({ name, ...params });
    listeners[key] ||= 0;
    listeners[key]++;
    const db = await getIDB();
    db.addEventListener(changeEvent(name), cb as (event: Event) => void);
    return async () => {
      listeners[key]--;
      db.removeEventListener(changeEvent(name), cb as (event: Event) => void);
    }
  });

  return { get, getAll, getFromIndex, getAllFromIndex, add, put, update, listen };
}

export const useGetStore = <Name extends StoreNames<DB>>(
  name: Name,
  query?: StoreKey<DB, Name> | null
) => {
  const init = cache[getStoreKey({ name, query })];
  const loading = useSignal(!init);
  const result = useSignal<StoreValue<DB, Name> | undefined>(init);
  const error = useSignal<string>();
  const update = $(async() => {
    try {
      if (!query) result.value = undefined;
      else result.value = await store(name).get(query);
    } catch (err) {
      error.value = err as string;
    } finally {
      loading.value = false;
    }
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    update();
    return store(name).listen({ query }, (event) => {
      if (event.detail.key === query) update();
    });
  });
  return { loading, result, error };
}

export const useGetAllStore = <Name extends StoreNames<DB>>(
  name: Name,
  query?: StoreKey<DB, Name> | IDBKeyRange,
  count?: number,
) => {
  const _query = typeof query === 'object' ? noSerialize(query) : query;
  const init = cache[getStoreKey({ name, query, count })];
  const loading = useSignal(!init);
  const list = useSignal<StoreValue<DB, Name>[]>(init ?? []);
  const error = useSignal<string>();
  const update = $(async () => {
    try {
      list.value = await store(name).getAll(_query, count);
    } catch (err) {
      error.value = err as string;
    } finally {
      loading.value = false;
    }
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    update();
    return store(name).listen({ query: _query, count }, (event) => {
      const { key } = event.detail;
      if (!_query) return update();
      if (typeof _query === 'object' && _query.includes(key)) return update();
    });
  });
  return { loading, list, error };
}

