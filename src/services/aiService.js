import { GoogleGenerativeAI } from '@google/generative-ai';

const buildPrompt = ({ crop, variety, location, soilType, weather, userQuery }) => {
  const cropName = crop || 'cultivo';
  const cropVariety = variety || 'variedad general';
  const cropLocation = location || 'Guatemala';
  const soil = soilType || 'suelo general';
  const temp = weather?.temp ?? 25;
  const humidity = weather?.humidity ?? 60;
  const rain = weather?.rain ?? 30;

  if (userQuery) {
    return `Actúa como agrónomo experto en Guatemala. Responde en español y usa este contexto: cultivo=${cropName}, variedad=${cropVariety}, parcela=${cropLocation}, suelo=${soil}, temperatura=${temp}°C, humedad=${humidity}%, probabilidad de lluvia=${rain}%. La pregunta es: "${userQuery}". Da una recomendación práctica, breve, clara y orientativa, evitando diagnósticos definitivos.`;
  }

  return `Actúa como agrónomo experto en Guatemala. Explica cómo afectan las condiciones actuales a ${cropName} en ${cropLocation}. Considera: temperatura ${temp}°C, humedad ${humidity}%, probabilidad de lluvia ${rain}% y suelo ${soil}. Responde en 2 o 3 párrafos con lenguaje orientativo y práctico.`;
};

const getModelCandidates = () => ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export const generateAgriculturalRecommendation = async (context = {}) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('tu_api_key')) {
    return 'La IA de AgroVisión aún no está conectada. Configura VITE_GEMINI_API_KEY en tu entorno para activar recomendaciones contextualizadas con Gemini.';
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const promptText = buildPrompt(context);

    let lastError = null;

    for (const modelName of getModelCandidates()) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptText);
        const response = await result.response;
        return response.text();
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError ?? new Error('No se pudo generar contenido con Gemini.');
  } catch (error) {
    console.error('Error detallado al consultar Gemini:', error);
    return `No pude generar la recomendación en este momento. Revisa la clave de Gemini y la conexión. Detalle: ${error?.message || 'error desconocido'}`;
  }
};

export const askAgroAssistant = async (context = {}) =>
  generateAgriculturalRecommendation(context);

export const analyzeCropImage = async ({ crop, location, notes, imageUrl }) => {
  if (!imageUrl) {
    return 'Sube una fotografía de la planta para obtener un análisis orientativo. Este diagnóstico no reemplaza la evaluación de un profesional agrícola.';
  }

  const cropName = crop || 'cultivo';
  const locationText = location || 'la parcela';
  const noteText = notes ? `Se reporta: ${notes}.` : 'No se registraron observaciones adicionales.';

  return `Análisis orientativo de ${cropName} en ${locationText}: podrían observarse manchas en hojas, cambio de coloración o signos de estrés. Esto podría corresponder a una condición ambiental o a una respuesta del cultivo, por lo que se recomienda verificar la zona afectada y controlar humedad y ventilación. ${noteText} Este análisis es orientativo y no sustituye la evaluación de un profesional agrícola.`;
};

export const getAgriculturalRecommendation = generateAgriculturalRecommendation;
