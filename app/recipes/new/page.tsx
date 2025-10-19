'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import Link from 'next/link';

export default function NewRecipePage() {
  const router = useRouter();
  const { addRecipe, isOnline } = useRecipes();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plat principal',
    difficulty: 'Facile',
    prepTime: 30,
    ingredients: [{ name: '', quantity: '' }],
    steps: [''],
    image: '',
    isPublic: false,  // NOUVEAU
    tags: [] as string[],  
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanedData = {
        ...formData,
        ingredients: formData.ingredients.filter(ing => ing.name.trim() !== ''),
        steps: formData.steps.filter(step => step.trim() !== ''),
      };

      await addRecipe(cleanedData);
      router.push('/');
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Erreur lors de la création de la recette');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: '' }],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, ''],
    });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2 text-green-600 hover:text-green-700 transition">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium text-sm sm:text-base">Retour</span>
            </Link>

            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              Nouvelle Recette
            </h1>

            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-100">
          
          {/* Titre */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Titre de la recette *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Ex: Pâtes à la carbonara"
            />
          </div>

          {/* Catégorie et Difficulté */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="Entrée">Entrée</option>
                <option value="Plat principal">Plat principal</option>
                <option value="Dessert">Dessert</option>
                <option value="Boisson">Boisson</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulté *
              </label>
              <select
                id="difficulty"
                required
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="Facile">Facile</option>
                <option value="Moyen">Moyen</option>
                <option value="Difficile">Difficile</option>
              </select>
            </div>
          </div>

          {/* Temps de préparation */}
          <div className="mb-6">
            <label htmlFor="prepTime" className="block text-sm font-semibold text-gray-700 mb-2">
              Temps de préparation (minutes) *
            </label>
            <input
              type="number"
              id="prepTime"
              required
              min="1"
              value={formData.prepTime}
              onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          {/* URL Image */}
          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-2">
              URL de l&#39;image (optionnel)
            </label>
            <input
              type="url"
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {/* Visibilité */}
                <div className="mb-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
                    <div className="flex-1">
                    <label htmlFor="isPublic" className="block text-sm font-semibold text-gray-800 mb-1">
                        Rendre cette recette publique 🌍
                    </label>
                    <p className="text-xs text-gray-600">
                        Les autres utilisateurs pourront découvrir et aimer votre recette
                    </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={formData.isPublic || false}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
                </div>

                    {/* Tags */}
                    <div className="mb-6">
                    <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags (séparés par des virgules)
                    </label>
                    <input
                        type="text"
                        id="tags"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => setFormData({ 
                        ...formData, 
                        tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                        })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        placeholder="végétarien, rapide, sansfour"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Exemple : végétarien, rapide, sansfour, dessert
                    </p>
                    </div>

          {/* Ingrédients */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Ingrédients *
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 hover:bg-green-50 px-3 py-1 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="Nom de l'ingrédient"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  <input
                    type="text"
                    required
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    placeholder="Quantité"
                    className="w-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition"
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Étapes de préparation *
              </label>
              <button
                type="button"
                onClick={addStep}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 hover:bg-green-50 px-3 py-1 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm mt-1 shadow-md">
                    {index + 1}
                  </div>
                  <textarea
                    required
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Étape ${index + 1}`}
                    rows={2}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition"
                  />
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition h-fit"
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Création en cours...' : 'Créer la recette'}
            </button>
            <Link
              href="/"
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition font-medium text-center shadow-md"
            >
              Annuler
            </Link>
          </div>

          {/* Message mode offline */}
          {!isOnline && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl shadow-md">
              <p className="text-sm text-orange-800 flex items-center gap-2 font-medium">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Mode hors ligne : La recette sera sauvegardée localement et synchronisée automatiquement lors de la reconnexion.
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}