'use client';

import { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import RecipeCard from '@/components/RecipeCard';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import InstallButton from '@/components/InstallButton';

export default function Home() {
  const { data: session } = useSession();
  const { recipes, loading, isOnline, updateRecipe } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Toutes');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

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

  const categoryIcons: Record<string, string> = {
    'Toutes': '🍽️',
    'Entrée': '🥗',
    'Plat principal': '🍝',
    'Dessert': '🍰',
    'Boisson': '🥤',
    'Snack': '🍿'
  };

  const difficultyColors: Record<string, string> = {
    'Toutes': 'from-gray-500 to-gray-600',
    'Facile': 'from-green-500 to-emerald-600',
    'Moyen': 'from-yellow-500 to-orange-600',
    'Difficile': 'from-red-500 to-rose-600'
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Toutes');
    setSelectedDifficulty('Toutes');
  };

  const activeFiltersCount = (selectedCategory !== 'Toutes' ? 1 : 0) + (selectedDifficulty !== 'Toutes' ? 1 : 0);

  // Calculate total calories across all recipes
  const totalCalories = recipes.reduce((acc, recipe) => {
    if (recipe.totalCalories) return acc + recipe.totalCalories;
    
    // Calculate from ingredients if totalCalories not available
    const recipeCalories = recipe.ingredients?.reduce((sum: number, ing: any) => {
      const quantity = parseFloat(ing.quantity?.match(/(\d+\.?\d*)/)?.[1] || '100');
      return sum + ((ing.calories || 0) * (quantity / 100));
    }, 0) || 0;
    
    return acc + recipeCalories;
  }, 0);

  // Average calories per recipe
  const avgCalories = recipes.length > 0 ? Math.round(totalCalories / recipes.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Bouton d'installation PWA */}
      <InstallButton />
      
      {/* Header avec effet glassmorphism amélioré */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo et titre avec animation */}
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                <span className="text-2xl sm:text-3xl">🍳</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Mes Recettes
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">
                  {recipes.length} recette{recipes.length !== 1 ? 's' : ''} • {filteredRecipes.length} affichée{filteredRecipes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Actions Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Status indicator amélioré */}
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full shadow-md transition-all ${
                isOnline 
                  ? 'bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-gradient-to-r from-orange-50 to-amber-100 text-orange-700 border border-orange-200'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-sm ${isOnline ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                <span className="text-xs font-semibold">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* AI Chef */}
              <Link
                href="/ai-chef"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r from-purple-50 to-pink-50 transition-all border border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-purple-200"
              >
                <span className="text-xl group-hover:scale-125 transition-transform">🤖</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">Chef IA</span>
              </Link>

              {/* 🧊 Fridge Scanner - NEW */}
              <Link
                href="/fridge-scanner"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r from-blue-50 to-cyan-50 transition-all border border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-blue-200"
              >
                <span className="text-xl group-hover:scale-125 transition-transform">🧊</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Scanner Frigo</span>
              </Link>

              {/* Découvrir */}
              <Link
                href="/discover"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r from-emerald-50 to-teal-50 transition-all border border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-emerald-200"
              >
                <svg className="w-5 h-5 text-gray-700 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors">Découvrir</span>
              </Link>
              
              {/* Bouton Nouvelle Recette amélioré */}
              <Link
                href="/recipes/new"
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nouvelle</span>
              </Link>

              {/* User Menu amélioré */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gradient-to-r from-gray-50 to-gray-100 transition-all border border-gray-200 bg-white shadow-md hover:shadow-lg group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {session?.user?.name || 'Utilisateur'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu amélioré */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-fadeIn overflow-hidden">
                      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800">{session?.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3 group">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium">Mon Profil</span>
                        </button>
                        
                        <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-3 group">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="font-medium">Paramètres</span>
                        </button>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span className="font-semibold">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/ai-chef"
                className="p-2.5 rounded-xl hover:bg-purple-100 transition border border-gray-200 bg-white shadow-md"
              >
                <span className="text-xl">🤖</span>
              </Link>

              {/* 🧊 Fridge Scanner Mobile - NEW */}
              <Link
                href="/fridge-scanner"
                className="p-2.5 rounded-xl hover:bg-blue-100 transition border border-gray-200 bg-white shadow-md"
              >
                <span className="text-xl">🧊</span>
              </Link>
              
              <Link
                href="/discover"
                className="p-2.5 rounded-xl hover:bg-gray-100 transition border border-gray-200 bg-white shadow-md"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
              
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              >
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section amélioré */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto text-center mb-8 animate-fadeIn">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
            Bonjour <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mb-8 font-medium">
            Explorez et savourez vos créations culinaires
          </p>

          {/* Barre de recherche ultra-moderne */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une recette magique... ✨"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-5 pl-14 pr-24 rounded-2xl border-2 border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all shadow-xl text-base bg-white"
              />
              <svg 
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bouton de filtres mobile avec badge */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-400 transition-all shadow-md relative"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="font-semibold text-gray-700">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtres avec design amélioré */}
        <div className={`space-y-6 mb-8 ${showFilters || typeof window !== 'undefined' && window.innerWidth >= 768 ? 'block' : 'hidden'} md:block`}>
          {/* Catégories avec icônes */}
          <div className="animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">📂 Catégorie</span>
                {selectedCategory !== 'Toutes' && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                    {selectedCategory}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`group px-5 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="text-xl group-hover:scale-125 transition-transform">{categoryIcons[category]}</span>
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficultés avec couleurs */}
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold text-gray-800">⚡ Difficulté</span>
              {selectedDifficulty !== 'Toutes' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {selectedDifficulty}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {difficulties.map(difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-md hover:shadow-lg ${
                    selectedDifficulty === difficulty
                      ? `bg-gradient-to-r ${difficultyColors[difficulty]} text-white shadow-lg scale-105`
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiques rapides améliorées AVEC CALORIES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12 max-w-5xl mx-auto">
          <div className="group bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 text-center transform hover:scale-105 transition-all hover:shadow-xl hover:border-emerald-200 cursor-pointer">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
              {recipes.length}
            </div>
            <div className="text-sm text-gray-600 font-semibold">Recettes</div>
            <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">📚</div>
          </div>
          <div className="group bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 text-center transform hover:scale-105 transition-all hover:shadow-xl hover:border-pink-200 cursor-pointer">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-1">
              {recipes.filter(r => r.isFavorite).length}
            </div>
            <div className="text-sm text-gray-600 font-semibold">Favoris</div>
            <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">❤️</div>
          </div>
          
          {/* Average Calories Card */}
          <div className="group bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 text-center transform hover:scale-105 transition-all hover:shadow-xl hover:border-orange-200 cursor-pointer">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
              {avgCalories}
            </div>
            <div className="text-sm text-gray-600 font-semibold">kcal moy.</div>
            <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🔥</div>
          </div>
          
          <div className="group bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 text-center transform hover:scale-105 transition-all hover:shadow-xl hover:border-purple-200 cursor-pointer">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              {recipes.length > 0 ? Math.round(recipes.reduce((acc, r) => acc + r.prepTime, 0) / recipes.length) : 0}
            </div>
            <div className="text-sm text-gray-600 font-semibold">Min moy.</div>
            <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">⏱️</div>
          </div>
        </div>
      </section>

      {/* Liste des recettes avec skeleton loading */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-emerald-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🍳</span>
                </div>
              </div>
              <p className="text-gray-600 font-semibold text-lg mb-2">Chargement des recettes...</p>
              <p className="text-gray-400 text-sm">Préparation de vos délices culinaires</p>
            </div>
            
            {/* Skeleton cards */}
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded-lg mb-2 w-1/2"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <span className="text-8xl">🍽️</span>
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 mb-3">
              {recipes.length === 0 ? '✨ Commencez votre aventure' : '🔍 Aucun résultat'}
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {recipes.length === 0 
                ? 'Créez votre première recette et partagez vos talents culinaires avec le monde !' 
                : 'Ajustez vos filtres ou essayez une autre recherche'}
            </p>
            {recipes.length === 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/recipes/new" 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer ma première recette
                </Link>
                <Link 
                  href="/ai-chef" 
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-bold text-lg"
                >
                  <span className="text-2xl">🤖</span>
                  Ou utiliser le Chef IA
                </Link>
              </div>
            ) : (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}>
            {filteredRecipes.map((recipe, index) => (
              <div 
                key={recipe._id} 
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
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

      {/* Floating Action Button (Mobile) */}
      <Link
        href="/recipes/new"
        className="md:hidden fixed bottom-6 right-6 z-40 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-110 active:scale-95"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </Link>

      {/* Footer amélioré */}
      <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 py-10 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🍳</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Mes Recettes
              </span>
            </div>
            <p className="text-gray-700 font-semibold mb-2">
              Made with <span className="text-red-500 animate-pulse">❤️</span> for Modern Mobile Application
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Progressive Web App
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Offline First
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Mobile Ready
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}