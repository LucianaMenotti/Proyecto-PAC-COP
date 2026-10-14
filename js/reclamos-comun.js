export const ESTADOS_RECLAMO = {
  pendiente: { texto: "Pendiente", clase: "bg-warning text-dark" },
  "en-revision": { texto: "En revisión", clase: "bg-primary" },
  finalizado: { texto: "Finalizado", clase: "bg-success" },
};

export const obtenerEstadoReclamo = (estado) =>
  ESTADOS_RECLAMO[estado] || {
    texto: estado || "Sin estado",
    clase: "bg-secondary",
  };

export const escapar = (texto) => {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
};

export const formatearFechaHora = (fecha) => {
  if (!fecha) {
    return "-";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};
