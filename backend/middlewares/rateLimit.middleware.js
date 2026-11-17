// Limitador de peticiones en memoria (sin dependencias externas).
// Pensado para endpoints sensibles (login, registro). No persiste entre reinicios.

const registros = new Map();

const limpiarAntiguos = (ahora, ventanaMs) => {
  for (const [clave, marcas] of registros.entries()) {
    const recientes = marcas.filter((marca) => ahora - marca < ventanaMs);
    if (recientes.length) registros.set(clave, recientes);
    else registros.delete(clave);
  }
};

export const crearLimitador = ({
  ventanaMs = 15 * 60 * 1000,
  maximo = 60,
  mensaje,
} = {}) => {
  return (req, res, next) => {
    const ahora = Date.now();
    const clave = req.ip || req.socket?.remoteAddress || "desconocido";

    const marcas = (registros.get(clave) || []).filter(
      (marca) => ahora - marca < ventanaMs,
    );

    if (marcas.length >= maximo) {
      const esperaSegundos = Math.ceil((ventanaMs - (ahora - marcas[0])) / 1000);
      res.set("Retry-After", String(esperaSegundos));
      return res.status(429).json({
        mensaje:
          mensaje || "Demasiados intentos. Probá de nuevo más tarde.",
      });
    }

    marcas.push(ahora);
    registros.set(clave, marcas);

    if (registros.size % 500 === 0) limpiarAntiguos(ahora, ventanaMs);

    next();
  };
};
