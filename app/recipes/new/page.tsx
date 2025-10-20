'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecipes } from '@/hooks/useRecipes';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import IngredientAutocomplete from '@/components/IngredientAutocomplete';
import NutritionSummary from '@/components/NutritionSummary';


export default function NewRecipePage() {
  const router = useRouter();
  const { addRecipe, isOnline } = useRecipes();
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plat principal',
    difficulty: 'Facile',
    prepTime: 30,
    ingredients: [{
      name: '',
      quantity: '',
      foodId: '',
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    }],
    steps: [''],
    image: '',
    isPublic: false,
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
        isPublic: formData.isPublic,
        tags: formData.tags || []
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
      ingredients: [...formData.ingredients, {
        name: '',
        quantity: '',
        foodId: '',
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
      }],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients];
    (newIngredients[index] as any)[field] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredientWithNutrition = (index: number, name: string, foodData?: any) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      name,
      foodId: foodData?.fdcId?.toString() || '',
      calories: foodData?.calories || 0,
      protein: foodData?.protein || 0,
      fat: foodData?.fat || 0,
      carbs: foodData?.carbs || 0,
    };
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

  const difficultyColors = {
    'Facile': 'bg-green-100 text-green-700 border-green-200',
    'Moyen': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Difficile': 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header with blur effect */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="group flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-all">
              <div className="p-2 rounded-lg group-hover:bg-emerald-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-semibold">Retour</span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ✨ Nouvelle Recette
              </h1>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
          
          {/* Titre with icon */}
          <div className="mb-8">
            <label htmlFor="title" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🍳</span>
              Titre de la recette
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all text-lg"
              placeholder="Ex: Pâtes à la carbonara"
            />
          </div>

          {/* Grid layout for category and difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label htmlFor="category" className="block text-sm font-bold text-gray-800 mb-3">
                📂 Catégorie
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-white"
              >
                <option value="Entrée">🥗 Entrée</option>
                <option value="Plat principal">🍝 Plat principal</option>
                <option value="Dessert">🍰 Dessert</option>
                <option value="Boisson">🥤 Boisson</option>
                <option value="Snack">🍿 Snack</option>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-bold text-gray-800 mb-3">
                ⚡ Difficulté
              </label>
              <select
                id="difficulty"
                required
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-emerald-100 transition-all font-medium ${
                  difficultyColors[formData.difficulty as keyof typeof difficultyColors]
                }`}
              >
                <option value="Facile">Facile</option>
                <option value="Moyen">Moyen</option>
                <option value="Difficile">Difficile</option>
              </select>
            </div>

            <div>
              <label htmlFor="prepTime" className="block text-sm font-bold text-gray-800 mb-3">
                ⏱️ Temps (min)
              </label>
              <input
                type="number"
                id="prepTime"
                required
                min="1"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) })}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          {/* Image Upload Component */}
          <div className="mb-8">
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
              label="Image de la recette"
            />
          </div>

          {/* Enhanced Public Toggle */}
          <div className="mb-8">
            <div className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-2 border-emerald-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="isPublic" className="block text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    Partager publiquement
                  </label>
                  <p className="text-sm text-gray-600">
                    Laissez la communauté découvrir votre création
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
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-200 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Tags with better spacing */}
          <div className="mb-8">
            <label htmlFor="tags" className="block text-sm font-bold text-gray-800 mb-3">
              🏷️ Tags
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
              placeholder="végétarien, rapide, sans four"
            />
            <p className="text-xs text-gray-500 mt-2 ml-1">
              💡 Séparez les tags par des virgules
            </p>
          </div>

          {/* Ingrédients section with autocomplete */}
          <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🥕</span>
                Ingrédients
              </label>
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border-2 border-emerald-200 transition-all font-semibold shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-xl shadow-sm">
                  <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow">
                    {index + 1}
                  </span>
                  
                  {/* Ingredient Name with Autocomplete */}
                  <div className="flex-1">
                    <IngredientAutocomplete
                      value={ingredient.name}
                      onChange={(name, foodData) => updateIngredientWithNutrition(index, name, foodData)}
                      placeholder="Rechercher un ingrédient..."
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={ingredient.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    placeholder="Ex: 200g"
                    className="w-32 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                  />
                  {formData.ingredients.length > 1 && (
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

          {/* Nutrition Summary */}
          <div className="mb-8">
            <NutritionSummary ingredients={formData.ingredients} />
          </div>

          {/* Steps section with improved design */}
          <div className="mb-10 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">👨‍🍳</span>
                Étapes de préparation
              </label>
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 border-2 border-emerald-200 transition-all font-semibold shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-3 bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
                    {index + 1}
                  </div>
                  <textarea
                    required
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Décrivez l'étape ${index + 1}...`}
                    rows={3}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none transition-all"
                  />
                  {formData.steps.length > 1 && (
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

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Création en cours...
                </span>
              ) : '✨ Créer la recette'}
            </button>
            <Link
              href="/"
              className="flex-1 bg-gray-100 text-gray-700 px-8 py-4 rounded-xl hover:bg-gray-200 transition-all font-bold text-lg text-center shadow-md hover:shadow-lg border-2 border-gray-200"
            >
              Annuler
            </Link>
          </div>

          {/* Offline notice */}
          {!isOnline && (
            <div className="mt-6 p-5 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-2xl shadow-md">
              <p className="text-sm text-orange-900 flex items-start gap-3 font-medium">
                <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  <strong>Mode hors ligne :</strong> Votre recette sera sauvegardée localement et synchronisée automatiquement dès que vous serez reconnecté.
                </span>
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}