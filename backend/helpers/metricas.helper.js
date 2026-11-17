// Funciones puras para las métricas del panel de administración.

export const TIPOS_SERVICIO = ["Paseo", "Guarderia", "Traslado"];

const DIAS_POR_DEFECTO = 30;
const MS_DIA = 24 * 60 * 60 * 1000;

const leerFecha = (valor) => {
  if (!valor) return null;

  // "YYYY-MM-DD" se interpreta en hora local, no en UTC
  const texto = String(valor);
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T00:00:00`)
    : new Date(texto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// Devuelve { desde, hasta } con hasta inclusivo hasta el final del día.
// Sin fechas toma los últimos 30 días. Lanza un Error si el rango no es válido.
export const parsearRango = ({ desde, hasta } = {}, ahora = new Date()) => {
  const fin = leerFecha(hasta) ?? new Date(ahora);
  fin.setHours(23, 59, 59, 999);

  const inicio = leerFecha(desde) ?? new Date(fin.getTime() - (DIAS_POR_DEFECTO - 1) * MS_DIA);
  inicio.setHours(0, 0, 0, 0);

  if ((desde && !leerFecha(desde)) || (hasta && !leerFecha(hasta))) {
    throw new Error("Las fechas del rango no son válidas");
  }

  if (inicio > fin) {
    throw new Error("La fecha inicial debe ser anterior a la final");
  }

  return { desde: inicio, hasta: fin };
};

// Los servicios de demostración guardan tipos como "Paseo · 1 hora": se agrupan por la primera palabra
export const tipoBase = (tipo) => {
  const primera = String(tipo || "").split(/[\s·]+/)[0];
  return TIPOS_SERVICIO.find((item) => item.toLowerCase() === primera.toLowerCase()) || "Otro";
};

// filas: [{ tipo, estado, cantidad, monto }] agrupadas por tipo y estado
export const resumirServicios = (filas = []) => {
  const porEstado = {};
  const porTipo = {};
  let total = 0;

  for (const fila of filas) {
    const cantidad = Number(fila.cantidad) || 0;
    const monto = Number(fila.monto) || 0;
    const tipo = tipoBase(fila.tipo);

    total += cantidad;
    porEstado[fila.estado] = (porEstado[fila.estado] || 0) + cantidad;
    porTipo[tipo] ??= { tipo, cantidad: 0, finalizados: 0, montoReservado: 0 };
    porTipo[tipo].cantidad += cantidad;
    porTipo[tipo].montoReservado += monto;

    if (fila.estado === "finalizado") {
      porTipo[tipo].finalizados += cantidad;
    }
  }

  return {
    total,
    porEstado,
    // Más solicitados primero
    porTipo: Object.values(porTipo).sort((a, b) => b.cantidad - a.cantidad),
  };
};
