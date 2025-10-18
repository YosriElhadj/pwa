'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from '@/components/RecipeCard';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  const { recipes, loading, isOnline, updateRecipe } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Toutes');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleToggleFavorite = async (id: string) => {
    const recipe = recipes.find(r => r._id === id);
    if (recipe) {
      await updateRecipe(id, { ...recipe, isFavorite: !recipe.isFavorite });
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Filtrage des recettes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Toutes' || recipe.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'Toutes' || recipe.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['Toutes', 'Entrée', 'Plat principal', 'Dessert', 'Boisson', 'Snack'];
  const difficulties = ['Toutes', 'Facile', 'Moyen', 'Difficile'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header avec effet glassmorphism */}
      <header className="sticky top-0 z-50 glass shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
                <span className="text-2xl sm:text-3xl">🍳</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Mes Recettes
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {recipes.length} recette{recipes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Status indicator avec animation */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md ${
                isOnline 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                <div className={`w-2 h-2 rounded-full status-pulse ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
                <span className="hidden xs:inline text-xs font-medium">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              
              {/* Bouton Nouvelle Recette */}
              <Link
                href="/recipes/new"
                className="btn-primary flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nouvelle</span>
                <span className="sm:hidden">+</span>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/50 transition border border-gray-200 bg-white shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {session?.user?.name || 'Utilisateur'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                    </div>
                    
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section avec recherche */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto text-center mb-8 animate-fadeIn">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Bonjour {session?.user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Découvrez vos recettes préférées
          </p>

          {/* Barre de recherche moderne */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          </div>
        </div>

        {/* Filtres avec chips modernes */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 animate-fadeIn">
          <span className="text-sm font-medium text-gray-700 self-center">Catégorie:</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
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
                onClick={() => setSelectedDifficulty(difficulty)}
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

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-green-600">{recipes.length}</div>
            <div className="text-sm text-gray-600 mt-1">Recettes</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-blue-600">
              {recipes.filter(r => r.isFavorite).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Favoris</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-purple-600">
              {recipes.length > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.prepTime, 0) / recipes.length) : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Min moy.</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-all">
            <div className="text-3xl font-bold text-orange-600">
              {new Set(recipes.map(r => r.category)).size}
            </div>
            <div className="text-sm text-gray-600 mt-1">Catégories</div>
          </div>
        </div>
      </section>

      {/* Liste des recettes */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 spinner mb-4" />
            <p className="text-gray-500">Chargement des recettes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {recipes.length === 0 ? 'Aucune recette pour le moment' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {recipes.length === 0 
                ? 'Commencez votre aventure culinaire en créant votre première recette !' 
                : 'Essayez de modifier vos filtres de recherche'}
            </p>
            {recipes.length === 0 && (
              <Link href="/recipes/new" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer ma première recette
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe, index) => (
              <div 
                key={recipe._id} 
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RecipeCard
                  recipe={recipe}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-sm">
            Made with ❤️ for Modern Mobile Application
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Progressive Web App • Offline First • Mobile Ready
          </p>
        </div>
      </footer>
    </div>
  );
}