'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CameraCapture from '@/components/CameraCapture';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

interface DetectedIngredient {
  name: string;
  quantity: string;
  confidence: number;
  category: string;
}

interface SuggestedRecipe {
  title: string;
  matchPercentage: number;
  missingIngredients: string[];
  difficulty: string;
}

interface FullRecipe {
  title: string;
  difficulty: string;
  prepTime: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedFat: number;
  estimatedCarbs: number;
}

export default function FridgeScannerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipe[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'capture' | 'results' | 'recipes'>('capture');
  const [debugInfo, setDebugInfo] = useState('');
  
  // ✅ NEW: State for recipe modal
  const [selectedRecipe, setSelectedRecipe] = useState<FullRecipe | null>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);

  const analyzeImage = async (imageDataUrl: string, file: File) => {
    if (!GEMINI_API_KEY) {
      setError('Clé API Gemini manquante. Ajoutez NEXT_PUBLIC_GEMINI_API_KEY dans .env.local');
      return;
    }

    setAnalyzing(true);
    setError('');
    setDebugInfo('');

    try {
      console.log('🔍 Starting image analysis...');
      console.log('🔑 API Key exists:', !!GEMINI_API_KEY);
      
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      const modelNames = [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
        'gemini-pro-vision',
      ];
      
      let model;
      let usedModel = '';
      
      for (const modelName of modelNames) {
        try {
          console.log(`🔄 Trying model: ${modelName}`);
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          });
          
          const testResult = await model.generateContent('Respond with just "OK"');
          const testText = await testResult.response.text();
          console.log(`✅ Model ${modelName} responded:`, testText);
          
          usedModel = modelName;
          console.log(`✅ Successfully using model: ${modelName}`);
          break;
        } catch (err: any) {
          console.log(`❌ Model ${modelName} failed:`, err.message);
          continue;
        }
      }
      
      if (!model || !usedModel) {
        throw new Error('Aucun modèle Gemini disponible. Vérifiez votre clé API sur https://aistudio.google.com/app/apikey');
      }

      const base64Data = imageDataUrl.split(',')[1];
      console.log('📸 Image converted to base64');

      const prompt = `You are a food recognition AI. Analyze this image and identify ALL visible food ingredients.

IMPORTANT: Return ONLY a valid JSON array, nothing else. No markdown, no explanations, no code blocks.

Format:
[
  {
    "name": "ingredient name in French",
    "quantity": "estimated quantity (e.g., '2 pièces', '200g', '1 tasse')",
    "confidence": 0.95,
    "category": "légume"
  }
]

Categories: légume, fruit, viande, produit laitier, épice, autre

Rules:
- Return ONLY the JSON array
- No markdown code blocks
- No additional text
- Confidence between 0.0 and 1.0
- If you see multiple items, list them all
- Be specific with names (e.g., "tomate" not "légume")`;

      console.log(`🤖 Calling Gemini API with model ${usedModel}...`);
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        },
      ]);

      const response = await result.response;
      let text = response.text();
      
      console.log('📝 Raw Gemini Response:', text);
      setDebugInfo(`Model used: ${usedModel}\nResponse: ${text}`);

      text = text.trim();
      text = text.replace(/```json\n?/gi, '');
      text = text.replace(/```\n?/g, '');
      text = text.replace(/`/g, '');
      
      const firstBrace = text.indexOf('[');
      if (firstBrace > 0) {
        text = text.substring(firstBrace);
      }
      
      const lastBrace = text.lastIndexOf(']');
      if (lastBrace > 0 && lastBrace < text.length - 1) {
        text = text.substring(0, lastBrace + 1);
      }

      text = text.replace(/\n/g, ' ');
      text = text.replace(/\r/g, '');
      text = text.replace(/\t/g, ' ');
      text = text.replace(/\s+/g, ' ');

      let ingredients: DetectedIngredient[];
      try {
        ingredients = JSON.parse(text);
        console.log('✅ JSON parsed successfully');
      } catch (parseError: any) {
        console.error('❌ JSON Parse Error:', parseError.message);
        setDebugInfo(`Parse error: ${parseError.message}\nText: ${text.substring(0, 500)}`);
        throw new Error(`Impossible de parser la réponse JSON: ${parseError.message}`);
      }

      if (Array.isArray(ingredients) && ingredients.length > 0) {
        ingredients = ingredients.map(ing => ({
          name: ing.name || 'Ingrédient inconnu',
          quantity: ing.quantity || '1 unité',
          confidence: typeof ing.confidence === 'number' ? ing.confidence : 0.5,
          category: ing.category || 'autre',
        }));

        console.log('✅ Successfully parsed ingredients:', ingredients);
        setDetectedIngredients(ingredients);
        setStep('results');

        await findRecipeSuggestions(ingredients.map(i => i.name));
      } else {
        console.error('❌ No valid ingredients found');
        setError(`Aucun ingrédient détecté dans l'image. Essayez avec une photo plus claire des aliments.`);
        setDebugInfo(`Réponse de l'IA: ${text}`);
      }

    } catch (err: any) {
      console.error('❌ Analysis error:', err);
      
      let errorMessage = 'Erreur lors de l\'analyse. ';
      
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
        errorMessage += '❌ Clé API invalide. Obtenez une nouvelle clé sur https://aistudio.google.com/app/apikey';
      } else if (err.message?.includes('401')) {
        errorMessage += '❌ Clé API non autorisée. Vérifiez votre NEXT_PUBLIC_GEMINI_API_KEY';
      } else if (err.message?.includes('quota') || err.message?.includes('429')) {
        errorMessage += '⏰ Quota API dépassé. Réessayez dans quelques minutes.';
      } else if (err.message?.includes('404') || err.message?.includes('not found')) {
        errorMessage += `🔧 Modèle non trouvé: ${err.message}`;
      } else if (err.message?.includes('parse') || err.message?.includes('JSON')) {
        errorMessage += '📝 Réponse invalide. Réessayez avec une photo plus claire.';
      } else {
        errorMessage += err.message || 'Réessayez avec une autre photo.';
      }
      
      setError(errorMessage);
      setDebugInfo(err.stack || err.toString());
    } finally {
      setAnalyzing(false);
    }
  };

  const findRecipeSuggestions = async (ingredientNames: string[]) => {
    if (!GEMINI_API_KEY || ingredientNames.length === 0) return;

    try {
      console.log('🍽️ Finding recipe suggestions for:', ingredientNames);
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      const modelNames = [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-1.5-pro',
      ];
      
      let model;
      let usedModel = '';
      
      for (const modelName of modelNames) {
        try {
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          });
          
          const testResult = await model.generateContent('OK');
          await testResult.response.text();
          usedModel = modelName;
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!model) {
        console.log('⚠️ No model available for recipe suggestions');
        return;
      }

      const prompt = `Given these ingredients: ${ingredientNames.join(', ')}

Suggest 5 recipes in French. Return ONLY a valid JSON array, no markdown:

[
  {
    "title": "Recipe name in French",
    "matchPercentage": 85,
    "missingIngredients": ["ingredient1", "ingredient2"],
    "difficulty": "facile"
  }
]

Rules:
- matchPercentage: how many recipe ingredients the user has (0-100)
- difficulty: facile, moyen, or difficile
- Order by match percentage (highest first)
- Return ONLY the JSON array`;

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      console.log('📝 Recipe suggestions response:', text);

      text = text.trim();
      text = text.replace(/```json\n?/gi, '');
      text = text.replace(/```\n?/g, '');
      text = text.replace(/`/g, '');
      
      const firstBrace = text.indexOf('[');
      if (firstBrace > 0) {
        text = text.substring(firstBrace);
      }
      
      const lastBrace = text.lastIndexOf(']');
      if (lastBrace > 0 && lastBrace < text.length - 1) {
        text = text.substring(0, lastBrace + 1);
      }

      let recipes: SuggestedRecipe[];
      try {
        recipes = JSON.parse(text);
      } catch (e) {
        console.log('❌ Failed to parse recipes');
        return;
      }

      if (Array.isArray(recipes) && recipes.length > 0) {
        console.log('✅ Successfully parsed recipes:', recipes);
        setSuggestedRecipes(recipes);
        setStep('recipes');
      } else {
        console.log('⚠️ No recipes found, staying on results page');
      }
    } catch (err) {
      console.error('❌ Recipe suggestion error:', err);
    }
  };

  // ✅ NEW: Fetch full recipe details
  const fetchRecipeDetails = async (recipeName: string) => {
    if (!GEMINI_API_KEY) return;

    setLoadingRecipeDetails(true);
    setError('');

    try {
      console.log('📖 Fetching full recipe for:', recipeName);
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      const modelNames = [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
      ];
      
      let model;
      for (const modelName of modelNames) {
        try {
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          });
          const testResult = await model.generateContent('OK');
          await testResult.response.text();
          break;
        } catch (err) {
          continue;
        }
      }
      
      if (!model) {
        throw new Error('Aucun modèle disponible');
      }

      const prompt = `Generate a complete recipe for: "${recipeName}"

Return ONLY a valid JSON object, no markdown:

{
  "title": "Recipe name in French",
  "difficulty": "facile",
  "prepTime": 30,
  "ingredients": [
    {"name": "Ingredient 1", "quantity": "200g"},
    {"name": "Ingredient 2", "quantity": "100ml"}
  ],
  "steps": [
    "Step 1 description",
    "Step 2 description"
  ],
  "estimatedCalories": 450,
  "estimatedProtein": 25,
  "estimatedFat": 15,
  "estimatedCarbs": 45
}

Rules:
- difficulty: facile, moyen, or difficile
- prepTime in minutes
- At least 3 ingredients with French names
- At least 3 detailed steps
- Realistic nutritional values
- Return ONLY the JSON object`;

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      console.log('📝 Full recipe response:', text);

      text = text.trim();
      text = text.replace(/```json\n?/gi, '');
      text = text.replace(/```\n?/g, '');
      text = text.replace(/`/g, '');
      
      const firstBrace = text.indexOf('{');
      if (firstBrace > 0) {
        text = text.substring(firstBrace);
      }
      
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < text.length - 1) {
        text = text.substring(0, lastBrace + 1);
      }

      text = text.replace(/\n/g, ' ');
      text = text.replace(/\r/g, '');
      text = text.replace(/\t/g, ' ');
      text = text.replace(/\s+/g, ' ');

      const fullRecipe: FullRecipe = JSON.parse(text);
      console.log('✅ Full recipe loaded:', fullRecipe.title);
      setSelectedRecipe(fullRecipe);

    } catch (err: any) {
      console.error('❌ Recipe details error:', err);
      setError('Impossible de charger les détails de la recette. Réessayez.');
    } finally {
      setLoadingRecipeDetails(false);
    }
  };

  const saveIngredientsToPantry = async () => {
    if (!session?.accessToken) {
      setError('Vous devez être connecté pour sauvegarder');
      return;
    }

    setSaving(true);
    setError('');

    try {
      console.log('💾 Saving ingredients to pantry:', detectedIngredients);
      
      const response = await fetch(`${API_URL}/pantry/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          ingredients: detectedIngredients.map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: '',
            category: ing.category,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
      }

      console.log('✅ Ingredients saved successfully');
      alert('✅ Ingrédients sauvegardés dans votre garde-manger!');
      router.push('/pantry');
    } catch (err: any) {
      console.error('❌ Save error:', err);
      setError(`Erreur de sauvegarde: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-green-600 hover:text-green-700 font-semibold">
            ← Retour
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧊 Scanner mon Frigo
          </h1>
          <p className="text-gray-600">
            Prenez une photo de vos ingrédients et découvrez ce que vous pouvez cuisiner!
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-sm font-semibold mb-2">❌ Erreur:</p>
            <p className="text-red-700 text-sm">{error}</p>
            {debugInfo && (
              <details className="mt-3">
                <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                  🔍 Voir les détails techniques
                </summary>
                <pre className="text-xs bg-red-100 p-3 rounded mt-2 overflow-auto max-h-60 whitespace-pre-wrap">
                  {debugInfo}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Step 1: Capture */}
        {step === 'capture' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📸 Étape 1: Prenez une photo
            </h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 mb-2">💡 Conseils pour une meilleure détection:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>✓ Utilisez un bon éclairage</li>
                <li>✓ Prenez la photo de près</li>
                <li>✓ Assurez-vous que les aliments sont visibles</li>
                <li>✓ Évitez les ombres fortes</li>
              </ul>
            </div>
            
            <CameraCapture onCapture={analyzeImage} loading={analyzing} />
            
            {analyzing && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600 font-semibold">
                  🤖 Analyse en cours avec l'IA Gemini...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Cela peut prendre 5-10 secondes
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Results */}
        {step === 'results' && detectedIngredients.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              ✅ Ingrédients détectés ({detectedIngredients.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {detectedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{ingredient.name}</h3>
                    <p className="text-sm text-gray-600">{ingredient.quantity}</p>
                    <p className="text-xs text-gray-500 capitalize">{ingredient.category}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      ingredient.confidence > 0.7 ? 'text-green-600' : 
                      ingredient.confidence > 0.4 ? 'text-yellow-600' : 'text-orange-600'
                    }`}>
                      {Math.round(ingredient.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">confiance</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={saveIngredientsToPantry}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Sauvegarde...' : '💾 Sauvegarder dans mon garde-manger'}
              </button>
              <button
                onClick={() => {
                  setStep('capture');
                  setDetectedIngredients([]);
                  setSuggestedRecipes([]);
                  setError('');
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Recommencer
              </button>
            </div>

            {suggestedRecipes.length === 0 && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600 text-sm">
                  Recherche de recettes...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Recipe Suggestions - ✅ UPDATED WITH CLICK */}
        {step === 'recipes' && suggestedRecipes.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🍽️ Recettes suggérées
            </h2>

            <div className="space-y-4">
              {suggestedRecipes.map((recipe, index) => (
                <button
                  key={index}
                  onClick={() => fetchRecipeDetails(recipe.title)}
                  className="w-full p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-gray-200 rounded-xl hover:border-green-400 transition-all hover:shadow-lg text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{recipe.title}</h3>
                    <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold whitespace-nowrap ml-2">
                      {recipe.matchPercentage}% match
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1 capitalize">
                      📊 {recipe.difficulty}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      👉 Cliquez pour voir la recette complète
                    </span>
                  </div>

                  {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Ingrédients manquants:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.missingIngredients.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white text-gray-700 text-xs rounded-lg border border-gray-200"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setStep('capture');
                setDetectedIngredients([]);
                setSuggestedRecipes([]);
                setError('');
              }}
              className="mt-6 w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Scanner d'autres ingrédients
            </button>
          </div>
        )}

        {/* ✅ NEW: Recipe Details Modal */}
        {selectedRecipe && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
              onClick={() => setSelectedRecipe(null)}
            />
            <div className="fixed inset-4 md:inset-10 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl mx-auto animate-slideUp">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-t-2xl text-white relative">
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-3xl font-bold mb-3">{selectedRecipe.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      {selectedRecipe.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {selectedRecipe.prepTime} min
                    </span>
                  </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {/* Nutrition Info */}
                  {selectedRecipe.estimatedCalories > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span>📊</span> Informations nutritionnelles
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedRecipe.estimatedCalories}</div>
                          <div className="text-xs text-gray-600">kcal</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-red-600">{selectedRecipe.estimatedProtein}g</div>
                          <div className="text-xs text-gray-600">Protéines</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-yellow-600">{selectedRecipe.estimatedFat}g</div>
                          <div className="text-xs text-gray-600">Lipides</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedRecipe.estimatedCarbs}g</div>
                          <div className="text-xs text-gray-600">Glucides</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ingredients */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>🥕</span> Ingrédients
                    </h3>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ing, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-gray-800">
                            <strong>{ing.name}</strong> — {ing.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span>👨‍🍳</span> Préparation
                    </h3>
                    <ol className="space-y-3">
                      {selectedRecipe.steps.map((step, index) => (
                        <li key={index} className="flex gap-3 p-4 bg-blue-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 pt-1">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ✅ Loading Recipe Details Overlay */}
        {loadingRecipeDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-700 font-semibold">Chargement de la recette complète...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}