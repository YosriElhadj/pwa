'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useLike } from '@/hooks/useLike';
import { PublicRecipe } from '@/hooks/usePublicRecipes';

interface PublicRecipeCardProps {
  recipe: PublicRecipe;
  onLikeUpdate?: (recipeId: string, newLikes: number) => void;
}

export default function PublicRecipeCard({ recipe, onLikeUpdate }: PublicRecipeCardProps) {
  const { toggleLike } = useLike();
  const [likes, setLikes] = useState(recipe.likes);
  const [isLiking, setIsLiking] = useState(false);

  const difficultyColors = {
    'Facile': 'bg-green-100 text-green-700 border-green-200',
    'Moyen': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Difficile': 'bg-red-100 text-red-700 border-red-200',
  };

  const categoryEmojis: { [key: string]: string } = {
    'Entrée': '🥗',
    'Plat principal': '🍽️',
    'Dessert': '🍰',
    'Boisson': '🥤',
    'Snack': '🍿',
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking) return;

    setIsLiking(true);
    const updatedRecipe = await toggleLike(recipe._id);
    
    if (updatedRecipe) {
      setLikes(updatedRecipe.likes);
      onLikeUpdate?.(recipe._id, updatedRecipe.likes);
    }
    
    setIsLiking(false);
  };

  // Calculate calories if not provided
  const totalCalories = recipe.totalCalories || 
    (recipe.ingredients?.reduce((acc: number, ing: any) => {
      const quantity = parseFloat(ing.quantity?.match(/(\d+\.?\d*)/)?.[1] || '100');
      return acc + ((ing.calories || 0) * (quantity / 100));
    }, 0) || 0);

  const hasNutrition = totalCalories > 0;

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
      {/* Image avec overlay */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden">
        {recipe.image ? (
          <>
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-2 block opacity-40">
                {categoryEmojis[recipe.category] || '🍳'}
              </span>
              <p className="text-gray-400 text-sm font-medium">Pas d&#39;image</p>
            </div>
          </div>
        )}

        {/* Calories Badge - TOP RIGHT */}
        {hasNutrition && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5">
              <span className="text-sm">🔥</span>
              <span>{Math.round(totalCalories)} kcal</span>
            </div>
          </div>
        )}

        {/* Badge catégorie - TOP LEFT */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-700 shadow-lg border border-white/50">
            <span className="text-base">{categoryEmojis[recipe.category] || '🍳'}</span>
            <span>{recipe.category}</span>
          </span>
        </div>

        {/* Auteur - BOTTOM LEFT */}
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-white/50">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
              {recipe.authorName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="text-xs font-bold text-gray-700">
              {recipe.authorName || 'Anonyme'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <Link href={`/discover/${recipe._id}`}>
        <div className="p-4 sm:p-5">
          {/* Titre */}
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-tight">
            {recipe.title}
          </h3>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Infos avec icônes */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Temps */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-bold">{recipe.prepTime}min</span>
              </div>
              
              {/* Difficulté */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${
                difficultyColors[recipe.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {recipe.difficulty}
              </div>
            </div>
          </div>

          {/* Nutrition Summary - NEW */}
          {hasNutrition && recipe.totalProtein !== undefined && (
            <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-orange-600">🔥 {Math.round(totalCalories)}</span>
                  <span className="text-gray-600">kcal</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">
                    <span className="font-bold text-red-600">{recipe.totalProtein?.toFixed(0) || 0}g</span> 🥩
                  </span>
                  <span className="text-gray-600">
                    <span className="font-bold text-blue-600">{recipe.totalCarbs?.toFixed(0) || 0}g</span> 🍞
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats sociales */}
          <div className="flex items-center gap-4 pt-4 border-t-2 border-gray-100">
            {/* Likes */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/like"
            >
              <svg 
                className={`w-5 h-5 transition-all ${likes > 0 ? 'fill-red-500 text-red-500 scale-110' : 'fill-none group-hover/like:scale-110'}`}
                stroke="currentColor" 
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-sm font-bold">{likes}</span>
            </button>

            {/* Vues */}
            <div className="flex items-center gap-1.5 text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-bold">{recipe.views}</span>
            </div>

            {/* Flèche voir plus */}
            <div className="ml-auto">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-center group-hover:from-emerald-500 group-hover:to-teal-600 transition-all shadow-sm group-hover:shadow-md">
                <svg 
                  className="w-5 h-5 text-emerald-600 group-hover:text-white group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}