import React, { useState, useEffect } from 'react';
import { getAgriculturalRecommendation } from './services/aiService';
import { getRealTimeWeather } from './services/weatherService';

const fallbackWeather = {
  temp: 20,
  humidity: 75,
  condition: 'Nublado parcial',
  forecast: 'Información local no disponible',
  rain: 60,
  wind: 0,
  uv: 5,
  source: 'fallback'
};

const guatemalaRegions = [
  ['Alta Verapaz', 15.47, -90.37],
  ['Baja Verapaz', 15.10, -90.31],
  ['Chimaltenango', 14.66, -90.82],
  ['Chiquimula', 14.80, -89.54],
  ['El Progreso', 14.85, -90.07],
  ['Escuintla', 14.30, -90.79],
  ['Guatemala', 14.63, -90.51],
  ['Huehuetenango', 15.32, -91.47],
  ['Izabal', 15.73, -88.59],
  ['Jalapa', 14.63, -89.99],
  ['Jutiapa', 14.29, -89.90],
  ['Petén', 16.93, -89.89],
  ['Quetzaltenango', 14.83, -91.52],
  ['Quiché', 15.03, -91.15],
  ['Retalhuleu', 14.54, -91.68],
  ['Sacatepéquez', 14.56, -90.73],
  ['San Marcos', 14.96, -91.80],
  ['Santa Rosa', 14.28, -90.30],
  ['Sololá', 14.77, -91.18],
  ['Suchitepéquez', 14.53, -91.50],
  ['Totonicapán', 14.91, -91.36],
  ['Zacapa', 14.97, -89.53]
].map(([name, lat, lon]) => ({ name, lat, lon }));

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');

  // =========================
  // PERFIL
  // =========================
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('agro_profile');

    return saved
      ? JSON.parse(saved)
      : {
          name: 'Eddy Cano',
          location: 'Chimaltenango',
          department: 'Chimaltenango',
          phone: '+502 5555-4444'
        };
  });

  // =========================
  // CULTIVOS
  // =========================
  const [crops, setCrops] = useState(() => {
    const saved = localStorage.getItem('agro_vision_crops');

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            name: 'Maíz',
            variety: 'ICTA B-7',
            location: 'Chimaltenango',
            plantingDate: '2026-05-10',
            harvestDate: '2026-10-15',
            soilType: 'Franco-Arcilloso',
            harvestStatus: 'En crecimiento',
            harvestQuantity: '',
            harvestUnit: 'kg',
            notes: 'Fertilización inicial con fórmula 15-15-15.'
          }
        ];
  });

  const [cropForm, setCropForm] = useState({
    name: '',
    variety: '',
    location: profile.location || 'Chimaltenango',
    plantingDate: new Date().toISOString().split('T')[0],
    harvestDate: '',
    soilType: 'Franco',
    harvestStatus: 'En crecimiento',
    harvestQuantity: '',
    harvestUnit: 'kg',
    notes: ''
  });

  // =========================
  // CLIMA
  // =========================
  const [currentLocation, setCurrentLocation] = useState(
    profile.location || 'Chimaltenango'
  );

  const [weatherData, setWeatherData] = useState(fallbackWeather);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    let ignoreResult = false;

    const loadWeather = async () => {
      setWeatherLoading(true);
      const region = guatemalaRegions.find(
        (item) => item.name === currentLocation
      );

      const realWeather = await getRealTimeWeather(region || currentLocation);

      if (!ignoreResult) {
        setWeatherData({
          ...fallbackWeather,
          temp: realWeather.temp,
          humidity: realWeather.humidity,
          condition: realWeather.description,
          forecast: realWeather.forecast,
          rain: realWeather.rainProb,
          wind: realWeather.windSpeed,
          uv: realWeather.uv ?? fallbackWeather.uv,
          source: realWeather.source
        });
        setWeatherLoading(false);
      }
    };

    loadWeather();

    return () => {
      ignoreResult = true;
    };
  }, [currentLocation]);

  // =========================
  // IA
  // =========================
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '¡Hola! Soy AgroAsistente IA 🌱. Puedo ayudarte con cultivos, clima, plagas, riego y fertilización.'
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================
  // PERSISTENCIA
  // =========================
  useEffect(() => {
    localStorage.setItem(
      'agro_vision_crops',
      JSON.stringify(crops)
    );
  }, [crops]);

  useEffect(() => {
    localStorage.setItem(
      'agro_profile',
      JSON.stringify(profile)
    );
  }, [profile]);

  // =========================
  // ALERTAS
  // =========================
  const getAlerts = () => {
    const list = [];

    if (weatherData.humidity >= 80) {
      list.push({
        id: 'humidity',
        type: 'danger',
        icon: '💧',
        title: 'Riesgo por humedad elevada',
        msg: `La humedad en ${currentLocation} alcanza ${weatherData.humidity}%. Vigila la aparición de hongos en hojas y tallos.`
      });
    }

    if (weatherData.rain >= 70) {
      list.push({
        id: 'rain',
        type: 'warning',
        icon: '🌧️',
        title: 'Lluvia prevista',
        msg: 'Evita realizar riego adicional y revisa el drenaje de tus parcelas.'
      });
    }

    if (weatherData.temp >= 30) {
      list.push({
        id: 'heat',
        type: 'warning',
        icon: '☀️',
        title: 'Temperatura elevada',
        msg: 'Existe riesgo de estrés térmico. Revisa la humedad del suelo.'
      });
    }

    crops.forEach((crop) => {
      list.push({
        id: `crop-${crop.id}`,
        type: 'info',
        icon: '🌱',
        title: `${crop.name} bajo monitoreo`,
        msg: `Variedad ${crop.variety || 'no especificada'}. Cosecha estimada: ${crop.harvestDate || 'pendiente'}.`
      });
    });

    return list;
  };

  const alerts = getAlerts();

  // =========================
  // RECOMENDACIÓN AUTOMÁTICA
  // =========================
  const getSmartRecommendation = () => {
    if (weatherData.humidity >= 80 && weatherData.rain >= 60) {
      return {
        title: 'Prioridad: proteger tus cultivos',
        text: 'La combinación de humedad elevada y lluvia prevista aumenta el riesgo de problemas por exceso de humedad. Revisa drenajes y evita riegos innecesarios.',
        icon: '🌧️'
      };
    }

    if (weatherData.temp >= 30) {
      return {
        title: 'Prioridad: controlar el estrés térmico',
        text: 'Las temperaturas son elevadas. Revisa la humedad del suelo y programa el riego en las horas de menor evaporación.',
        icon: '☀️'
      };
    }

    return {
      title: 'Condiciones favorables',
      text: 'Continúa monitoreando tus cultivos y registra cualquier cambio para mejorar las recomendaciones de AgroVisión.',
      icon: '🌱'
    };
  };

  const recommendation = getSmartRecommendation();

  const getCropStatus = (crop) => crop.harvestStatus || 'En crecimiento';

  // =========================
  // GUARDAR CULTIVO
  // =========================
  const handleSaveCrop = (e) => {
    e.preventDefault();

    if (!cropForm.name.trim()) return;

    const newEntry = {
      id: Date.now(),
      ...cropForm
    };

    setCrops([newEntry, ...crops]);

    setCropForm({
      name: '',
      variety: '',
      location: currentLocation,
      plantingDate: new Date().toISOString().split('T')[0],
      harvestDate: '',
      soilType: 'Franco',
      harvestStatus: 'En crecimiento',
      harvestQuantity: '',
      harvestUnit: 'kg',
      notes: ''
    });

    setActiveTab('cultivos');
  };

  // =========================
  // GEMINI
  // =========================
  const handleSendMessage = async (e, forcedQuestion = null) => {
    if (e) e.preventDefault();

    const userText = forcedQuestion || inputQuery;

    if (!userText.trim() || loading) return;

    setInputQuery('');

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userText
      }
    ]);

    setLoading(true);

    const activeCrop = crops[0] || {
      name: 'Maíz',
      variety: 'General',
      location: currentLocation,
      soilType: 'Franco'
    };

    try {
      const aiResponseText =
        await getAgriculturalRecommendation({
          crop: activeCrop.name,
          variety: activeCrop.variety,
          location: activeCrop.location,
          soilType: activeCrop.soilType || 'Franco',
          weather: weatherData,
          userQuery: userText
        });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiResponseText
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'No pude procesar la consulta en este momento. Revisa tu conexión e inténtalo nuevamente.'
        }
      ]);
    }

    setLoading(false);
  };

  // =========================
  // CAMBIAR UBICACIÓN
  // =========================
  const handleLocationChange = (location) => {
    setCurrentLocation(location);

    setProfile((prev) => ({
      ...prev,
      location
    }));
  };

  // =========================
  // NAVEGACIÓN
  // =========================
  const navItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: '⌂'
    },
    {
      id: 'clima',
      label: 'Clima',
      icon: '☀'
    },
    {
      id: 'cultivos',
      label: 'Cultivos',
      icon: '🌱'
    },
    {
      id: 'alertas',
      label: 'Alertas',
      icon: '⚠'
    },
    {
      id: 'plagas',
      label: 'Agro IA',
      icon: '✦'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-slate-800 font-sans">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

          <button
            onClick={() => setActiveTab('inicio')}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-sm">
              <span className="text-xl">🌱</span>
            </div>

            <div className="text-left">
              <h1 className="font-extrabold text-emerald-900 tracking-tight">
                AgroVisión <span className="text-emerald-600">GT</span>
              </h1>

              <p className="hidden sm:block text-[10px] text-slate-500">
                Agricultura inteligente
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setActiveTab('alertas')}
              className="relative w-10 h-10 rounded-xl bg-slate-100 hover:bg-emerald-50 transition flex items-center justify-center"
            >
              <span>🔔</span>

              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>

            <select
              value={currentLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="hidden sm:block bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none"
            >
              {guatemalaRegions.map((region) => (
                <option key={region.name}>{region.name}</option>
              ))}
            </select>

            <button
              onClick={() => setActiveTab('perfil')}
              className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center"
            >
              {profile.name.charAt(0)}
            </button>

          </div>
        </div>
      </header>

      {/* ================= CONTENIDO ================= */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">

        {/* ================= INICIO ================= */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">

            {/* HERO */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 text-white p-6 sm:p-8 shadow-xl">

              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -right-20 bottom-0 w-52 h-52 bg-white/5 rounded-full" />

              <div className="relative max-w-2xl">

                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-xs mb-4">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                  AgroVisión activa
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Buenos días, {profile.name.split(' ')[0]} 👋
                </h2>

                <p className="mt-2 text-emerald-100 text-sm sm:text-base max-w-xl">
                  Tu información agrícola en un solo lugar para ayudarte a tomar mejores decisiones y proteger tus cultivos.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">

                  <button
                    onClick={() => setActiveTab('plagas')}
                    className="bg-white text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shadow"
                  >
                    ✦ Consultar Agro IA
                  </button>

                  <button
                    onClick={() => setActiveTab('cultivos')}
                    className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/20 transition"
                  >
                    + Registrar cultivo
                  </button>

                </div>
              </div>
            </section>

            {/* RESUMEN */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Temperatura
                </p>

                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-extrabold text-slate-800">
                    {weatherData.temp}°
                  </p>
                  <span className="text-xl">🌤️</span>
                </div>

                <p className="text-[10px] text-slate-500 mt-1">
                  {weatherData.condition}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Humedad
                </p>

                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-extrabold text-slate-800">
                    {weatherData.humidity}%
                  </p>
                  <span className="text-xl">💧</span>
                </div>

                <p className="text-[10px] text-slate-500 mt-1">
                  Condición del ambiente
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Lluvia
                </p>

                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-extrabold text-slate-800">
                    {weatherData.rain}%
                  </p>
                  <span className="text-xl">🌧️</span>
                </div>

                <p className="text-[10px] text-slate-500 mt-1">
                  Probabilidad estimada
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Cultivos
                </p>

                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-extrabold text-slate-800">
                    {crops.length}
                  </p>
                  <span className="text-xl">🌱</span>
                </div>

                <p className="text-[10px] text-slate-500 mt-1">
                  Bajo monitoreo
                </p>
              </div>

            </section>

            {/* GRID PRINCIPAL */}
            <section className="grid lg:grid-cols-3 gap-5">

              {/* CLIMA */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                <div className="p-5 flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                      Monitor climático
                    </p>

                    <h3 className="font-extrabold text-xl mt-1">
                      {currentLocation}
                    </h3>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {weatherLoading ? 'Actualizando clima...' : weatherData.source === 'openweather' ? 'Datos en tiempo real' : 'Datos de respaldo'}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('clima')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Ver detalles →
                  </button>

                </div>

                <div className="mx-5 mb-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-5">

                  <div className="flex justify-between items-start">

                    <div>
                      <p className="text-xs text-emerald-200">
                        Condición actual
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-5xl font-black">
                          {weatherData.temp}°
                        </span>

                        <div>
                          <p className="font-semibold">
                            {weatherData.condition}
                          </p>
                          <p className="text-xs text-slate-300">
                            {weatherData.forecast}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span className="text-4xl">🌦️</span>

                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">

                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-[9px] text-slate-300">
                        HUMEDAD
                      </p>
                      <p className="font-bold mt-1">
                        {weatherData.humidity}%
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-[9px] text-slate-300">
                        LLUVIA
                      </p>
                      <p className="font-bold mt-1">
                        {weatherData.rain}%
                      </p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-[9px] text-slate-300">
                        VIENTO
                      </p>
                      <p className="font-bold mt-1">
                        {weatherData.wind} km/h
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* ALERTA */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">

                <div className="flex justify-between items-center">

                  <div>
                    <p className="text-[10px] uppercase font-bold text-red-500">
                      Atención
                    </p>

                    <h3 className="font-extrabold text-lg mt-1">
                      Alertas
                    </h3>
                  </div>

                  <span className="bg-red-50 text-red-600 w-9 h-9 rounded-xl flex items-center justify-center">
                    ⚠️
                  </span>

                </div>

                <div className="mt-5 space-y-3">

                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex gap-2">
                        <span>{alert.icon}</span>

                        <div>
                          <p className="text-xs font-bold">
                            {alert.title}
                          </p>

                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                            {alert.msg}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {alerts.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No tienes alertas activas.
                    </p>
                  )}

                </div>

                <button
                  onClick={() => setActiveTab('alertas')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Ver todas las alertas
                </button>

              </div>

            </section>

            {/* RECOMENDACIÓN IA */}
            <section className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 sm:p-6">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl shrink-0">
                  🤖
                </div>

                <div className="flex-1">

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                      Recomendación inteligente
                    </p>

                    <span className="text-[9px] bg-white text-emerald-700 border border-emerald-100 px-2 py-1 rounded-full font-bold">
                      Agro IA
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg mt-1">
                    {recommendation.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {recommendation.text}
                  </p>

                  <button
                    onClick={() =>
                      handleSendMessage(
                        null,
                        'Analiza las condiciones actuales de mis cultivos y dime qué debería hacer hoy.'
                      )
                    }
                    className="mt-4 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    Consultar a Agro IA →
                  </button>

                </div>

              </div>

            </section>

            {/* CULTIVOS */}
            <section>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600">
                    Monitoreo
                  </p>

                  <h3 className="text-xl font-extrabold">
                    Mis cultivos
                  </h3>
                </div>

                <button
                  onClick={() => setActiveTab('cultivos')}
                  className="text-xs font-bold text-emerald-700"
                >
                  Ver todos →
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {crops.slice(0, 3).map((crop) => (
                  <div
                    key={crop.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                  >

                    <div className="flex justify-between">

                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">
                        🌽
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full h-fit ${
                        getCropStatus(crop) === 'Cosechado'
                          ? 'bg-sky-50 text-sky-700'
                          : getCropStatus(crop) === 'Pendiente de cosecha'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {getCropStatus(crop).toUpperCase()}
                      </span>

                    </div>

                    <h4 className="font-extrabold mt-3">
                      {crop.name}
                    </h4>

                    <p className="text-[10px] text-slate-500">
                      {crop.variety || 'Variedad no registrada'}
                    </p>

                    <div className="mt-4 flex justify-between text-[10px]">
                      <span className="text-slate-400">
                        Siembra
                      </span>

                      <span className="font-semibold">
                        {crop.plantingDate}
                      </span>
                    </div>

                  </div>
                ))}

                <button
                  onClick={() => setActiveTab('cultivos')}
                  className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition min-h-[150px]"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs font-bold mt-1">
                    Registrar cultivo
                  </span>
                </button>

              </div>

            </section>

          </div>
        )}

        {/* ================= CLIMA ================= */}
        {activeTab === 'clima' && (
          <div className="max-w-4xl mx-auto space-y-5">

            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">
                Monitor climático
              </p>
              <h2 className="text-2xl font-extrabold mt-1">
                Clima de {currentLocation}
              </h2>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-emerald-200 text-sm">
                    Condición actual
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-6xl font-black">
                      {weatherData.temp}°
                    </span>

                    <div>
                      <p className="font-bold">
                        {weatherData.condition}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        {weatherData.forecast}
                      </p>
                    </div>
                  </div>
                </div>

                <span className="text-5xl">🌦️</span>

              </div>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

              {[
                ['💧', 'Humedad', `${weatherData.humidity}%`],
                ['🌧️', 'Lluvia', `${weatherData.rain}%`],
                ['💨', 'Viento', `${weatherData.wind} km/h`],
                ['☀️', 'Índice UV', weatherData.uv]
              ].map(([icon, label, value]) => (
                <div
                  key={label}
                  className="bg-white border border-slate-200 rounded-2xl p-4"
                >
                  <span>{icon}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-3">
                    {label}
                  </p>
                  <p className="text-xl font-extrabold mt-1">
                    {value}
                  </p>
                </div>
              ))}

            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5">

              <p className="text-[10px] uppercase font-bold text-emerald-600">
                Impacto agrícola
              </p>

              <h3 className="font-extrabold text-lg mt-1">
                ¿Qué significa el clima para tus cultivos?
              </h3>

              <div className="mt-4 bg-emerald-50 rounded-2xl p-4">

                <p className="font-bold text-emerald-900 text-sm">
                  {recommendation.icon} {recommendation.title}
                </p>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {recommendation.text}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================= IA ================= */}
        {activeTab === 'plagas' && (
          <div className="max-w-3xl mx-auto">

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

              <div className="bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-5">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center text-xl">
                    🤖
                  </div>

                  <div>
                    <h2 className="font-extrabold">
                      AgroAsistente IA
                    </h2>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 bg-emerald-300 rounded-full" />
                      <span className="text-[10px] text-emerald-100">
                        Asistente agrícola disponible
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              <div className="p-4 sm:p-6">

                {/* ACCIONES RÁPIDAS */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">

                  {[
                    '¿Necesito regar hoy?',
                    '¿Cómo protejo mi cultivo?',
                    '¿Qué señales de plaga debo revisar?'
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() =>
                        handleSendMessage(null, question)
                      }
                      className="text-left p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      ✦ {question}
                    </button>
                  ))}

                </div>

                {/* MENSAJES */}

                <div className="min-h-[380px] max-h-[500px] overflow-y-auto space-y-3 pr-1">

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.sender === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          message.sender === 'user'
                            ? 'bg-emerald-700 text-white rounded-br-md'
                            : 'bg-slate-100 text-slate-700 rounded-bl-md'
                        }`}
                      >
                        {message.text}
                      </div>

                    </div>
                  ))}

                  {loading && (
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 text-xs text-emerald-700 w-fit">
                      🤖 Analizando información agrícola...
                    </div>
                  )}

                </div>

                {/* INPUT */}

                <form
                  onSubmit={handleSendMessage}
                  className="mt-4 flex gap-2 border border-slate-200 rounded-2xl p-2 bg-slate-50"
                >

                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) =>
                      setInputQuery(e.target.value)
                    }
                    placeholder="Pregúntale algo a Agro IA..."
                    className="flex-1 bg-transparent outline-none text-xs px-2"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Enviar
                  </button>

                </form>

              </div>

            </div>

          </div>
        )}

        {/* ================= CULTIVOS ================= */}
        {activeTab === 'cultivos' && (
          <div className="max-w-5xl mx-auto space-y-5">

            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">
                Gestión agrícola
              </p>

              <h2 className="text-2xl font-extrabold">
                Mis cultivos
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Registra y monitorea las cosechas de tu parcela.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">

              {/* FORMULARIO */}

              <form
                onSubmit={handleSaveCrop}
                className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 h-fit"
              >

                <div>
                  <h3 className="font-extrabold">
                    Nuevo cultivo
                  </h3>

                  <p className="text-[10px] text-slate-400 mt-1">
                    Agrega información para mejorar las recomendaciones.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Nombre del cultivo"
                  value={cropForm.name}
                  onChange={(e) =>
                    setCropForm({
                      ...cropForm,
                      name: e.target.value
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-emerald-500"
                  required
                />

                <input
                  type="text"
                  placeholder="Variedad"
                  value={cropForm.variety}
                  onChange={(e) =>
                    setCropForm({
                      ...cropForm,
                      variety: e.target.value
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-2 gap-2">

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Siembra
                    </label>

                    <input
                      type="date"
                      value={cropForm.plantingDate}
                      onChange={(e) =>
                        setCropForm({
                          ...cropForm,
                          plantingDate: e.target.value
                        })
                      }
                      className="w-full mt-1 border border-slate-200 rounded-xl px-2 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Cosecha
                    </label>

                    <input
                      type="date"
                      value={cropForm.harvestDate}
                      onChange={(e) =>
                        setCropForm({
                          ...cropForm,
                          harvestDate: e.target.value
                        })
                      }
                      className="w-full mt-1 border border-slate-200 rounded-xl px-2 py-2.5 text-xs"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Estado
                    </label>
                    <select
                      value={cropForm.harvestStatus}
                      onChange={(e) =>
                        setCropForm({
                          ...cropForm,
                          harvestStatus: e.target.value
                        })
                      }
                      className="w-full mt-1 border border-slate-200 rounded-xl px-2 py-2.5 text-xs bg-white"
                    >
                      <option>En crecimiento</option>
                      <option>Pendiente de cosecha</option>
                      <option>Cosechado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">
                      Cantidad
                    </label>
                    <div className="flex mt-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={cropForm.harvestQuantity}
                        onChange={(e) =>
                          setCropForm({
                            ...cropForm,
                            harvestQuantity: e.target.value
                          })
                        }
                        className="w-full min-w-0 border border-slate-200 rounded-l-xl px-2 py-2.5 text-xs"
                      />
                      <select
                        value={cropForm.harvestUnit}
                        onChange={(e) =>
                          setCropForm({
                            ...cropForm,
                            harvestUnit: e.target.value
                          })
                        }
                        className="border-y border-r border-slate-200 rounded-r-xl px-1 text-xs bg-white"
                      >
                        <option>kg</option>
                        <option>qq</option>
                        <option>lb</option>
                        <option>cajas</option>
                      </select>
                    </div>
                  </div>
                </div>

                <textarea
                  placeholder="Notas del cultivo..."
                  value={cropForm.notes}
                  onChange={(e) =>
                    setCropForm({
                      ...cropForm,
                      notes: e.target.value
                    })
                  }
                  rows="3"
                  className="w-full border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-emerald-500"
                />

                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 text-xs font-bold transition"
                >
                  + Guardar cultivo
                </button>

              </form>

              {/* LISTA */}

              <div className="lg:col-span-2 space-y-3">

                {crops.map((crop) => (
                  <div
                    key={crop.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
                  >

                    <div className="flex justify-between items-start">

                      <div className="flex gap-3">

                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
                          🌽
                        </div>

                        <div>
                          <h3 className="font-extrabold">
                            {crop.name}
                          </h3>

                          <p className="text-xs text-slate-500">
                            {crop.variety || 'Variedad no registrada'}
                          </p>

                          <p className="text-[10px] text-slate-400 mt-1">
                            📍 {crop.location}
                          </p>
                        </div>

                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                        getCropStatus(crop) === 'Cosechado'
                          ? 'bg-sky-50 text-sky-700'
                          : getCropStatus(crop) === 'Pendiente de cosecha'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {getCropStatus(crop).toUpperCase()}
                      </span>

                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold">
                          SIEMBRA
                        </p>
                        <p className="text-xs font-bold mt-1">
                          {crop.plantingDate}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold">
                          COSECHA
                        </p>
                        <p className="text-xs font-bold mt-1">
                          {crop.harvestDate || 'Pendiente'}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold">
                          SUELO
                        </p>
                        <p className="text-xs font-bold mt-1">
                          {crop.soilType}
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[9px] text-slate-400 font-bold">
                          PRODUCCIÓN
                        </p>
                        <p className="text-xs font-bold mt-1">
                          {crop.harvestQuantity
                            ? `${crop.harvestQuantity} ${crop.harvestUnit || 'kg'}`
                            : 'Sin registrar'}
                        </p>
                      </div>

                    </div>

                    <div className="flex justify-end mt-4">

                      <button
                        onClick={() =>
                          setCrops(
                            crops.filter(
                              (item) => item.id !== crop.id
                            )
                          )
                        }
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Eliminar cultivo
                      </button>

                    </div>

                  </div>
                ))}

              </div>

            </div>

          </div>
        )}

        {/* ================= ALERTAS ================= */}
        {activeTab === 'alertas' && (
          <div className="max-w-4xl mx-auto space-y-5">

            <div>
              <p className="text-[10px] uppercase font-bold text-red-500">
                Centro de prevención
              </p>

              <h2 className="text-2xl font-extrabold">
                Alertas agrícolas
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Información para ayudarte a actuar antes de que ocurra un problema.
              </p>
            </div>

            <div className="space-y-3">

              {alerts.map((alert) => {

                const styles =
                  alert.type === 'danger'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : alert.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900';

                return (
                  <div
                    key={alert.id}
                    className={`rounded-3xl border p-5 ${styles}`}
                  >

                    <div className="flex gap-4">

                      <div className="w-11 h-11 rounded-2xl bg-white/70 flex items-center justify-center text-xl shrink-0">
                        {alert.icon}
                      </div>

                      <div>
                        <p className="font-extrabold text-sm">
                          {alert.title}
                        </p>

                        <p className="text-xs mt-2 leading-relaxed opacity-80">
                          {alert.msg}
                        </p>
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* ================= PERFIL ================= */}
        {activeTab === 'perfil' && (
          <div className="max-w-2xl mx-auto space-y-5">

            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-600">
                Cuenta
              </p>

              <h2 className="text-2xl font-extrabold">
                Mi perfil
              </h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">

              <div className="flex items-center gap-4">

                <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center text-2xl font-extrabold">
                  {profile.name.charAt(0)}
                </div>

                <div>
                  <h3 className="font-extrabold">
                    {profile.name}
                  </h3>

                  <p className="text-xs text-slate-500">
                    Agricultor registrado
                  </p>
                </div>

              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">
                  Nombre completo
                </label>

                <input
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value
                    })
                  }
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">
                  Ubicación
                </label>

                <input
                  value={profile.location}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      location: e.target.value
                    })
                  }
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">
                  Teléfono
                </label>

                <input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone: e.target.value
                    })
                  }
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[10px] text-emerald-800">
                ✓ Tu información se guarda automáticamente en este dispositivo.
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ================= NAVBAR ================= */}

      <nav className="fixed bottom-0 left-0 right-0 z-50">

        <div className="max-w-2xl mx-auto px-3 pb-3">

          <div className="bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-2xl px-2 py-2 flex justify-around">

            {navItems.map((item) => (

              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 px-3 sm:px-5 py-2 rounded-xl transition ${
                  activeTab === item.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >

                <span className="text-lg leading-none">
                  {item.icon}
                </span>

                <span className="text-[9px] font-bold">
                  {item.label}
                </span>

                {activeTab === item.id && (
                  <span className="absolute bottom-0 w-5 h-0.5 bg-emerald-600 rounded-full" />
                )}

              </button>

            ))}

          </div>

        </div>

      </nav>

    </div>
  );
}