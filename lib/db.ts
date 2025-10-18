import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RecipeDB extends DBSchema {
  recipes: {
    key: string;
    value: {
      _id: string;
      userId: string;
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
    indexes: { 
      'by-category': string; 
      'by-favorite': number;
      'by-user': string;
    };
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
    db = await openDB<RecipeDB>('recipe-manager-db', 2, {
      upgrade(database, oldVersion, newVersion, transaction) {
        // Création du store recipes s'il n'existe pas
        if (!database.objectStoreNames.contains('recipes')) {
          const recipeStore = database.createObjectStore('recipes', {
            keyPath: '_id',
          });
          recipeStore.createIndex('by-category', 'category');
          recipeStore.createIndex('by-favorite', 'isFavorite');
          recipeStore.createIndex('by-user', 'userId');
        } else if (oldVersion < 2) {
          // Si le store existe mais qu'on upgrade vers la version 2
          // On récupère le store depuis la transaction d'upgrade
          const recipeStore = transaction.objectStore('recipes');
          
          // Ajouter l'index by-user s'il n'existe pas
          if (!recipeStore.indexNames.contains('by-user')) {
            recipeStore.createIndex('by-user', 'userId');
          }
        }

        // Création du store syncQueue s'il n'existe pas
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

// CRUD Operations
export async function getAllRecipes() {
  const database = await initDB();
  return database.getAll('recipes');
}

export async function getRecipeById(id: string) {
  const database = await initDB();
  return database.get('recipes', id);
}

export async function getRecipesByUser(userId: string) {
  const database = await initDB();
  try {
    return await database.getAllFromIndex('recipes', 'by-user', userId);
  } catch (error) {
    console.error('Error getting recipes by user:', error);
    // Fallback: filtrer manuellement si l'index n'existe pas encore
    const allRecipes = await database.getAll('recipes');
    return allRecipes.filter(recipe => recipe.userId === userId);
  }
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

export async function getFavoriteRecipes() {
  const database = await initDB();
  return database.getAllFromIndex('recipes', 'by-favorite', 1);
}

export async function getRecipesByCategory(category: string) {
  const database = await initDB();
  return database.getAllFromIndex('recipes', 'by-category', category);
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

// Fonction utilitaire pour nettoyer la base de données (développement)
export async function clearAllData() {
  const database = await initDB();
  const tx1 = database.transaction('recipes', 'readwrite');
  await tx1.objectStore('recipes').clear();
  
  const tx2 = database.transaction('syncQueue', 'readwrite');
  await tx2.objectStore('syncQueue').clear();
}