'use client';

interface Ingredient {
  name: string;
  quantity: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

interface Props {
  ingredients: Ingredient[];
}

export default function NutritionSummary({ ingredients }: Props) {
  const parseQuantity = (qty: string): number => {
    const match = qty.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 100;
  };

  const totals = ingredients.reduce((acc, ing) => {
    if (!ing.calories) return acc;
    
    const quantity = parseQuantity(ing.quantity);
    const multiplier = quantity / 100;

    return {
      calories: acc.calories + (ing.calories || 0) * multiplier,
      protein: acc.protein + (ing.protein || 0) * multiplier,
      fat: acc.fat + (ing.fat || 0) * multiplier,
      carbs: acc.carbs + (ing.carbs || 0) * multiplier,
    };
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

  if (totals.calories === 0) {
    return (
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            Informations nutritionnelles
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          💡 Utilisez la recherche d'ingrédients pour calculer automatiquement les calories et nutriments (100% gratuit avec USDA)
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border-2 border-emerald-200 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            Informations nutritionnelles
          </h3>
          <p className="text-xs text-emerald-700 font-medium">✅ Calculées automatiquement - USDA Database</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-orange-100 hover:border-orange-300 transition-all group">
          <div className="text-4xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
            {Math.round(totals.calories)}
          </div>
          <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Calories</div>
          <div className="text-xs text-gray-500 font-medium">kcal</div>
          <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🔥</div>
        </div>

        {/* Protéines */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-red-100 hover:border-red-300 transition-all group">
          <div className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">
            {totals.protein.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Protéines</div>
          <div className="text-xs text-gray-500 font-medium">grammes</div>
          <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🥩</div>
        </div>

        {/* Lipides */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-yellow-100 hover:border-yellow-300 transition-all group">
          <div className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-1">
            {totals.fat.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Lipides</div>
          <div className="text-xs text-gray-500 font-medium">grammes</div>
          <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🧈</div>
        </div>

        {/* Glucides */}
        <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-blue-100 hover:border-blue-300 transition-all group">
          <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            {totals.carbs.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 font-bold uppercase tracking-wide">Glucides</div>
          <div className="text-xs text-gray-500 font-medium">grammes</div>
          <div className="mt-2 text-2xl group-hover:scale-125 transition-transform">🍞</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white/60 rounded-xl border border-emerald-200">
        <p className="text-xs text-gray-600 text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Valeurs nutritionnelles pour 100g de chaque ingrédient
        </p>
      </div>
    </div>
  );
}