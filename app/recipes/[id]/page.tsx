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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      await deleteRecipe(params.id);
      router.push('/');
    }
  };

  const handleSaveEdit = async () => {
    if (editData) {
      await updateRecipe(params.id, editData);
      setRecipe(editData);
      setIsEditing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recette introuvable</h2>
          <Link href="/" className="text-green-600 hover:text-green-700 font-medium">
            Retour a l accueil
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
            <Link href="/" className="flex items-center gap-2 text-green-600 hover:text-green-700">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Retour</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Bouton Favori */}
              <button
                onClick={handleToggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg
                  className={`w-6 h-6 ${recipe.isFavorite ? 'fill-red-500' : 'fill-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>

              {/* Bouton Modifier */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                >
                  Sauvegarder
                </button>
              )}

              {/* Bouton Supprimer */}
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-full transition"
              >
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
        {!isEditing ? (
          /* MODE LECTURE */
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
              {/* Titre et Badge */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {recipe.title}
              </h1>

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
        ) : (
          /* MODE ÉDITION */
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Modifier la recette</h2>

            {/* Titre */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={editData?.title || ''}
                onChange={(e) => setEditData(editData ? { ...editData, title: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Catégorie et Difficulté */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={editData?.category || ''}
                  onChange={(e) => setEditData(editData ? { ...editData, category: e.target.value } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Entrée">Entrée</option>
                  <option value="Plat principal">Plat principal</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Boisson">Boisson</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulté *
                </label>
                <select
                  value={editData?.difficulty || ''}
                  onChange={(e) => setEditData(editData ? { ...editData, difficulty: e.target.value } : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Facile">Facile</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Difficile">Difficile</option>
                </select>
              </div>
            </div>

            {/* Temps de préparation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps de préparation (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={editData?.prepTime || 0}
                onChange={(e) => setEditData(editData ? { ...editData, prepTime: parseInt(e.target.value) } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Image URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l image
              </label>
              <input
                type="url"
                value={editData?.image || ''}
                onChange={(e) => setEditData(editData ? { ...editData, image: e.target.value } : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Ingrédients */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Ingrédients *
                </label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {editData?.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Nom"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      placeholder="Quantité"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {editData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Étapes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Étapes *
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {editData?.steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-medium text-sm mt-1">
                      {index + 1}
                    </div>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      rows={2}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    {editData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition h-fit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(recipe);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Message mode offline */}
        {!isOnline && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Mode hors ligne : Les modifications seront synchronisées automatiquement lors de la reconnexion.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}