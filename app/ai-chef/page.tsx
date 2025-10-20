'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRecipes } from '@/hooks/useRecipes';
import Image from 'next/image';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

interface GeneratedRecipe {
  title: string;
  category: string;
  difficulty: string;
  prepTime: number;
  ingredients: { name: string; quantity: string }[];
  steps: string[];
  tags: string[];
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedFat: number;
  estimatedCarbs: number;
  image?: string; // ADD THIS
}

export default function AIChefPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { addRecipe, isOnline } = useRecipes();
  
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);

  const examplePrompts = [
    "Une recette saine et rapide pour le petit-déjeuner",
    "Un plat végétarien italien pour 4 personnes",
    "Un dessert chocolat faible en calories",
    "Une salade d'été rafraîchissante",
    "Un plat protéiné pour sportifs",
    "Une recette facile avec du poulet"
  ];

  // NEW: Fetch food image from Unsplash
  const fetchFoodImage = async (recipeName: string): Promise<string> => {
    if (!UNSPLASH_ACCESS_KEY) {
      console.warn('⚠️ Unsplash API key not configured');
      return '';
    }

    try {
      console.log('🖼️ Fetching image for:', recipeName);
      
      // Search for food-related images
      const searchQuery = `${recipeName} food dish meal`;
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].urls.regular;
        console.log('✅ Image found:', imageUrl);
        return imageUrl;
      } else {
        console.warn('⚠️ No image found, trying generic food search');
        
        // Fallback to generic food image
        const fallbackResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=delicious food dish&per_page=1&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );
        
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          return fallbackData.results[0].urls.regular;
        }
      }
      
      return '';
    } catch (error) {
      console.error('❌ Error fetching image:', error);
      return '';
    }
  };

  const generateRecipe = async () => {
    if (!userPrompt.trim()) {
      setError('Veuillez décrire ce que vous voulez cuisiner');
      return;
    }

    if (!GEMINI_API_KEY) {
      setError('⚠️ API key Gemini non configurée. Ajoutez NEXT_PUBLIC_GEMINI_API_KEY dans votre .env.local');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedRecipe(null);
    setDebugInfo('');

    try {
      console.log('🤖 Initializing Gemini AI...');
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

      const prompt = `Tu es un chef cuisinier expert et nutritionniste. Génère une recette détaillée basée sur cette demande : "${userPrompt}"

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks, sans texte supplémentaire) avec cette structure EXACTE:

{
  "title": "Nom de la recette",
  "category": "Plat principal",
  "difficulty": "Facile",
  "prepTime": 30,
  "ingredients": [
    {"name": "Poulet", "quantity": "200g"},
    {"name": "Riz", "quantity": "150g"}
  ],
  "steps": [
    "Étape 1: Description détaillée",
    "Étape 2: Description détaillée"
  ],
  "tags": ["rapide", "sain"],
  "estimatedCalories": 450,
  "estimatedProtein": 35,
  "estimatedFat": 12,
  "estimatedCarbs": 48
}

RÈGLES STRICTES:
- category doit être: "Entrée", "Plat principal", "Dessert", "Boisson", ou "Snack"
- difficulty doit être: "Facile", "Moyen", ou "Difficile"
- prepTime en minutes (nombre entier)
- Au moins 3 ingrédients avec noms en français et quantités précises
- Au moins 3 étapes détaillées
- Valeurs nutritionnelles réalistes (nombres entiers)
- AUCUN texte avant ou après le JSON
- PAS de backticks, PAS de markdown`;

      console.log(`📤 Sending prompt to ${usedModel}...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      console.log('📥 Raw AI response length:', text.length);
      setDebugInfo(`Model used: ${usedModel}\nResponse length: ${text.length}`);

      // Cleanup
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

      let recipe: GeneratedRecipe;
      try {
        recipe = JSON.parse(text);
        console.log('✅ JSON parsed successfully');
      } catch (parseError: any) {
        console.error('❌ JSON Parse Error:', parseError.message);
        setDebugInfo(`Parse error: ${parseError.message}\nText: ${text.substring(0, 500)}`);
        throw new Error(`Impossible de parser la réponse JSON: ${parseError.message}`);
      }

      // Validate
      const requiredFields = ['title', 'category', 'difficulty', 'prepTime', 'ingredients', 'steps'];
      const missingFields = requiredFields.filter(field => !recipe[field as keyof GeneratedRecipe]);
      
      if (missingFields.length > 0) {
        throw new Error(`Champs manquants: ${missingFields.join(', ')}`);
      }

      if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
        throw new Error('La recette doit contenir au moins un ingrédient');
      }

      if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
        throw new Error('La recette doit contenir au moins une étape');
      }

      // Set defaults
      recipe.estimatedCalories = recipe.estimatedCalories || 0;
      recipe.estimatedProtein = recipe.estimatedProtein || 0;
      recipe.estimatedFat = recipe.estimatedFat || 0;
      recipe.estimatedCarbs = recipe.estimatedCarbs || 0;
      recipe.tags = recipe.tags || [];

      console.log('✅ Recipe generated:', recipe.title);

      // NEW: Fetch image after recipe is generated
      setLoadingImage(true);
      const imageUrl = await fetchFoodImage(recipe.title);
      recipe.image = imageUrl;
      setLoadingImage(false);
      
      if (imageUrl) {
        console.log('🖼️ Image added to recipe');
      } else {
        console.log('⚠️ No image added');
      }
      
      setGeneratedRecipe(recipe);
      setDebugInfo('');
      
    } catch (err: any) {
      console.error('❌ Full error:', err);
      
      let errorMessage = 'Erreur lors de la génération. ';
      
      if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
        errorMessage += '❌ Clé API invalide. Obtenez une nouvelle clé sur https://aistudio.google.com/app/apikey';
      } else if (err.message?.includes('401')) {
        errorMessage += '❌ Clé API non autorisée. Vérifiez votre NEXT_PUBLIC_GEMINI_API_KEY';
      } else if (err.message?.includes('quota') || err.message?.includes('429')) {
        errorMessage += '⏰ Quota API dépassé. Réessayez dans quelques minutes.';
      } else if (err.message?.includes('404') || err.message?.includes('not found')) {
        errorMessage += `🔧 Modèle non trouvé: ${err.message}`;
      } else if (err.message?.includes('parse') || err.message?.includes('JSON')) {
        errorMessage += '📝 Réponse invalide. Réessayez avec une description plus simple.';
      } else {
        errorMessage += err.message || 'Réessayez avec une description différente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingImage(false);
    }
  };

  const saveRecipe = async () => {
    if (!generatedRecipe) return;

    setSaving(true);
    try {
      const recipeData = {
        title: generatedRecipe.title,
        category: generatedRecipe.category,
        difficulty: generatedRecipe.difficulty,
        prepTime: generatedRecipe.prepTime,
        ingredients: generatedRecipe.ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        })),
        steps: generatedRecipe.steps,
        image: generatedRecipe.image || '', // ADD IMAGE
        isFavorite: false,
        isPublic: false,
        tags: generatedRecipe.tags,
      };

      await addRecipe(recipeData);
      router.push('/');
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header - keep as is */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="group flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-all">
              <div className="p-2 rounded-lg group-hover:bg-purple-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span className="font-semibold">Retour</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Chef IA
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block font-medium">
                  Propulsé par Google Gemini
                </p>
              </div>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        {/* Hero Section - keep as is */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform">
            <span className="text-6xl">🤖</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Bonjour <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{session?.user?.name?.split(' ')[0] || 'Chef'}</span> ! 👋
          </h2>
          <p className="text-gray-600 text-lg mb-2">
            Décrivez-moi ce que vous voulez cuisiner et je vais créer une recette parfaite pour vous !
          </p>
          <p className="text-sm text-purple-600 font-semibold">
            ✨ Avec informations nutritionnelles et image automatique
          </p>
        </div>

        {/* API Key Warning */}
        {!GEMINI_API_KEY && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
              <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Configuration requise
              </h3>
              <ol className="space-y-2 text-red-800 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Obtenez une clé API gratuite sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google AI Studio</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Ajoutez <code className="bg-red-100 px-2 py-1 rounded font-mono text-xs">NEXT_PUBLIC_GEMINI_API_KEY=votre_clé</code> dans <code className="bg-red-100 px-2 py-1 rounded font-mono text-xs">.env.local</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>(Optionnel) Pour les images: <code className="bg-red-100 px-2 py-1 rounded font-mono text-xs">NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=votre_clé</code> de <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="underline font-bold">Unsplash</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Redémarrez votre serveur</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Input Section - keep as is */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-200">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">💭</span>
                Décrivez votre recette idéale
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ex: Je veux une recette healthy de pâtes au poulet et légumes pour 2 personnes, rapide à faire"
                rows={4}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none text-base"
                disabled={!GEMINI_API_KEY}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-500 font-medium">
                  💡 Soyez précis pour de meilleurs résultats
                </span>
                <button
                  onClick={generateRecipe}
                  disabled={loading || !userPrompt.trim() || !GEMINI_API_KEY}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {loadingImage ? 'Ajout image...' : 'Génération...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Générer la recette
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Example Prompts */}
          {GEMINI_API_KEY && (
            <div className="mb-8">
              <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span>💡</span>
                Idées pour vous inspirer :
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setUserPrompt(prompt)}
                    disabled={loading}
                    className="px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 mb-6">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-red-800 mb-1">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
                {debugInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer hover:underline">Informations de débogage</summary>
                    <pre className="text-xs bg-red-100 p-2 rounded mt-2 overflow-x-auto">{debugInfo}</pre>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generated Recipe Card WITH IMAGE */}
        {generatedRecipe && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-200">
              {/* Recipe Image - NEW */}
              {generatedRecipe.image && (
                <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={generatedRecipe.image}
                    alt={generatedRecipe.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Title overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h3 className="text-3xl sm:text-4xl font-extrabold mb-3 drop-shadow-lg">
                      {generatedRecipe.title}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold border border-white/30">
                        {generatedRecipe.category}
                      </span>
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold border border-white/30">
                        {generatedRecipe.difficulty}
                      </span>
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-bold flex items-center gap-1 border border-white/30">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {generatedRecipe.prepTime} min
                      </span>
                    </div>
                  </div>
                  
                  {/* AI Badge */}
                  <div className="absolute top-4 right-4 px-4 py-2 bg-purple-500/90 backdrop-blur-md rounded-full text-white text-sm font-bold flex items-center gap-2 shadow-lg border border-white/30">
                    <span className="text-xl">🤖</span>
                    Généré par IA
                  </div>
                </div>
              )}

              {/* Recipe Header (if no image) */}
              {!generatedRecipe.image && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-8 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-3xl font-extrabold mb-3">{generatedRecipe.title}</h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                          {generatedRecipe.category}
                        </span>
                        <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold">
                          {generatedRecipe.difficulty}
                        </span>
                        <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {generatedRecipe.prepTime} min
                        </span>
                      </div>
                    </div>
                    <div className="text-5xl">🤖</div>
                  </div>

                  {/* Tags */}
                  {generatedRecipe.tags && generatedRecipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {generatedRecipe.tags.map((tag, index) => (
                        <span key={index} className="text-xs px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tags (if image exists) */}
              {generatedRecipe.image && generatedRecipe.tags && generatedRecipe.tags.length > 0 && (
                <div className="px-8 pt-6 flex flex-wrap gap-2">
                  {generatedRecipe.tags.map((tag, index) => (
                    <span key={index} className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Nutrition Info */}
              {(generatedRecipe.estimatedCalories > 0 || generatedRecipe.estimatedProtein > 0) && (
                <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Informations nutritionnelles (estimées par l'IA)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-orange-200">
                      <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {generatedRecipe.estimatedCalories}
                      </div>
                      <div className="text-xs text-gray-600 font-bold uppercase mt-1">Calories</div>
                      <div className="text-xs text-gray-500">kcal</div>
                      <div className="mt-1 text-xl">🔥</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-red-200">
                      <div className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                        {generatedRecipe.estimatedProtein}
                      </div>
                      <div className="text-xs text-gray-600 font-bold uppercase mt-1">Protéines</div>
                      <div className="text-xs text-gray-500">g</div>
                      <div className="mt-1 text-xl">🥩</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-yellow-200">
                      <div className="text-3xl font-extrabold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                        {generatedRecipe.estimatedFat}
                      </div>
                      <div className="text-xs text-gray-600 font-bold uppercase mt-1">Lipides</div>
                      <div className="text-xs text-gray-500">g</div>
                      <div className="mt-1 text-xl">🧈</div>
                    </div>

                    <div className="bg-white rounded-xl p-4 text-center shadow-md border-2 border-blue-200">
                      <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {generatedRecipe.estimatedCarbs}
                      </div>
                      <div className="text-xs text-gray-600 font-bold uppercase mt-1">Glucides</div>
                      <div className="text-xs text-gray-500">g</div>
                      <div className="mt-1 text-xl">🍞</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Ingredients */}
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🥕</span>
                    Ingrédients
                  </h4>
                  <ul className="space-y-3">
                    {generatedRecipe.ingredients.map((ing, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                        <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="text-gray-800">
                          <strong className="font-bold">{ing.name}</strong>
                          <span className="text-gray-600"> — {ing.quantity}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="mb-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👨‍🍳</span>
                    Préparation
                  </h4>
                  <ol className="space-y-4">
                    {generatedRecipe.steps.map((step, index) => (
                      <li key={index} className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-md">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 pt-2 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={saveRecipe}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Sauvegarder cette recette
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setGeneratedRecipe(null);
                      setUserPrompt('');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Générer une autre recette
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner */}
        {!generatedRecipe && !loading && GEMINI_API_KEY && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-6">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">💡</span>
                Comment ça marche ?
              </h3>
              <ul className="space-y-2 text-purple-800">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Décrivez ce que vous voulez cuisiner (ingrédients, type de plat, niveau de difficulté, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>L'IA génère une recette complète avec ingrédients, étapes et informations nutritionnelles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Une belle image est automatiquement ajoutée à votre recette 📸</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Sauvegardez la recette dans votre collection personnelle</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}