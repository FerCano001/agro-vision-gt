// Servicio para obtener el clima real de municipios/departamentos de Guatemala
export const getRealTimeWeather = async (locationName) => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const locationQuery = typeof locationName === "object"
    ? `lat=${locationName.lat}&lon=${locationName.lon}`
    : `q=${encodeURIComponent(locationName)},GT`;
  
  if (!apiKey || apiKey.includes("tu_api_key")) {
    console.warn("⚠️ API Key de OpenWeather no configurada. Retornando clima base.");
    return {
      temp: 20,
      humidity: 75,
      description: "Nublado parcial",
      forecast: "Configura OpenWeather para ver datos en tiempo real",
      windSpeed: 0,
      rainProb: 60,
      uv: null,
      source: "fallback"
    };
  }

  try {
    const [response, forecastResponse] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?${locationQuery}&units=metric&lang=es&appid=${apiKey}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?${locationQuery}&units=metric&lang=es&appid=${apiKey}`
      )
    ]);
    
    if (!response.ok) throw new Error("Error al consultar el clima real.");
    if (!forecastResponse.ok) throw new Error("Error al consultar el pronóstico.");
    
    const data = await response.json();
    const forecastData = await forecastResponse.json();
    const nextForecast = forecastData.list?.[0];

    return {
      temp: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      forecast: nextForecast?.weather?.[0]?.description || "Sin pronóstico disponible",
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6),
      rainProb: Math.round((nextForecast?.pop || 0) * 100),
      uv: null,
      source: "openweather"
    };
  } catch (error) {
    console.error("Error en weatherService:", error);
    return {
      temp: 19,
      humidity: 70,
      description: "Información local no disponible",
      forecast: "No se pudo consultar el pronóstico",
      windSpeed: 0,
      rainProb: 50,
      uv: null,
      source: "fallback"
    };
  }
};