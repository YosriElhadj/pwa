'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useLike() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const token = (session as any)?.accessToken;

  const toggleLike = async (recipeId: string) => {
    if (!token) {
      console.error('No token available');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/recipes/${recipeId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedRecipe = await response.json();
        return updatedRecipe;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
    return null;
  };

  return { toggleLike, loading };
}