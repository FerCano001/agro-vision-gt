import React, { useState, useEffect } from 'react';
import { getAgriculturalRecommendation } from './services/aiService';

export default function App() {
  // Navegación: 'inicio', 'clima', 'plagas', 'cultivos', 'alertas', 'perfil', 'recomendaciones'
  const [activeTab, setActiveTab] = useState('inicio');

  // Perfil del Agricultor (Persistente)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('agro_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Eddy Cano',
      location: 'Chimaltenango',
      department: 'Chimaltenango',
      phone: '+502 5555-4444'
    };
  });

  // Base de datos de Cultivos (Persistente)
  const [crops, setCrops] = useState(() => {
    const saved = localStorage.getItem('agro_vision_crops');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        name: 'Maíz',
        variety: 'ICTA B-7',
        location: 'Chimaltenango',
        plantingDate: '2026-05-10',
        harvestDate: '2026-10-15',
        soilType: 'Franco-Arcilloso',
        notes: 'Fertilización inicial con fórmula 15-15-15.'
      }
    ];
  });

  // Estado Formulario Nuevo Cultivo
  const [cropForm, setCropForm] = useState({
    name: '',
    variety: '',
    location: profile.location || 'Chimaltenango',
    plantingDate: new Date().toISOString().split('T')[0],
    harvestDate: '',
    soilType: 'Franco',
    notes: ''
  });

  // Datos de Clima Dinámicos por Departamentos/Municipios de GT
  const climates = {
    'Chimaltenango': { temp: 19, humidity: 82, condition: 'Humedad alta / Neblina', forecast: 'Lluvias moderadas por la tarde' },
    'Quetzaltenango': { temp: 14, humidity: 88, condition: 'Frío y húmedo', forecast: 'Heladas matutinas' },
    'Escuintla': { temp: 31, humidity: 68, condition: 'Cálido y soleado', forecast: 'Alta radiación solar' },
    'Guatemala': { temp: 23, humidity: 65, condition: 'Templado', forecast: 'Parcialmente nublado' },
    'Huehuetenango': { temp: 17, humidity: 75, condition: 'Templado / Frío', forecast: 'Vientos moderados' }
  };

  const [currentLocation, setCurrentLocation] = useState(profile.location || 'Chimaltenango');
  const weatherData = climates[currentLocation] || climates['Chimaltenango'];

  // Estado del Chat IA con Gemini
  const [messages, setMessages] = useState([
    { sender: 'ai', text: '¡Hola! Soy tu Asistente Agronómico IA. ¿Qué duda tenés sobre tus cultivos, plagas o fertilización?' }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Guardar en localStorage cada cambio
  useEffect(() => {
    localStorage.setItem('agro_vision_crops', JSON.stringify(crops));
  }, [crops]);

  useEffect(() => {
    localStorage.setItem('agro_profile', JSON.stringify(profile));
  }, [profile]);

  // Agregar Cultivo
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
      notes: ''
    });
    alert('¡Cultivo y fechas guardados en la bitácora!');
    setActiveTab('cultivos');
  };

  // Enviar mensaje al Chat de Gemini
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery;
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    const activeCrop = crops[0] || { name: 'Maíz', variety: 'General', location: currentLocation };

    const aiResponseText = await getAgriculturalRecommendation({
      crop: activeCrop.name,
      variety: activeCrop.variety,
      location: activeCrop.location,
      soilType: activeCrop.soilType || 'Franco',
      weather: weatherData,
      userQuery: userText
    });

    setMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
    setLoading(false);
  };

  // Generador de Alertas Automáticas Inteligentes
  const getAlerts = () => {
    let list = [];
    if (weatherData.humidity > 80) {
      list.push({
        id: 'h1',
        type: 'danger',
        title: `⚠️ Alerta de Hongos (Humedad ${weatherData.humidity}%)`,
        msg: `En ${currentLocation} hay alta humedad. Monitorear Tizón o Rancha en tus cultivos.`
      });
    }
    if (weatherData.temp > 30) {
      list.push({
        id: 't1',
        type: 'warning',
        title: `☀️ Alerta de Estrés Térmico (${weatherData.temp}°C)`,
        msg: `Temperaturas elevadas en ${currentLocation}. Aumentar la frecuencia de riego.`
      });
    }
    crops.forEach(c => {
      list.push({
        id: c.id,
        type: 'info',
        title: `🌱 Monitoreo Activo: ${c.name}`,
        msg: `Variedad ${c.variety}. Fecha estimada de cosecha: ${c.harvestDate || 'No registrada'}.`
      });
    });
    return list;
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl font-sans relative overflow-hidden">
      
      {/* Header Superior */}
      <header className="bg-emerald-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('inicio')}>
          <span className="text-xl">🌱</span>
          <h1 className="text-lg font-bold">AgroVisión GT</h1>
        </div>
        <select 
          value={currentLocation} 
          onChange={(e) => setCurrentLocation(e.target.value)}
          className="text-xs bg-emerald-700 text-white px-2 py-1 rounded-lg border-none outline-none font-medium">
          <option value="Chimaltenango">Chimaltenango</option>
          <option value="Quetzaltenango">Quetzaltenango</option>
          <option value="Escuintla">Escuintla</option>
          <option value="Guatemala">Guatemala</option>
          <option value="Huehuetenango">Huehuetenango</option>
        </select>
      </header>

      {/* Cuerpo Principal */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* VISTA 1: INICIO (Menú Principal con Botones de la Captura) */}
        {activeTab === 'inicio' && (
          <div className="space-y-4">
            <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-md">
              <h2 className="text-xl font-bold">¡Bienvenido, {profile.name}!</h2>
              <p className="text-xs text-emerald-100 mt-1">Información oportuna para que tomes mejores decisiones y protejas tus cultivos.</p>
            </div>

            {/* Grid de Accesos Directos (Coincide exacto con tu interfaz) */}
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setActiveTab('clima')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">🌤️</span>
                <span className="text-xs font-semibold text-gray-700">Clima</span>
              </button>

              <button onClick={() => setActiveTab('plagas')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">🐛</span>
                <span className="text-xs font-semibold text-gray-700">Plagas / IA</span>
              </button>

              <button onClick={() => setActiveTab('cultivos')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">🌱</span>
                <span className="text-xs font-semibold text-gray-700">Mis cultivos</span>
              </button>

              <button onClick={() => setActiveTab('alertas')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">🔔</span>
                <span className="text-xs font-semibold text-gray-700">Alertas</span>
              </button>

              <button onClick={() => setActiveTab('recomendaciones')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">💡</span>
                <span className="text-xs font-semibold text-gray-700">Recomendaciones</span>
              </button>

              <button onClick={() => setActiveTab('perfil')} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col items-center justify-center hover:bg-emerald-50 transition">
                <span className="text-2xl mb-1">👤</span>
                <span className="text-xs font-semibold text-gray-700">Mi perfil</span>
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center mt-4">
              <p className="text-xs text-emerald-800 font-medium">
                🌾 La tecnología y el campo trabajando juntos por un mejor futuro.
              </p>
            </div>
          </div>
        )}

        {/* VISTA 2: CLIMA */}
        {activeTab === 'clima' && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-gray-800">Clima en {currentLocation}</h2>
            <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-xs uppercase tracking-wider opacity-80">Condición Actual</p>
              <h3 className="text-4xl font-extrabold mt-2">{weatherData.temp}°C</h3>
              <p className="text-sm mt-1">{weatherData.condition}</p>
              <div className="mt-6 border-t border-emerald-600/50 pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>Humedad: <strong>{weatherData.humidity}%</strong></div>
                <div>Pronóstico: <strong>{weatherData.forecast}</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA 3: PLAGAS / IA (CHAT CON GEMINI) */}
        {activeTab === 'plagas' && (
          <div className="flex flex-col h-[75vh]">
            <div className="bg-emerald-100 p-2.5 rounded-xl mb-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <span>🤖</span> Asistente Agronómico listo para resolver dudas.
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'bg-emerald-700 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <p className="text-xs text-emerald-600 animate-pulse">Analizando consulta agrícola...</p>}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
              <input 
                type="text" 
                value={inputQuery} 
                onChange={e => setInputQuery(e.target.value)} 
                placeholder="Escribe tu consulta agronómica..." 
                className="flex-1 text-xs outline-none px-2"
              />
              <button type="submit" className="bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-emerald-800">
                Enviar
              </button>
            </form>
          </div>
        )}

        {/* VISTA 4: MIS CULTIVOS (REGISTRO Y COSECHAS) */}
        {activeTab === 'cultivos' && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-gray-800">Registro de Cultivos y Cosechas</h2>

            <form onSubmit={handleSaveCrop} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">+ Registrar Nuevo Cultivo</h3>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Cultivo (Ej. Frijol)" 
                  value={cropForm.name}
                  onChange={e => setCropForm({...cropForm, name: e.target.value})}
                  className="border p-2 rounded-lg text-xs outline-none" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Variedad (Ej. Ostúa)" 
                  value={cropForm.variety}
                  onChange={e => setCropForm({...cropForm, variety: e.target.value})}
                  className="border p-2 rounded-lg text-xs outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Fecha Siembra</label>
                  <input 
                    type="date" 
                    value={cropForm.plantingDate}
                    onChange={e => setCropForm({...cropForm, plantingDate: e.target.value})}
                    className="w-full border p-2 rounded-lg text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold">Cosecha Est.</label>
                  <input 
                    type="date" 
                    value={cropForm.harvestDate}
                    onChange={e => setCropForm({...cropForm, harvestDate: e.target.value})}
                    className="w-full border p-2 rounded-lg text-xs outline-none" 
                  />
                </div>
              </div>

              <textarea 
                placeholder="Notas técnicas o abonado..." 
                value={cropForm.notes}
                onChange={e => setCropForm({...cropForm, notes: e.target.value})}
                className="w-full border p-2 rounded-lg text-xs outline-none" 
                rows="2"
              ></textarea>

              <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold shadow hover:bg-emerald-800">
                Guardar Cultivo
              </button>
            </form>

            {/* Lista Guardada */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-600">Cultivos Guardados ({crops.length})</h3>
              {crops.map(c => (
                <div key={c.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 text-xs">🌾 {c.name} <span className="font-normal text-gray-500">({c.variety})</span></p>
                    <p className="text-[10px] text-gray-500 mt-1">📅 Siembra: {c.plantingDate} | 🧺 Cosecha: {c.harvestDate || 'Pendiente'}</p>
                  </div>
                  <button onClick={() => setCrops(crops.filter(item => item.id !== c.id))} className="text-red-500 text-[10px] hover:underline font-semibold">
                    Borrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 5: ALERTAS */}
        {activeTab === 'alertas' && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg text-gray-800">Alertas Agrícolas</h2>
            {getAlerts().map(a => (
              <div key={a.id} className={`p-3.5 rounded-xl border text-xs ${a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-900' : a.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <h4 className="font-bold">{a.title}</h4>
                <p className="mt-1 text-gray-600">{a.msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* VISTA 6: RECOMENDACIONES */}
        {activeTab === 'recomendaciones' && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg text-gray-800">Recomendaciones del Mes</h2>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-xs">
              <h3 className="font-bold text-emerald-800">📌 Manejo de Suelos en Escuintla y Chimaltenango</h3>
              <p className="text-gray-600 leading-relaxed">Se sugiere realizar curvas de nivel e incorporar materia orgánica para evitar la erosión durante periodos de lluvia intensa.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-xs">
              <h3 className="font-bold text-emerald-800">🧪 Fertilización Follar</h3>
              <p className="text-gray-600 leading-relaxed">Aplicar micronutrientes (Zinc y Boro) durante las primeras semanas de desarrollo para asegurar el llenado de grano.</p>
            </div>
          </div>
        )}

        {/* VISTA 7: PERFIL */}
        {activeTab === 'perfil' && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg text-gray-800">Perfil del Agricultor</h2>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold">Nombre Completo</label>
                <input 
                  type="text" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full border p-2 rounded-lg text-xs outline-none mt-1 font-semibold text-gray-800"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold">Ubicación / Municipio</label>
                <input 
                  type="text" 
                  value={profile.location} 
                  onChange={e => setProfile({...profile, location: e.target.value})}
                  className="w-full border p-2 rounded-lg text-xs outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  value={profile.phone} 
                  onChange={e => setProfile({...profile, phone: e.target.value})}
                  className="w-full border p-2 rounded-lg text-xs outline-none mt-1"
                />
              </div>
              <p className="text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                ✓ Cambios guardados automáticamente en tu dispositivo.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Barra de Navegación Inferior Estilo App Móvil */}
      <nav className="bg-white border-t border-gray-200 flex justify-around py-2.5 text-[10px] text-gray-500 absolute bottom-0 w-full max-w-md shadow-lg z-20">
        <button onClick={() => setActiveTab('inicio')} className={`flex flex-col items-center ${activeTab === 'inicio' ? 'text-emerald-700 font-bold' : ''}`}>
          <span className="text-base">🏠</span> <span>Inicio</span>
        </button>
        <button onClick={() => setActiveTab('clima')} className={`flex flex-col items-center ${activeTab === 'clima' ? 'text-emerald-700 font-bold' : ''}`}>
          <span className="text-base">🌤️</span> <span>Clima</span>
        </button>
        <button onClick={() => setActiveTab('plagas')} className={`flex flex-col items-center ${activeTab === 'plagas' ? 'text-emerald-700 font-bold' : ''}`}>
          <span className="text-base">🐛</span> <span>Plagas/IA</span>
        </button>
        <button onClick={() => setActiveTab('cultivos')} className={`flex flex-col items-center ${activeTab === 'cultivos' ? 'text-emerald-700 font-bold' : ''}`}>
          <span className="text-base">🌱</span> <span>Cultivos</span>
        </button>
        <button onClick={() => setActiveTab('alertas')} className={`flex flex-col items-center ${activeTab === 'alertas' ? 'text-emerald-700 font-bold' : ''}`}>
          <span className="text-base">🔔</span> <span>Alertas</span>
        </button>
      </nav>

    </div>
  );
}