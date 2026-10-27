export const NOMBRES_SERVICIO = {
  Paseo: "Paseo",
  Guarderia: "Guardería",
  Traslado: "Traslado"
};

export const obtenerEstado = (estado) => {
  switch (estado) {
    case "programado":
      return { texto: "Programado", clase: "bg-warning text-dark" };
    case "aceptado":
      return { texto: "Aceptado", clase: "bg-success" };
    case "en-curso":
      return { texto: "En curso", clase: "bg-primary" };
    case "finalizado":
      return { texto: "Finalizado", clase: "bg-secondary" };
    case "rechazado":
      return { texto: "Rechazado", clase: "bg-danger" };
    default:
      return { texto: estado || "Sin estado", clase: "bg-secondary" };
  }
};

export const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Sin fecha programada";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

export const chatDisponible = (estado) => estado === "aceptado" || estado === "en-curso";
