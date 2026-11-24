/**
 * Calcula el presupuesto de un servicio según su tarifa por hora y la duración.
 * La cantidad de mascotas no modifica el precio.
 */
export function calcularPresupuesto(precioHora, duracionHoras) {
  const base = Math.max(0, Number(precioHora) || 0);
  const horas = Math.max(0, Number(duracionHoras) || 0);
  const total = Math.round(base * horas * 100) / 100;

  return {
    precioHora: base,
    duracionHoras: horas,
    total,
  };
}

/** Normaliza la configuración de precio almacenada para un servicio. */
export function normalizarConfigPrecio(precioData) {
  if (precioData === null || precioData === undefined) {
    return { precioBase: 0 };
  }

  if (typeof precioData === "number" || typeof precioData === "string") {
    return { precioBase: Number(precioData) || 0 };
  }

  return {
    precioBase: Number(precioData.precioBase ?? precioData.precio ?? 0) || 0,
  };
}

/** Formatea la tarifa por hora para mostrarla en listas y tarjetas. */
export function formatearResumenPrecio(precioData) {
  const config = normalizarConfigPrecio(precioData);
  if (!config.precioBase) return "Sin precio";

  return `$${config.precioBase}/hora`;
}
