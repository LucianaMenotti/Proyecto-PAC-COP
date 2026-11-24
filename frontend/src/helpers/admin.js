// Textos y formatos compartidos por el panel de administración.

export const SECCIONES_ADMIN = [
  { id: "resumen", texto: "Resumen", icono: "bi-graph-up" },
  { id: "usuarios", texto: "Usuarios", icono: "bi-people" },
  { id: "servicios", texto: "Servicios", icono: "bi-calendar-check" },
  { id: "reclamos", texto: "Reclamos", icono: "bi-flag", contador: "reclamosAbiertos" },
  { id: "moderacion", texto: "Moderación", icono: "bi-chat-square-text", contador: "reportesPendientes" },
  { id: "auditoria", texto: "Registro de acciones", icono: "bi-journal-text" }
];

export const TIPOS_SERVICIO = ["Paseo", "Guarderia", "Traslado"];

export const NOMBRE_TIPO = {
  Paseo: "Paseo",
  Guarderia: "Guardería",
  Traslado: "Traslado",
  Otro: "Otro"
};

export const ESTADOS_SERVICIO = {
  programado: { texto: "Programado", clase: "text-bg-secondary" },
  aceptado: { texto: "Aceptado", clase: "text-bg-info" },
  "en-curso": { texto: "En curso", clase: "text-bg-primary" },
  finalizado: { texto: "Finalizado", clase: "text-bg-success" },
  cancelado: { texto: "Cancelado", clase: "text-bg-dark" },
  rechazado: { texto: "Rechazado", clase: "text-bg-danger" }
};

export const ESTADOS_CUENTA = {
  activa: { texto: "Activa", clase: "text-bg-success" },
  suspendida: { texto: "Suspendida", clase: "text-bg-danger" }
};

// Códigos que registra el backend en AccionesAdmin
export const TEXTO_ACCIONES = {
  "cambio-rol": "Cambio de rol",
  "aprobacion-prestador": "Aprobación de prestador",
  "rechazo-prestador": "Rechazo de prestador",
  "suspension-cuenta": "Suspensión de cuenta",
  "reactivacion-cuenta": "Reactivación de cuenta",
  "cancelacion-servicio": "Cancelación de servicio",
  "estado-reclamo": "Cambio de estado de reclamo",
  "contacto-reclamo": "Mensaje a las partes de un reclamo",
  "ocultar-resena": "Reseña ocultada",
  "mostrar-resena": "Reseña visible de nuevo",
  "eliminar-resena": "Reseña eliminada",
  "resolver-reporte": "Reporte resuelto",
  "descartar-reporte": "Reporte descartado"
};

export const ROLES_ASIGNABLES = ["dueño", "prestador", "admin"];

export const formatearMonto = (valor) => `$${Number(valor || 0).toLocaleString("es-AR")}`;

export const formatearFecha = (fecha, conHora = true) => {
  if (!fecha) {
    return "-";
  }

  return new Date(fecha).toLocaleString(
    "es-AR",
    conHora ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }
  );
};

export const nombreDe = (usuario) =>
  usuario ? `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "-" : "-";

// Ruta servida solo a la administración (GET /api/admin/usuarios/:id/documentos/:tipo)
export const rutaDocumento = (usuarioId, tipo) => `/api/admin/usuarios/${usuarioId}/documentos/${tipo}`;

// Fecha local en formato YYYY-MM-DD para los campos de tipo date
export const fechaInput = (fecha) => {
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
