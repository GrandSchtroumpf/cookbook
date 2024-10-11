import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase, StoreKey, StoreNames, StoreValue } from 'idb';
import type { Ingredient } from './ingredient';
import type { Recipe } from './recipe';
import type { NoSerialize} from '@builder.io/qwik';
import { $, createContextId, noSerialize, useContext, useContextProvider, useSignal, useVisibleTask$ } from '@builder.io/qwik';

interface DB extends DBSchema {
  ingredients: {
    key: number;
    value: Ingredient;
  };
  recipe:{
    key: number;
    value: Recipe;
  }
}

export async function getDB() {
  return openDB<DB>('cookbook', 2, {
    upgrade: (db, oldVersion) => {
      if (oldVersion < 1) {
        db.createObjectStore('ingredients', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (oldVersion < 2) {
        db.createObjectStore("recipe", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
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


const IDBContext = createContextId<ReturnType<typeof useIDBProvider>>('IDBContext');

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

export function useIDBProvider() {
  const store: Record<string, any> = {};
  const listeners: Record<string, number> = {};
  const container: { db?: NoSerialize<Promise<IDBPDatabase<DB>>> } = {};
  const getIDB = $(() => {
    container.db ||= noSerialize(getDB());
    return container.db!;
  });

  const invalidate = $((changes: StoreChange<any>) => {
    for (const [key, value] of Object.entries(listeners)) {
      if (value !== 0) continue;
      const search = new URLSearchParams(key);
      const name = JSON.parse(search.get('name')!);
      if (name !== changes.storeName) continue;
      const query = JSON.parse(search.get('query') ?? 'null');
      if (typeof query !== 'object' && changes.key !== query) continue;
      delete store[key]; 
    }
  })

  /** READ */
  const get = $(async <Name extends StoreNames<DB>>(
    name: Name,
    query: StoreKey<DB, Name>
  ) => {
    const key = getStoreKey({ name, query });
    if (store[key]) return store[key];
    const db = await getIDB();
    const result = await db.get(name, query);
    store[key] = result;
    return result;
  });

  const getAll = $(async <Name extends StoreNames<DB>>(
    name: Name,
    query?: StoreKey<DB, Name> | IDBKeyRange | null,
    count?: number
  ) => {
    const key = getStoreKey({ name, query, count });
    if (store[key]) return store[key];
    const db = await getIDB();
    const result = await db.getAll(name, query, count);
    store[key] = result;
    return result;
  });

  /** WRITE */
  const add = $(async <Name extends StoreNames<DB>>(
    name: Name,
    value: StoreValue<DB, Name>,
    key?: StoreKey<DB, Name> | IDBKeyRange
  ) => {
    const db = await getIDB();
    const id = await db.add(name, value, key);
    const event = new IDBChangeEvent('add', name, value, id);
    db.dispatchEvent(event);
    invalidate(event.detail);
    return id;
  });

  /** LISTEN */
  const listen = $(async <Name extends StoreNames<DB>>(
    params: StoreKeyParams<Name>,
    cb: (event: CustomEvent<StoreChange<Name>>) => void
  ) => {
    const key = getStoreKey(params);
    listeners[key] ||= 0;
    listeners[key]++;
    if (listeners[key] === 1) {
      const db = await getIDB();
      db.addEventListener(changeEvent(params.name), cb as (event: Event) => void);
    }
    return async () => {
      listeners[key]--;
      if (listeners[key] === 0) {
        const db = await getIDB();
        db.removeEventListener(changeEvent(params.name), cb as (event: Event) => void);
      }
    }
  });
  const ctx = { getIDB, get, getAll, add, listen };
  useContextProvider(IDBContext, ctx);
  return ctx;
}

const useIDB = () => useContext(IDBContext);


export const useGetStore = <Name extends StoreNames<DB>>(
  name: Name,
  query: StoreKey<DB, Name>
) => {
  const { get, listen } = useIDB();
  const loading = useSignal(true);
  const result = useSignal<StoreValue<DB, Name>>();
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
  const { getAll, listen } = useIDB();
  const _query = typeof query === 'object' ? noSerialize(query) : query;
  const loading = useSignal(true);
  const result = useSignal<StoreValue<DB, Name>[]>();
  const error = useSignal<string>();
  const update = $(async () => {
    try {
      result.value = await getAll(name, _query, count);
    } catch (err) {
      error.value = err as string;
    } finally {
      loading.value = false;
    }
  });
  useVisibleTask$(async () => {
    update();
    return listen({ name, query: _query, count }, (event) => {
      const { key } = event.detail;
      if (typeof _query === 'object' && !_query.includes(key)) return;
      update();
    });
  });
  return { loading, result, error };
}

