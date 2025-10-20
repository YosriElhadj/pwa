'use client';

import { useState, useEffect } from 'react';

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

interface FoodItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  foodCategory?: string;
}

const WORLD_CUISINES = [
  { name: 'Tous', emoji: '🌍', keywords: '' },
  { name: 'Italien', emoji: '🇮🇹', keywords: 'pasta pizza italian lasagna spaghetti risotto' },
  { name: 'Français', emoji: '🇫🇷', keywords: 'french croissant quiche crepe ratatouille coq' },
  { name: 'Japonais', emoji: '🇯🇵', keywords: 'sushi ramen tempura teriyaki miso japanese' },
  { name: 'Mexicain', emoji: '🇲🇽', keywords: 'taco burrito quesadilla enchilada mexican salsa' },
  { name: 'Chinois', emoji: '🇨🇳', keywords: 'chinese fried rice noodles dim sum wonton' },
  { name: 'Indien', emoji: '🇮🇳', keywords: 'curry tikka masala indian biryani tandoori' },
  { name: 'Américain', emoji: '🇺🇸', keywords: 'burger hot dog bbq american steak ribs' },
  { name: 'Thaï', emoji: '🇹🇭', keywords: 'thai pad curry tom coconut lemongrass' },
  { name: 'Grec', emoji: '🇬🇷', keywords: 'greek gyro souvlaki moussaka feta tzatziki' },
  { name: 'Espagnol', emoji: '🇪🇸', keywords: 'paella tapas spanish chorizo gazpacho' },
];

export default function WorldDishesExplorer() {
  const [selectedCuisine, setSelectedCuisine] = useState(WORLD_CUISINES[0]);
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    searchDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCuisine, page]);

  const searchDishes = async () => {
    if (!USDA_API_KEY) {
      setError('⚠️ USDA API key not configured');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const searchQuery = selectedCuisine.keywords || 'dish meal food recipe';
      const response = await fetch(
        `${USDA_API_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=12&pageNumber=${page}&dataType=Branded,Foundation,SR Legacy`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      const foods: FoodItem[] = data.foods.map((food: any) => {
        const nutrients = food.foodNutrients || [];
        
        const getNutrient = (nutrientId: number): number => {
          const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
          return nutrient?.value || 0;
        };

        return {
          fdcId: food.fdcId,
          description: food.description,
          brandOwner: food.brandOwner,
          ingredients: food.ingredients,
          servingSize: food.servingSize,
          servingSizeUnit: food.servingSizeUnit,
          calories: getNutrient(1008),
          protein: getNutrient(1003),
          fat: getNutrient(1004),
          carbs: getNutrient(1005),
          foodCategory: food.foodCategory,
        };
      });

      setDishes(foods);
      console.log('✅ Found', foods.length, 'dishes for', selectedCuisine.name);
    } catch (err: any) {
      console.error('❌ Error fetching dishes:', err);
      setError('Erreur lors du chargement des plats. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-blue-200">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🌍</span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Explorer les Plats du Monde
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Découvrez des milliers de plats avec leurs informations nutritionnelles
            </p>
          </div>
        </div>
      </div>

      {/* API Key Warning */}
      {!USDA_API_KEY && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Configuration requise: Ajoutez <code className="bg-red-100 px-2 py-1 rounded">NEXT_PUBLIC_USDA_API_KEY</code> dans votre <code className="bg-red-100 px-2 py-1 rounded">.env.local</code>
            <br />
            Obtenez une clé gratuite sur <a href="https://fdc.nal.usda.gov/api-key-signup.html" target="_blank" rel="noopener noreferrer" className="underline font-bold">USDA FoodData Central</a>
          </p>
        </div>
      )}

      {/* Cuisine Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🍽️</span>
          Choisissez une cuisine
        </h3>
        <div className="flex flex-wrap gap-2">
          {WORLD_CUISINES.map((cuisine) => (
            <button
              key={cuisine.name}
              onClick={() => {
                setSelectedCuisine(cuisine);
                setPage(1);
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                selectedCuisine.name === cuisine.name
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-xl">{cuisine.emoji}</span>
              <span>{cuisine.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des plats {selectedCuisine.name.toLowerCase()}...</p>
        </div>
      )}

      {/* Dishes Grid */}
      {!loading && dishes.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {dishes.map((dish) => (
              <div
                key={dish.fdcId}
                className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-md hover:shadow-2xl p-5 transform hover:-translate-y-1"
              >
                {/* Dish Icon */}
                <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-6xl">🍽️</span>
                </div>

                {/* Dish Name */}
                <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {dish.description}
                </h4>

                {/* Brand/Category */}
                {(dish.brandOwner || dish.foodCategory) && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                    {dish.brandOwner || dish.foodCategory}
                  </p>
                )}

                {/* Nutrition Info */}
                {dish.calories > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-600">
                        <span>🔥</span>
                        <span className="font-medium">Calories</span>
                      </span>
                      <span className="font-bold text-orange-600">{Math.round(dish.calories)} kcal</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-red-600">{dish.protein.toFixed(1)}g</div>
                        <div className="text-gray-600">Protéines</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-yellow-600">{dish.fat.toFixed(1)}g</div>
                        <div className="text-gray-600">Lipides</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <div className="font-bold text-blue-600">{dish.carbs.toFixed(1)}g</div>
                        <div className="text-gray-600">Glucides</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Serving Size */}
                {dish.servingSize && (
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Par {dish.servingSize}{dish.servingSizeUnit}</span>
                  </div>
                )}

                {/* View Details Link */}
                <a
                  href={`https://fdc.nal.usda.gov/fdc-app.html#/food-details/${dish.fdcId}/nutrients`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-bold shadow-md hover:shadow-lg"
                >
                  <span>Voir les détails</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-300 hover:to-gray-400 transition-all shadow-md"
            >
              ← Précédent
            </button>
            
            <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-md">
              Page {page}
            </div>
            
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              Suivant →
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !error && dishes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun plat trouvé</h3>
          <p className="text-gray-600">Essayez une autre cuisine</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Base de données USDA</h4>
            <p className="text-sm text-blue-800">
              Les informations proviennent de la base de données officielle USDA FoodData Central, 
              contenant plus de 1 million d&apos;aliments avec leurs informations nutritionnelles détaillées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}