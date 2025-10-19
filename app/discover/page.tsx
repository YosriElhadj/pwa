'use client';

import { useState } from 'react';
import { usePublicRecipes } from '@/hooks/usePublicRecipes';
import PublicRecipeCard from '@/components/PublicRecipeCard';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DiscoverPage() {
  const { data: session } = useSession();
  const { recipes, loading, total, page, totalPages, fetchRecipes } = usePublicRecipes();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Toutes');
  const [sortBy, setSortBy] = useState('newest');

  const categories = ['Toutes', 'Entrée', 'Plat principal', 'Dessert', 'Boisson', 'Snack'];
  const difficulties = ['Toutes', 'Facile', 'Moyen', 'Difficile'];

  const handleSearch = () => {
    fetchRecipes({
      sortBy,
      category: selectedCategory !== 'Toutes' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'Toutes' ? selectedDifficulty : undefined,
      search: searchQuery || undefined,
      page: 1,
    });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchRecipes({
      sortBy: newSort,
      category: selectedCategory !== 'Toutes' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'Toutes' ? selectedDifficulty : undefined,
      search: searchQuery || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    fetchRecipes({
      sortBy,
      category: selectedCategory !== 'Toutes' ? selectedCategory : undefined,
      difficulty: selectedDifficulty !== 'Toutes' ? selectedDifficulty : undefined,
      search: searchQuery || undefined,
      page: newPage,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLikeUpdate = (recipeId: string, newLikes: number) => {
    // Optimistic UI update
    // Cette fonction pourrait être utilisée pour mettre à jour l'état local
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <span className="text-2xl sm:text-3xl">🍳</span>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Découvrir
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {total} recette{total !== 1 ? 's' : ''} publique{total !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                Mes Recettes
              </Link>
              {session?.user && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto text-center mb-8 animate-fadeIn">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Explorez des milliers de recettes 🌍
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Découvrez les créations culinaires de notre communauté
          </p>

          {/* Barre de recherche */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une recette, un ingrédient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-6 py-4 pl-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all shadow-lg text-base"
            />
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-6 py-2"
            >
              Rechercher
            </button>
          </div>
        </div>

        {/* Tri */}
        <div className="flex justify-center gap-2 mb-6 animate-fadeIn">
          <button
            onClick={() => handleSortChange('newest')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sortBy === 'newest'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'
            }`}
          >
            🆕 Nouveautés
          </button>
          <button
            onClick={() => handleSortChange('popular')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sortBy === 'popular'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'
            }`}
          >
            ⭐ Populaires
          </button>
          <button
            onClick={() => handleSortChange('trending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sortBy === 'trending'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300'
            }`}
          >
            🔥 Tendances
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 animate-fadeIn">
          <span className="text-sm font-medium text-gray-700 self-center">Catégorie:</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  fetchRecipes({
                    sortBy,
                    category: category !== 'Toutes' ? category : undefined,
                    difficulty: selectedDifficulty !== 'Toutes' ? selectedDifficulty : undefined,
                    search: searchQuery || undefined,
                    page: 1,
                  });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-green-300 shadow-md'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-12 animate-fadeIn">
          <span className="text-sm font-medium text-gray-700 self-center">Difficulté:</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {difficulties.map(difficulty => (
              <button
                key={difficulty}
                onClick={() => {
                  setSelectedDifficulty(difficulty);
                  fetchRecipes({
                    sortBy,
                    category: selectedCategory !== 'Toutes' ? selectedCategory : undefined,
                    difficulty: difficulty !== 'Toutes' ? difficulty : undefined,
                    search: searchQuery || undefined,
                    page: 1,
                  });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                  selectedDifficulty === difficulty
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 shadow-md'
                }`}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grille de recettes */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 spinner mb-4" />
            <p className="text-gray-500">Chargement des recettes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
              <span className="text-6xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Aucune recette trouvée
            </h3>
            <p className="text-gray-600 mb-6">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recipes.map((recipe, index) => (
                <div 
                  key={recipe._id} 
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <PublicRecipeCard
                    recipe={recipe}
                    onLikeUpdate={handleLikeUpdate}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  ← Précédent
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition ${
                          page === pageNum
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}