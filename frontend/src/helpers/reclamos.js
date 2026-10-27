export const ESTADOS_RECLAMO = {
  pendiente: { texto: "Pendiente", clase: "bg-warning text-dark" },
  "en-revision": { texto: "En revisión", clase: "bg-primary" },
  finalizado: { texto: "Finalizado", clase: "bg-success" }
};

export const obtenerEstadoReclamo = (estado) =>
  ESTADOS_RECLAMO[estado] || {
    texto: estado || "Sin estado",
    clase: "bg-secondary"
  };

export const formatearFechaHora = (fecha) => {
  if (!fecha) {
    return "-";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });
};

export const MAX_IMAGENES = 5;
export const MAX_TAMANO_IMAGEN = 5242880;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

export const validarEvidencias = (archivos) => {
  if (archivos.length > MAX_IMAGENES) {
    return "Podés adjuntar hasta 5 imágenes.";
  }

  if (archivos.some((archivo) => !TIPOS_IMAGEN.includes(archivo.type))) {
    return "Solo se permiten imágenes JPG, PNG o WEBP.";
  }

  if (archivos.some((archivo) => archivo.size > MAX_TAMANO_IMAGEN)) {
    return "Cada imagen puede pesar hasta 5 MB.";
  }

  return "";
};
