'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useRecipes } from '@/hooks/useRecipes';
import * as idb from '@/lib/db';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  prepTime: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  image?: string;
  isFavorite: boolean;
  createdAt: Date;
}

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isOnline, updateRecipe, deleteRecipe } = useRecipes();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Recipe | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadRecipe() {
      try {
        // Essayer d'abord depuis IndexedDB
        const localRecipe = await idb.getRecipeById(params.id);
        
        if (localRecipe) {
          setRecipe(localRecipe);
          setEditData(localRecipe);
        } else if (isOnline) {
          // Si pas trouvé localement et en ligne, essayer l'API
          const response = await fetch(`http://localhost:3001/api/recipes/${params.id}`);
          if (response.ok) {
            const data = await response.json();
            setRecipe(data);
            setEditData(data);
          }
        }
      } catch (error) {
        console.error('Error loading recipe:', error);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params.id, isOnline]);

  const handleToggleFavorite = async () => {
    if (recipe) {
      const updatedRecipe = { ...recipe, isFavorite: !recipe.isFavorite };
      await updateRecipe(recipe._id, updatedRecipe);
      setRecipe(updatedRecipe);
    }
  };

  const handleDelete = async () => {
    await deleteRecipe(params.id);
    router.push('/');
  };

  const handleSaveEdit = async () => {
    if (editData) {
      await updateRecipe(params.id, editData);
      setRecipe(editData);
      setIsEditing(false);
    }
  };

  const toggleStepCheck = (index: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedSteps(newChecked);
  };

  const addIngredient = () => {
    if (editData) {
      setEditData({
        ...editData,
        ingredients: [...editData.ingredients, { name: '', quantity: '' }],
      });
    }
  };

  const removeIngredient = (index: number) => {
    if (editData) {
      setEditData({
        ...editData,
        ingredients: editData.ingredients.filter((_, i) => i !== index),
      });
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    if (editData) {
      const newIngredients = [...editData.ingredients];
      newIngredients[index][field] = value;
      setEditData({ ...editData, ingredients: newIngredients });
    }
  };

  const addStep = () => {
    if (editData) {
      setEditData({
        ...editData,
        steps: [...editData.steps, ''],
      });
    }
  };

  const removeStep = (index: number) => {
    if (editData) {
      setEditData({
        ...editData,
        steps: editData.steps.filter((_, i) => i !== index),
      });
    }
  };

  const updateStep = (index: number, value: string) => {
    if (editData) {
      const newSteps = [...editData.steps];
      newSteps[index] = value;
      setEditData({ ...editData, steps: newSteps });
    }
  };

  const categoryColors: Record<string, string> = {
    'Entrée': 'from-green-500 to-emerald-600',
    'Plat principal': 'from-orange-500 to-red-600',
    'Dessert': 'from-pink-500 to-rose-600',
    'Boisson': 'from-blue-500 to-cyan-600',
    'Snack': 'from-purple-500 to-indigo-600'
  };

  const difficultyConfig: Record<string, { color: string; icon: string }> = {
    'Facile': { color: 'from-green-500 to-emerald-600', icon: '⭐' },
    'Moyen': { color: 'from-yellow-500 to-orange-600', icon: '⭐⭐' },
    'Difficile': { color: 'from-red-500 to-rose-600', icon: '⭐⭐⭐' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mb-6 mx-auto">
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-emerald-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🍳</span>
            </div>
          </div>
          <p className="text-gray-600 font-semibold text-lg">Chargement de la recette...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">😕</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Recette introuvable</h2>
          <p className="text-gray-600 mb-6">Cette recette n'existe pas ou a été supprimée</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header amélioré */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link 
              href="/" 
              className="group flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-all"
            >
              <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-semibold hidden sm:inline">Retour</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Statut Online/Offline */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
              </div>

              {/* Bouton Favori amélioré */}
              <button
                onClick={handleToggleFavorite}
                className="group p-2.5 hover:bg-gradient-to-r from-pink-50 to-red-50 rounded-xl transition-all border-2 border-transparent hover:border-pink-200 shadow-md"
                title={recipe.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <svg
                  className={`w-6 h-6 transition-all ${
                    recipe.isFavorite 
                      ? 'fill-red-500 scale-110' 
                      : 'fill-gray-300 group-hover:fill-red-400'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>

              {/* Bouton Modifier amélioré */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group p-2.5 hover:bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transition-all border-2 border-transparent hover:border-blue-200 shadow-md"
                  title="Modifier la recette"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg font-semibold text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegarder
                </button>
              )}

              {/* Bouton Supprimer amélioré */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group p-2.5 hover:bg-gradient-to-r from-red-50 to-rose-50 rounded-xl transition-all border-2 border-transparent hover:border-red-200 shadow-md"
                title="Supprimer la recette"
              >
                <svg className="w-6 h-6 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform animate-scaleIn">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Supprimer la recette ?</h3>
            <p className="text-gray-600 text-center mb-6">
              Cette action est irréversible. Êtes-vous sûr de vouloir supprimer <strong>{recipe.title}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold border-2 border-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
        {!isEditing ? (
          /* MODE LECTURE */
          <div className="animate-fadeIn">
            {/* Image Hero avec overlay */}
            {recipe.image && (
              <div className="relative w-full h-72 sm:h-96 md:h-[28rem] rounded-3xl overflow-hidden shadow-2xl mb-8 group">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                    {recipe.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {recipe.isFavorite && (
                      <span className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        ❤️ Favori
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* En-tête sans image */}
              {!recipe.image && (
                <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500 to-teal-600">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3">
                    {recipe.title}
                  </h1>
                </div>
              )}

              <div className="p-6 sm:p-8 md:p-10">
                {/* Badges d'informations */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <div className={`px-4 py-2.5 bg-gradient-to-r ${categoryColors[recipe.category] || 'from-gray-500 to-gray-600'} text-white rounded-xl shadow-lg font-semibold flex items-center gap-2`}>
                    <span className="text-lg">🍽️</span>
                    {recipe.category}
                  </div>
                  <div className={`px-4 py-2.5 bg-gradient-to-r ${difficultyConfig[recipe.difficulty]?.color || 'from-gray-500 to-gray-600'} text-white rounded-xl shadow-lg font-semibold flex items-center gap-2`}>
                    <span>{difficultyConfig[recipe.difficulty]?.icon}</span>
                    {recipe.difficulty}
                  </div>
                  <div className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {recipe.prepTime} min
                  </div>
                </div>

                {/* Ingrédients avec design amélioré */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🥕</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      Ingrédients
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-100 hover:border-orange-300 transition-all group"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-gray-800 block">{ingredient.name}</span>
                          <span className="text-sm text-gray-600">{ingredient.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Étapes avec checkboxes interactives */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">👨‍🍳</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Préparation
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {recipe.steps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`group flex gap-4 p-5 rounded-2xl border-2 transition-all ${
                          checkedSteps.has(index)
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        <button
                          onClick={() => toggleStepCheck(index)}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md transition-all ${
                            checkedSteps.has(index)
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:scale-110'
                          }`}
                        >
                          {checkedSteps.has(index) ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </button>
                        <p className={`text-gray-700 pt-2 flex-1 ${checkedSteps.has(index) ? 'line-through text-gray-500' : ''}`}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Barre de progression */}
                  {recipe.steps.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Progression</span>
                        <span className="text-sm font-bold text-purple-600">
                          {Math.round((checkedSteps.size / recipe.steps.length) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                          style={{ width: `${(checkedSteps.size / recipe.steps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* MODE ÉDITION */
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 border border-gray-100 animate-fadeIn">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Modifier la recette
              </h2>
            </div>

            {/* Titre */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-xl">🍳</span>
                Titre
              </label>
              <input
                type="text"
                value={editData?.title || ''}
                onChange={(e) => setEditData(editData ? { ...editData, title: e.target.value } : null)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all text-lg"
                placeholder="Nom de votre recette"
              />
            </div>

            {/* Catégorie, Difficulté et Temps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  📂 Catégorie
                </label>
                <select
                  value={editData?.category || ''}
                  onChange={(e) => setEditData(editData ? { ...editData, category: e.target.value } : null)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-white font-medium"
                >
                  <option value="Entrée">🥗 Entrée</option>
                  <option value="Plat principal">🍝 Plat principal</option>
                  <option value="Dessert">🍰 Dessert</option>
                  <option value="Boisson">🥤 Boisson</option>
                  <option value="Snack">🍿 Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  ⚡ Difficulté
                </label>
                <select
                  value={editData?.difficulty || ''}
                  onChange={(e) => setEditData(editData ? { ...editData, difficulty: e.target.value } : null)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-white font-medium"
                >
                  <option value="Facile">⭐ Facile</option>
                  <option value="Moyen">⭐⭐ Moyen</option>
                  <option value="Difficile">⭐⭐⭐ Difficile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  ⏱️ Temps (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editData?.prepTime || 0}
                  onChange={(e) => setEditData(editData ? { ...editData, prepTime: parseInt(e.target.value) } : null)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                🖼️ URL de l'image <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="url"
                value={editData?.image || ''}
                onChange={(e) => setEditData(editData ? { ...editData, image: e.target.value } : null)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Ingrédients */}
            <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span className="text-2xl">🥕</span>
                  Ingrédients
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border-2 border-emerald-200 transition-all font-semibold shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {editData?.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-xl shadow-sm">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Nom de l'ingrédient"
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                    />
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      placeholder="Quantité"
                      className="w-32 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                    />
                    {editData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border-2 border-transparent hover:border-red-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Étapes */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span className="text-2xl">👨‍🍳</span>
                  Étapes de préparation
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border-2 border-emerald-200 transition-all font-semibold shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div className="space-y-4">
                {editData?.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
                      {index + 1}
                    </div>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      rows={3}
                      placeholder={`Décrivez l'étape ${index + 1}...`}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none transition-all"
                    />
                    {editData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all h-fit border-2 border-transparent hover:border-red-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarder les modifications
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(recipe);
                }}
                className="flex-1 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-all font-bold text-lg border-2 border-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Message mode offline amélioré */}
        {!isOnline && (
          <div className="mt-6 p-5 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-2xl shadow-md animate-fadeIn">
            <p className="text-sm text-orange-900 flex items-start gap-3 font-medium">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>
                <strong>Mode hors ligne :</strong> Vos modifications seront synchronisées automatiquement dès que vous serez reconnecté à Internet.
              </span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}