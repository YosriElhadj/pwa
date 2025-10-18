'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useOnlineStatus } from './useOnlineStatus';
import * as idb from '@/lib/db';

export function useRecipes() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOnlineStatus();

  // Charger les recettes
  useEffect(() => {
    async function loadRecipes() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (isOnline) {
          // Essayer de récupérer depuis l'API
          const response = await fetch(`http://localhost:3001/api/recipes?userId=${session.user.id}`);
          const data = await response.json();
          
          // Sauvegarder dans IndexedDB
          const db = await idb.initDB();
          for (const recipe of data) {
            await db.put('recipes', { ...recipe, synced: true, userId: session.user.id });
          }
          
          setRecipes(data);
        } else {
          // Récupérer depuis IndexedDB
          const localRecipes = await idb.getRecipesByUser(session.user.id);
          setRecipes(localRecipes);
        }
      } catch (error) {
        console.error('Error loading recipes:', error);
        // Fallback vers IndexedDB
        const localRecipes = await idb.getRecipesByUser(session.user.id);
        setRecipes(localRecipes);
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [isOnline, session?.user?.id]);

  // Synchroniser quand on revient online
  useEffect(() => {
    async function syncData() {
      if (isOnline && session?.user?.id) {
        const queue = await idb.getSyncQueue();
        
        for (const item of queue) {
          try {
            if (item.action === 'create') {
              await fetch('http://localhost:3001/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
              });
            } else if (item.action === 'update') {
              await fetch(`http://localhost:3001/api/recipes/${item.recipeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data),
              });
            } else if (item.action === 'delete') {
              await fetch(`http://localhost:3001/api/recipes/${item.recipeId}`, {
                method: 'DELETE',
              });
            }
          } catch (error) {
            console.error('Sync error:', error);
          }
        }
        
        await idb.clearSyncQueue();
      }
    }

    syncData();
  }, [isOnline, session?.user?.id]);

  const addRecipe = async (recipe: any) => {
    if (!session?.user?.id) return;

    const newRecipe = { 
      ...recipe, 
      _id: Date.now().toString(), 
      userId: session.user.id,
      createdAt: new Date(),
      isFavorite: false 
    };
    
    if (isOnline) {
      try {
        const response = await fetch('http://localhost:3001/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecipe),
        });
        const savedRecipe = await response.json();
        setRecipes([...recipes, savedRecipe]);
      } catch (error) {
        await idb.addRecipe(newRecipe);
        setRecipes([...recipes, newRecipe]);
      }
    } else {
      await idb.addRecipe(newRecipe);
      setRecipes([...recipes, newRecipe]);
    }
  };

  const updateRecipe = async (id: string, updatedData: any) => {
    if (!session?.user?.id) return;

    if (isOnline) {
      try {
        await fetch(`http://localhost:3001/api/recipes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...updatedData, userId: session.user.id }),
        });
      } catch (error) {
        await idb.updateRecipe({ _id: id, ...updatedData, userId: session.user.id });
      }
    } else {
      await idb.updateRecipe({ _id: id, ...updatedData, userId: session.user.id });
    }
    
    setRecipes(recipes.map(r => r._id === id ? { ...r, ...updatedData } : r));
  };

  const deleteRecipe = async (id: string) => {
    if (isOnline) {
      try {
        await fetch(`http://localhost:3001/api/recipes/${id}`, { 
          method: 'DELETE' 
        });
      } catch (error) {
        await idb.deleteRecipe(id);
      }
    } else {
      await idb.deleteRecipe(id);
    }
    
    setRecipes(recipes.filter(r => r._id !== id));
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