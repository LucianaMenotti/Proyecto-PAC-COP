// Espejo de backend/helpers/precio.helper.js. El backend calcula el monto definitivo.

export function normalizarConfigPrecio(precioData) {
  if (precioData === null || precioData === undefined) {
    return { precioBase: 0 };
  }

  if (typeof precioData === "number" || typeof precioData === "string") {
    return { precioBase: Number(precioData) || 0 };
  }

  return {
    precioBase: Number(precioData.precioBase ?? precioData.precio ?? 0) || 0
  };
}

export function calcularPresupuesto(precioHora, duracionHoras) {
  const base = Math.max(0, Number(precioHora) || 0);
  const horas = Math.max(0, Number(duracionHoras) || 0);

  return {
    precioHora: base,
    duracionHoras: horas,
    total: Math.round(base * horas * 100) / 100
  };
}

export function formatearResumenPrecio(precioData, sinPrecio = "Sin precio") {
  const config = normalizarConfigPrecio(precioData);
  return config.precioBase ? `$${config.precioBase}/hora` : sinPrecio;
}

export const formatearPesos = (valor) => `$${Number(valor || 0).toLocaleString("es-AR")}`;
