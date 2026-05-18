// Guarda una preferencia simple en localStorage. Si falla, solo se registra el error.
export const savePreference = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Unable to save preference', key, error);
  }
};

// Devuelve true si el tema guardado es oscuro.
export const getSavedTheme = () => localStorage.getItem('dashboardTheme') === 'dark';

// Trunca el texto de la leyenda para que encaje en el espacio disponible.
export const truncateLegendText = (text, max = 16) =>
  typeof text === 'string' && text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Genera una paleta de colores pastel para los datos del gráfico.
export const pastelPalette = (count) => {
  const lightness = 74;
  return Array.from({ length: count }, (_, i) => {
    const hue = Math.round((i * 360) / Math.max(count, 1));
    return `hsl(${hue}, 70%, ${lightness}%)`;
  });
};

// Da formato a un valor numérico como euros localizados.
export const formatEuro = (value) =>
  Number(value).toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
