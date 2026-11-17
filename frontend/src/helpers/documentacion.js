import { apiDatos } from "../config/api";

// Verificación del prestador: PUT /api/users/me/documentacion (multipart)
export const ESTADOS_APROBACION = {
  pendiente: { texto: "Pendiente de aprobación", clase: "bg-warning text-dark" },
  aprobado: { texto: "Aprobado", clase: "bg-success" },
  rechazado: { texto: "Rechazado", clase: "bg-danger" }
};

export const obtenerEstadoAprobacion = (estado) =>
  ESTADOS_APROBACION[estado] || ESTADOS_APROBACION.pendiente;

export const MAX_TAMANO_DOCUMENTO = 5242880;
export const TIPOS_IMAGEN_DOCUMENTO = ["image/jpeg", "image/png", "image/webp"];
export const TIPOS_CV = [...TIPOS_IMAGEN_DOCUMENTO, "application/pdf"];
export const MAX_EXPERIENCIA = 2000;

// requerirIdentidad: el documento y la selfie son obligatorios mientras no haya aprobación
export function validarDocumentacion({ documento, selfie, cv, experiencia = "" }, requerirIdentidad) {
  if (requerirIdentidad && (!documento || !selfie)) {
    return "Adjuntá la foto de tu documento y una selfie de validación.";
  }

  const imagenes = [documento, selfie].filter(Boolean);

  if (imagenes.some((archivo) => !TIPOS_IMAGEN_DOCUMENTO.includes(archivo.type))) {
    return "El documento y la selfie deben ser imágenes JPG, PNG o WEBP.";
  }

  if (cv && !TIPOS_CV.includes(cv.type)) {
    return "El CV debe ser PDF, JPG, PNG o WEBP.";
  }

  if ([...imagenes, cv].filter(Boolean).some((archivo) => archivo.size > MAX_TAMANO_DOCUMENTO)) {
    return "Cada archivo puede pesar hasta 5 MB.";
  }

  if (experiencia.length > MAX_EXPERIENCIA) {
    return `La experiencia puede tener hasta ${MAX_EXPERIENCIA} caracteres.`;
  }

  return "";
}

export function enviarDocumentacion({ documento, selfie, cv, experiencia }) {
  const formulario = new FormData();

  if (documento) formulario.append("documento", documento);
  if (selfie) formulario.append("selfie", selfie);
  if (cv) formulario.append("cv", cv);
  if (experiencia !== undefined) formulario.append("experiencia", experiencia);

  return apiDatos(
    "/api/users/me/documentacion",
    { method: "PUT", body: formulario },
    "No se pudo enviar la documentación"
  );
}
