export const NOMBRE_SERVICIO = {
  paseo: "Paseo",
  guarderia: "Guarderia",
  traslado: "Traslado"
};

export const PRECIOS = {
  Paseo: { nombre: "Paseo", nuevo: 4000, establecido: 5000, top: 7000 },
  Guarderia: { nombre: "Guardería", nuevo: 7000, establecido: 9000, top: 12000 },
  Traslado: { nombre: "Traslado", nuevo: 5000, establecido: 7000, top: 10000 }
};

export function obtenerPrecioMinimo(valorServicio, nivelActual) {
  const servicio = NOMBRE_SERVICIO[valorServicio];

  return PRECIOS[servicio]?.[nivelActual] ?? 0;
}

export function calcularNivel(completados) {
  if (completados >= 50) {
    return "top";
  }

  return completados >= 10 ? "establecido" : "nuevo";
}
