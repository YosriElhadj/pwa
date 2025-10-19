'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOnlineStatus } from './useOnlineStatus';
import * as idb from '@/lib/db';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useRecipes() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  // Récupérer le token depuis la session
  const token = (session as any)?.accessToken;

  // Charger les recettes
  useEffect(() => {
    async function loadRecipes() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (isOnline && token) {
          console.log('🟢 Fetching recipes from backend...');
          
          const response = await fetch(`${API_URL}/recipes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          console.log('🟢 Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🟢 Recipes loaded:', data.length);
            
            // Sauvegarder dans IndexedDB
            const db = await idb.initDB();
            for (const recipe of data) {
              await db.put('recipes', { 
                ...recipe, 
                _id: recipe._id || recipe.id,
                synced: true, 
                userId: session.user.id,
              });
            }
            
            setRecipes(data);
          } else {
            console.error('❌ Failed to fetch recipes:', response.status);
            const localRecipes = await idb.getRecipesByUser(session.user.id);
            setRecipes(localRecipes);
          }
        } else {
          console.log('🔴 Offline mode - loading from IndexedDB');
          const localRecipes = await idb.getRecipesByUser(session.user.id);
          setRecipes(localRecipes);
        }
      } catch (error) {
        console.error('❌ Error loading recipes:', error);
        try {
          const localRecipes = await idb.getRecipesByUser(session.user.id);
          setRecipes(localRecipes);
        } catch (idbError) {
          console.error('❌ IndexedDB error:', idbError);
          setRecipes([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [isOnline, session?.user?.id, token]);

  // Synchroniser quand on revient online
  useEffect(() => {
    async function syncData() {
      if (isOnline && session?.user?.id && token) {
        try {
          const queue = await idb.getSyncQueue();
          console.log('🔄 Syncing queue:', queue.length, 'items');
          
          for (const item of queue) {
            try {
              if (item.action === 'create') {
                console.log('🔄 Syncing create:', item.data.title);
                const response = await fetch(`${API_URL}/recipes`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify(item.data),
                });
                
                if (response.ok) {
                  const savedRecipe = await response.json();
                  console.log('✅ Synced create:', savedRecipe._id);
                  
                  // Mettre à jour IndexedDB avec le vrai ID
                  const db = await idb.initDB();
                  await db.delete('recipes', item.recipeId);
                  await db.put('recipes', { 
                    ...savedRecipe, 
                    _id: savedRecipe._id,
                    synced: true,
                    userId: session.user.id 
                  });
                }
              } else if (item.action === 'update') {
                await fetch(`${API_URL}/recipes/${item.recipeId}`, {
                  method: 'PATCH',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify(item.data),
                });
              } else if (item.action === 'delete') {
                await fetch(`${API_URL}/recipes/${item.recipeId}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
              }
            } catch (error) {
              console.error('❌ Sync item error:', error);
            }
          }
          
          await idb.clearSyncQueue();
          console.log('✅ Sync completed');
        } catch (error) {
          console.error('❌ Sync error:', error);
        }
      }
    }

    syncData();
  }, [isOnline, session?.user?.id, token]);

  const addRecipe = async (recipe: any) => {
  if (!session?.user?.id) {
    console.error('❌ No user session');
    return;
  }

  console.log('🟡 Adding recipe:', recipe.title);
  console.log('🔍 isPublic value:', recipe.isPublic); // DEBUG
  console.log('🔍 tags value:', recipe.tags); // DEBUG

  // ENVOYEZ TOUS LES CHAMPS, Y COMPRIS isPublic et tags
  const recipeData = {
    title: recipe.title,
    category: recipe.category,
    difficulty: recipe.difficulty,
    prepTime: recipe.prepTime,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    image: recipe.image || '',
    isFavorite: false,
    isPublic: recipe.isPublic || false,  // ⬅️ AJOUTEZ CETTE LIGNE
    tags: recipe.tags || [],              // ⬅️ AJOUTEZ CETTE LIGNE
  };
  
  console.log('📤 Data being sent:', recipeData); // DEBUG
  
  if (isOnline && token) {
    try {
      console.log('🟢 Posting to backend...');
      console.log('🟢 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(recipeData),
      });
      
      console.log('🟢 Response status:', response.status);
      
      if (response.ok) {
        const savedRecipe = await response.json();
        console.log('✅ Recipe saved to backend:', savedRecipe._id);
        console.log('✅ isPublic in response:', savedRecipe.isPublic); // DEBUG
        
        setRecipes([...recipes, savedRecipe]);
        
        // Sauvegarder dans IndexedDB avec le vrai ID
        const db = await idb.initDB();
        await db.put('recipes', { 
          ...savedRecipe, 
          _id: savedRecipe._id,
          synced: true, 
          userId: session.user.id 
        });
        return;
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error adding recipe online:', error);
    }
  }
  
  // Fallback offline - générer un ID temporaire
  console.log('🔴 Saving offline with temp ID');
  const tempId = `temp_${Date.now()}`;
  const offlineRecipe = { 
    ...recipeData,
    _id: tempId,
    userId: session.user.id,
    createdAt: new Date(),
    synced: false,
  };
  
  await idb.addRecipe(offlineRecipe);
  setRecipes([...recipes, offlineRecipe]);
};

  const updateRecipe = async (id: string, updatedData: any) => {
    if (!session?.user?.id) return;

    console.log('🟡 Updating recipe:', id);

    if (isOnline && token) {
      try {
        const response = await fetch(`${API_URL}/recipes/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });
        
        if (response.ok) {
          const updated = await response.json();
          console.log('✅ Recipe updated');
          
          setRecipes(recipes.map(r => {
            const recipeId = r._id || r.id;
            return recipeId === id ? updated : r;
          }));
          
          // Mettre à jour IndexedDB
          const db = await idb.initDB();
          await db.put('recipes', { 
            ...updated, 
            _id: id,
            synced: true, 
            userId: session.user.id 
          });
          return;
        } else {
          console.error('❌ Update failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Error updating recipe:', error);
      }
    }
    
    // Fallback offline
    await idb.updateRecipe({ _id: id, ...updatedData, userId: session.user.id });
    setRecipes(recipes.map(r => {
      const recipeId = r._id || r.id;
      return recipeId === id ? { ...r, ...updatedData } : r;
    }));
  };

  const deleteRecipe = async (id: string) => {
    console.log('🟡 Deleting recipe:', id);
    
    if (isOnline && token) {
      try {
        await fetch(`${API_URL}/recipes/${id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        console.log('✅ Recipe deleted from backend');
        await idb.deleteRecipe(id);
      } catch (error) {
        console.error('❌ Error deleting recipe:', error);
        await idb.deleteRecipe(id);
      }
    } else {
      await idb.deleteRecipe(id);
    }
    
    setRecipes(recipes.filter(r => {
      const recipeId = r._id || r.id;
      return recipeId !== id;
    }));
  };

  return { 
    recipes, 
    loading, 
    isOnline, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe 
  };
}