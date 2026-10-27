export function obtenerServicios(servicios) {
  if (Array.isArray(servicios)) {
    return servicios;
  }

  if (typeof servicios === "string") {
    try {
      const resultado = JSON.parse(servicios);

      return Array.isArray(resultado) ? resultado : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function precioDe(prestador, tipo) {
  let precios = prestador.preciosServicios;

  if (typeof precios === "string") {
    try {
      precios = JSON.parse(precios);
    } catch {
      precios = {};
    }
  }

  return Number(precios?.[tipo]) || 0;
}
