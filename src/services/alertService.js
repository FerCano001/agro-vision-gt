export const buildAlertList = ({ weatherData = {}, currentLocation = 'Chimaltenango', crops = [] }) => {
  const list = [];

  if (weatherData.humidity >= 80) {
    list.push({
      id: 'humidity',
      type: 'clima',
      icon: '💧',
      title: 'Riesgo por humedad elevada',
      msg: `La humedad en ${currentLocation} alcanza ${weatherData.humidity}%. Vigila la aparición de hongos en hojas y tallos.`
    });
  }

  if (weatherData.rain >= 70) {
    list.push({
      id: 'rain',
      type: 'clima',
      icon: '🌧️',
      title: 'Lluvia prevista',
      msg: 'Evita realizar riego adicional y revisa el drenaje de tus parcelas.'
    });
  }

  if (weatherData.temp >= 30) {
    list.push({
      id: 'heat',
      type: 'riego',
      icon: '☀️',
      title: 'Temperatura elevada',
      msg: 'Existe riesgo de estrés térmico. Revisa la humedad del suelo.'
    });
  }

  crops.forEach((crop) => {
    list.push({
      id: `crop-${crop.id}`,
      type: 'cultivo',
      icon: '🌱',
      title: `${crop.name} bajo monitoreo`,
      msg: `Variedad ${crop.variety || 'no especificada'}. Cosecha estimada: ${crop.harvestDate || 'pendiente'}.`
    });
  });

  return list;
};
