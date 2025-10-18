import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RecipeDB extends DBSchema {
  recipes: {
    key: string;
    value: {
      _id: string;
      title: string;
      ingredients: { name: string; quantity: string }[];
      steps: string[];
      prepTime: number;
      difficulty: string;
      category: string;
      image?: string;
      isFavorite: boolean;
      createdAt: Date;
      synced: boolean;
    };
    indexes: { 'by-category': string; 'by-favorite': number };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      action: 'create' | 'update' | 'delete';
      recipeId: string;
      data: any;
      timestamp: Date;
    };
  };
}

let db: IDBPDatabase<RecipeDB> | null = null;

export async function initDB() {
  if (!db) {
    db = await openDB<RecipeDB>('recipe-manager-db', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('recipes')) {
          const recipeStore = database.createObjectStore('recipes', {
            keyPath: '_id',
          });
          recipeStore.createIndex('by-category', 'category');
          recipeStore.createIndex('by-favorite', 'isFavorite');
        }

        if (!database.objectStoreNames.contains('syncQueue')) {
          database.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }
  return db;
}

export async function getAllRecipes() {
  const database = await initDB();
  return database.getAll('recipes');
}

export async function getRecipeById(id: string) {
  const database = await initDB();
  return database.get('recipes', id);
}

export async function addRecipe(recipe: any) {
  const database = await initDB();
  await database.add('recipes', { ...recipe, synced: false });
  await database.add('syncQueue', {
    action: 'create',
    recipeId: recipe._id,
    data: recipe,
    timestamp: new Date(),
  });
}

export async function updateRecipe(recipe: any) {
  const database = await initDB();
  await database.put('recipes', { ...recipe, synced: false });
  await database.add('syncQueue', {
    action: 'update',
    recipeId: recipe._id,
    data: recipe,
    timestamp: new Date(),
  });
}

export async function deleteRecipe(id: string) {
  const database = await initDB();
  await database.delete('recipes', id);
  await database.add('syncQueue', {
    action: 'delete',
    recipeId: id,
    data: null,
    timestamp: new Date(),
  });
}

export async function getSyncQueue() {
  const database = await initDB();
  return database.getAll('syncQueue');
}

export async function clearSyncQueue() {
  const database = await initDB();
  const tx = database.transaction('syncQueue', 'readwrite');
  await tx.objectStore('syncQueue').clear();
}