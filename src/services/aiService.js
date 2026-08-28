import { GoogleGenerativeAI } from "@google/generative-ai";

export const getAgriculturalRecommendation = async ({ crop, variety, location, soilType, weather, userQuery }) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("⚠️ No se encontró VITE_GEMINI_API_KEY en el archivo .env");
    return "Error: No se encontró la API Key de Gemini en el archivo .env.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Actualizado al modelo actual recomendado
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const promptText = userQuery 
      ? `Actúa como un agrónomo experto de Guatemala. Responde brevemente a esta duda del agricultor: "${userQuery}". Da recomendaciones prácticas en 2 o 3 párrafos.`
      : `Actúa como agrónomo. Dame un diagnóstico corto para ${crop} en ${location} con clima de ${weather?.temp || 25}°C.`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error detallado al consultar Gemini:", error);
    return `Error de conexión con la IA: ${error.message || "Revisa la consola del navegador."}`;
  }
};