import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase, StoreKey, StoreNames, StoreValue } from 'idb';
import type { Ingredient } from './ingredient';
import type { Recipe } from './recipe';
import type { NoSerialize} from '@builder.io/qwik';
import { $, noSerialize, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { Menu } from './menu';

interface DB extends DBSchema {
  ingredients: {
    key: number;
    value: Ingredient;
  };
  recipe:{
    key: number;
    value: Recipe;
  };
  menu:{
    key: number;
    value: Menu;
  }
}

export async function getDB() {
  return openDB<DB>('cookbook', 4, {
    upgrade: (db) => {
      db.createObjectStore('ingredients', {
        keyPath: 'id',
        autoIncrement: true,
      });
    
      db.createObjectStore("recipe", {
        keyPath: "id",
        autoIncrement: true,
      });
    
      db.createObjectStore("menu", {
        keyPath: "id",
        autoIncrement: true,
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
  name: Name;
  query?: StoreKey<DB, Name> | IDBKeyRange | null;
  count?: number;
}
function getStoreKey<Name extends StoreNames<DB>>(params: StoreKeyParams<Name>) {
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
})

/** READ */
export const get = $(async <Name extends StoreNames<DB>>(
  name: Name,
  query: StoreKey<DB, Name>
) => {
  const key = getStoreKey({ name, query });
  if (cache[key]) return cache[key];
  const db = await getIDB();
  const result = await db.get(name, query);
  cache[key] = result;
  return result;
});

export const getAll = $(async <Name extends StoreNames<DB>>(
  name: Name,
  query?: StoreKey<DB, Name> | IDBKeyRange | null,
  count?: number
) => {
  const key = getStoreKey({ name, query, count });
  if (cache[key]) return cache[key];
  const db = await getIDB();
  const result = await db.getAll(name, query, count);
  cache[key] = result;
  return result;
});

/** WRITE */
export const add = $(async <Name extends StoreNames<DB>>(
  name: Name,
  value: Omit<StoreValue<DB, Name>, 'id'>,
  key?: StoreKey<DB, Name> | IDBKeyRange
) => {
  const db = await getIDB();
  const id = await db.add(name, value as StoreValue<DB, Name>, key);
  const event = new IDBChangeEvent('add', name, value as StoreValue<DB, Name>, id);
  await invalidate(event.detail);
  db.dispatchEvent(event);
  return id;
});

/** LISTEN */
export const listen = $(async <Name extends StoreNames<DB>>(
  params: StoreKeyParams<Name>,
  cb: (event: CustomEvent<StoreChange<Name>>) => void
) => {
  const key = getStoreKey(params);
  listeners[key] ||= 0;
  listeners[key]++;
  const db = await getIDB();
  db.addEventListener(changeEvent(params.name), cb as (event: Event) => void);
  return async () => {
    listeners[key]--;
    db.removeEventListener(changeEvent(params.name), cb as (event: Event) => void);
  }
});


export const useGetStore = <Name extends StoreNames<DB>>(
  name: Name,
  query: StoreKey<DB, Name>
) => {
  const init = cache[getStoreKey({ name, query })];
  const loading = useSignal(!init);
  const result = useSignal<StoreValue<DB, Name>>(init);
  const error = useSignal<string>();
  const update = $(async() => {
    try {
      result.value = await get(name, query);
    } catch (err) {
      error.value = err as string;
    } finally {
      loading.value = false;
    }
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    update();
    return listen({ name, query }, (event) => {
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
      list.value = await getAll(name, _query, count);
    } catch (err) {
      error.value = err as string;
    } finally {
      loading.value = false;
    }
  });
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    update();
    return listen({ name, query: _query, count }, (event) => {
      const { key } = event.detail;
      if (!_query) return update();
      if (typeof _query === 'object' && _query.includes(key)) return update();
    });
  });
  return { loading, list, error };
}

