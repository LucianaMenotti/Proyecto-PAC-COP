export const TIPOS_SERVICIO = ["Paseo", "Guarderia", "Traslado"];

export const NOMBRE_SERVICIO = {
  paseo: "Paseo",
  guarderia: "Guarderia",
  traslado: "Traslado"
};

// Tabla de respaldo cuando todavía no hay precios de mercado en la zona
export const PRECIOS = {
  Paseo: { nombre: "Paseo", nuevo: 4000, establecido: 5000, top: 7000 },
  Guarderia: { nombre: "Guardería", nuevo: 7000, establecido: 9000, top: 12000 },
  Traslado: { nombre: "Traslado", nuevo: 5000, establecido: 7000, top: 10000 }
};

// Con datos reales del mercado: nuevo toma el mínimo, establecido el promedio y top el máximo.
export function obtenerPrecioNivel(servicio, nivel, rango = null) {
  if (rango) {
    const porNivel = { nuevo: rango.min, establecido: rango.promedio, top: rango.max };

    return porNivel[nivel] ?? 0;
  }

  return PRECIOS[servicio]?.[nivel] ?? 0;
}

export function obtenerPrecioMinimo(valorServicio, nivelActual, rango = null) {
  return obtenerPrecioNivel(NOMBRE_SERVICIO[valorServicio] || valorServicio, nivelActual, rango);
}

// Nivel según servicios finalizados y calificación promedio (regla de la versión de Maxi).
// Sin calificación se evalúa solo por cantidad de servicios, como hacía la versión anterior.
export function calcularNivel(completados, calificacion = null) {
  const sinCalificacion = calificacion === null || calificacion === undefined;
  const promedio = Number(calificacion) || 0;

  if (completados >= 50 && (sinCalificacion || promedio >= 4.5)) {
    return "top";
  }

  return completados >= 10 && (sinCalificacion || promedio >= 4) ? "establecido" : "nuevo";
}
