import { openDB } from 'idb';
import type { DBSchema } from 'idb';
import type { Ingredient } from './ingredient';
import type { Recipe } from './recipe';

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
