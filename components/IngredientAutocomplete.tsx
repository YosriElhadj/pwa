'use client';

import { useState, useEffect, useRef } from 'react';

const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

interface FoodItem {
  fdcId: number;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  value: string;
  onChange: (name: string, foodData?: FoodItem) => void;
  placeholder?: string;
  className?: string;
}

export default function IngredientAutocomplete({ value, onChange, placeholder, className }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // FIX: Added null as initial value
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchFood = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (!USDA_API_KEY) {
      console.error('⚠️ USDA API key not found. Add NEXT_PUBLIC_USDA_API_KEY to .env.local');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${USDA_API_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=10&dataType=Foundation,SR%20Legacy`
      );

      if (response.ok) {
        const data = await response.json();
        
        const foods: FoodItem[] = data.foods.map((food: any) => {
          const nutrients = food.foodNutrients || [];
          
          const getNutrient = (nutrientId: number) => {
            const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId);
            return nutrient?.value || 0;
          };

          return {
            fdcId: food.fdcId,
            description: food.description,
            calories: getNutrient(1008), // Energy (kcal)
            protein: getNutrient(1003),  // Protein
            fat: getNutrient(1004),      // Total lipid (fat)
            carbs: getNutrient(1005),    // Carbohydrate
          };
        });

        setSuggestions(foods);
        setShowDropdown(foods.length > 0);
        console.log('✅ Found', foods.length, 'foods for:', searchQuery);
      } else {
        console.error('❌ USDA API Error:', response.status);
      }
    } catch (error) {
      console.error('❌ Error searching food:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchFood(newValue);
    }, 400);
  };

  const handleSelect = (food: FoodItem) => {
    setQuery(food.description);
    onChange(food.description, food);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder || "Ex: Poulet, Tomate, Riz..."}
          className={className || "w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all pr-10"}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-emerald-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          <div className="p-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Base de données USDA - 100% Gratuit & Illimité
            </p>
          </div>
          {suggestions.map((food) => (
            <button
              key={food.fdcId}
              type="button"
              onClick={() => handleSelect(food)}
              className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all border-b border-gray-100 last:border-0 flex items-start gap-3 group"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200 group-hover:border-emerald-300 transition-colors">
                <span className="text-2xl">🍽️</span>
              </div>

              {/* Food info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {food.description}
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-1.5">
                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    🔥 {Math.round(food.calories)} kcal
                  </span>
                  <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    🥩 {food.protein.toFixed(1)}g
                  </span>
                  <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    🧈 {food.fat.toFixed(1)}g
                  </span>
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    🍞 {food.carbs.toFixed(1)}g
                  </span>
                </div>
              </div>

              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}