import { supabase } from '../lib/supabase';

// Obtener todas las parcelas con sus cultivos
export const getPlotsWithCrops = async () => {
  const { data, error } = await supabase
    .from('plots')
    .select(`
      *,
      crops (*)
    `);

  if (error) {
    console.error('Error al obtener parcelas y cultivos:', error.message);
    throw error;
  }

  return data;
};

// Insertar una nueva parcela
export const createPlot = async (plotData) => {
  const { data, error } = await supabase
    .from('plots')
    .insert([plotData])
    .select();

  if (error) {
    console.error('Error al crear parcela:', error.message);
    throw error;
  }

  return data[0];
};

// Insertar un nuevo cultivo a una parcela
export const createCrop = async (cropData) => {
  const { data, error } = await supabase
    .from('crops')
    .insert([cropData])
    .select();

  if (error) {
    console.error('Error al registrar cultivo:', error.message);
    throw error;
  }

  return data[0];
};