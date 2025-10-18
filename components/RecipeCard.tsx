'use client';

import Image from 'next/image';
import Link from 'next/link';

interface RecipeCardProps {
  recipe: {
    _id: string;
    title: string;
    image?: string;
    prepTime: number;
    difficulty: string;
    category: string;
    isFavorite: boolean;
  };
  onToggleFavorite: (id: string) => void;
}

export default function RecipeCard({ recipe, onToggleFavorite }: RecipeCardProps) {
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

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100">
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
            <div className="image-overlay" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-2 block opacity-40">
                {categoryEmojis[recipe.category] || '🍳'}
              </span>
              <p className="text-gray-400 text-sm font-medium">Pas d'image</p>
            </div>
          </div>
        )}
        
        {/* Bouton Favori avec animation */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(recipe._id);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 z-10"
        >
          <svg
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-200 ${
              recipe.isFavorite ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-gray-400'
            }`}
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Badge catégorie */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 shadow-lg">
            <span>{categoryEmojis[recipe.category] || '🍳'}</span>
            <span>{recipe.category}</span>
          </span>
        </div>
      </div>

      {/* Contenu */}
      <Link href={`/recipes/${recipe._id}`}>
        <div className="p-4 sm:p-5">
          {/* Titre */}
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
            {recipe.title}
          </h3>

          {/* Infos avec icônes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Temps */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">{recipe.prepTime}min</span>
              </div>
              
              {/* Difficulté */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                difficultyColors[recipe.difficulty as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-700'
              }`}>
                {recipe.difficulty}
              </div>
            </div>

            {/* Flèche voir plus */}
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <svg 
                className="w-4 h-4 text-green-600 group-hover:text-white group-hover:translate-x-1 transition-all" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}