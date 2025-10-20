'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLike } from '@/hooks/useLike';
import CommentsSection from '@/components/CommentsSection';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Recipe {
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
  totalCalories?: number;
  totalProtein?: number;
  totalFat?: number;
  totalCarbs?: number;
}

export default function PublicRecipeDetailPage() {
  const params = useParams();
  const { toggleLike } = useLike();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const response = await fetch(`${API_URL}/recipes/public/${params.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);
          setLikes(data.likes);
        } else {
          console.error('Recipe not found');
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params.id]);

  const handleLike = async () => {
    const updatedRecipe = await toggleLike(params.id as string);
    if (updatedRecipe) {
      setLikes(updatedRecipe.likes);
    }
  };

  // Calculate totals if not provided by backend
  const calculateTotals = () => {
    if (!recipe) return { calories: 0, protein: 0, fat: 0, carbs: 0 };

    if (recipe.totalCalories !== undefined) {
      return {
        calories: recipe.totalCalories,
        protein: recipe.totalProtein || 0,
        fat: recipe.totalFat || 0,
        carbs: recipe.totalCarbs || 0,
      };
    }

    // Calculate from ingredients
    return recipe.ingredients.reduce((acc, ing) => {
      const quantity = parseFloat(ing.quantity.match(/(\d+\.?\d*)/)?.[1] || '100');
      const multiplier = quantity / 100;

      return {
        calories: acc.calories + (ing.calories || 0) * multiplier,
        protein: acc.protein + (ing.protein || 0) * multiplier,
        fat: acc.fat + (ing.fat || 0) * multiplier,
        carbs: acc.carbs + (ing.carbs || 0) * multiplier,
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const nutritionTotals = calculateTotals();
  const hasNutrition = nutritionTotals.calories > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement de la recette...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">😔</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Recette introuvable</h2>
          <p className="text-gray-600 mb-6">Cette recette n&apos;existe pas ou n&apos;est plus disponible.</p>
          <Link 
            href="/discover" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la découverte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            <Link href="/discover" className="group flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-all">
              <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-semibold text-sm sm:text-base">Retour</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm hover:shadow-md"
              >
                <svg
                  className={`w-5 h-5 transition-all ${likes > 0 ? 'fill-red-500 text-red-500 scale-110' : 'fill-none text-gray-600'}`}
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
                <span className="font-bold text-sm">{likes}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {recipe.image && (
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200">
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                className="object-cover"
              />
              {/* Calories Badge on Image */}
              {hasNutrition && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-2xl backdrop-blur-sm bg-opacity-90 flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  {Math.round(nutritionTotals.calories)} kcal
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b-2 border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {recipe.authorName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Recette de</p>
                <p className="text-lg font-bold text-gray-800">{recipe.authorName || 'Anonyme'}</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
              {recipe.title}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="font-bold">{likes}</span>
                <span className="text-sm">j&apos;aime</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-bold">{recipe.views}</span>
                <span className="text-sm">vues</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-emerald-200">
                {recipe.category}
              </span>
              <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-blue-200">
                {recipe.difficulty}
              </span>
              <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-purple-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {recipe.prepTime} min
              </span>
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {recipe.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* NUTRITION SECTION */}
            {hasNutrition && (
              <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">Informations nutritionnelles</h3>
                    <p className="text-xs text-emerald-700 font-bold">✅ Calculées automatiquement (USDA)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-orange-100 hover:border-orange-300 transition-all group">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                      {Math.round(nutritionTotals.calories)}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Calories</div>
                    <div className="text-xs text-gray-500 font-medium">kcal totales</div>
                    <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🔥</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-red-100 hover:border-red-300 transition-all group">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">
                      {nutritionTotals.protein.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Protéines</div>
                    <div className="text-xs text-gray-500 font-medium">grammes</div>
                    <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🥩</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-yellow-100 hover:border-yellow-300 transition-all group">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-1">
                      {nutritionTotals.fat.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Lipides</div>
                    <div className="text-xs text-gray-500 font-medium">grammes</div>
                    <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🧈</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-blue-100 hover:border-blue-300 transition-all group">
                    <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                      {nutritionTotals.carbs.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Glucides</div>
                    <div className="text-xs text-gray-500 font-medium">grammes</div>
                    <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🍞</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white/60 rounded-xl border border-emerald-200">
                  <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valeurs nutritionnelles basées sur les quantités indiquées
                  </p>
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                Ingrédients
              </h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-xl shadow-sm">
                    <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-gray-800">
                        <strong className="font-bold">{ingredient.name}</strong>
                        <span className="text-gray-600"> — {ingredient.quantity}</span>
                      </span>
                      {ingredient.calories && ingredient.calories > 0 && (
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            🔥 {Math.round((ingredient.calories || 0) * (parseFloat(ingredient.quantity.match(/(\d+\.?\d*)/)?.[1] || '100') / 100))} kcal
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                Préparation
              </h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-4 bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-2 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* COMMENTS SECTION */}
            <CommentsSection recipeId={params.id as string} isPublic={true} />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 border-2 border-emerald-200 text-center shadow-lg">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-4xl">👨‍🍳</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Vous aussi, partagez vos recettes !
          </h3>
          <p className="text-gray-700 mb-6 text-lg max-w-2xl mx-auto">
            Rejoignez notre communauté de passionnés et inspirez des milliers de personnes avec vos créations culinaires
          </p>
          <Link
            href="/recipes/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer ma recette
          </Link>
        </div>
      </main>
    </div>
  );
}