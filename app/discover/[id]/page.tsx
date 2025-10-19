'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLike } from '@/hooks/useLike';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  prepTime: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  image?: string;
  likes: number;
  views: number;
  tags: string[];
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
}

export default function PublicRecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 spinner" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recette introuvable</h2>
          <Link href="/discover" className="text-green-600 hover:text-green-700 font-medium">
            Retour à la découverte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            <Link href="/discover" className="flex items-center gap-2 text-green-600 hover:text-green-700">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Retour</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Bouton Like */}
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 transition"
              >
                <svg
                  className={`w-5 h-5 ${likes > 0 ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
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
                <span className="font-medium text-sm">{likes}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image */}
          {recipe.image && (
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-200">
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Auteur */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {recipe.authorName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm text-gray-500">Recette de</p>
                <p className="font-semibold text-gray-800">{recipe.authorName || 'Anonyme'}</p>
              </div>
            </div>

            {/* Titre et Stats */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {recipe.title}
            </h1>

            {/* Stats sociales */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{likes} j'aime</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-medium">{recipe.views} vues</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {recipe.category}
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {recipe.difficulty}
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {recipe.prepTime} min
              </span>
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ingrédients */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Ingrédients
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <span className="text-green-600 mt-1">•</span>
                    <span>
                      <strong>{ingredient.name}</strong> - {ingredient.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Étapes */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Préparation
              </h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* CTA : Créer une recette */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 sm:p-8 border border-green-100 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
            Vous aussi, partagez vos recettes ! 👨‍🍳
          </h3>
          <p className="text-gray-600 mb-6">
            Rejoignez notre communauté de passionnés et inspirez des milliers de personnes
          </p>
          <Link
            href="/recipes/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer ma recette
          </Link>
        </div>
      </main>
    </div>
  );
}