'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PublicRecipe {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  prepTime: number;
  ingredients: { 
    name: string; 
    quantity: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  }[];
  steps: string[];
  image?: string;
  likes: number;
  views: number;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  totalCalories?: number;  // ADD
  totalProtein?: number;   // ADD
  totalFat?: number;       // ADD
  totalCarbs?: number;     // ADD
}

export function usePublicRecipes() {
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecipes = async (params: {
    sortBy?: string;
    category?: string;
    difficulty?: string;
    search?: string;
    page?: number;
  } = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.category) queryParams.append('category', params.category);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.search) queryParams.append('search', params.search);
      queryParams.append('page', String(params.page || 1));
      queryParams.append('limit', '20');

      const response = await fetch(`${API_URL}/recipes/public/feed?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching public recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  return {
    recipes,
    loading,
    total,
    page,
    totalPages,
    fetchRecipes,
  };
}