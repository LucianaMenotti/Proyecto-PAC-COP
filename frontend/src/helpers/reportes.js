import { enviarDatos } from "../config/api";

// Mismos motivos que valida el backend (MOTIVOS_REPORTE en moderacion.controller.js)
export const MOTIVOS_REPORTE = {
  usuario: {
    "comportamiento-inapropiado": "Comportamiento inapropiado",
    incumplimiento: "No cumplió lo acordado",
    fraude: "Cobro indebido o fraude",
    acoso: "Acoso o amenazas",
    otro: "Otro motivo"
  },
  resena: {
    "lenguaje-ofensivo": "Lenguaje ofensivo",
    "informacion-falsa": "Información falsa",
    spam: "Spam o publicidad",
    otro: "Otro motivo"
  }
};

export const textoMotivo = (tipo, motivo) => MOTIVOS_REPORTE[tipo]?.[motivo] || motivo;

// POST /api/reportes { tipo, reportadoId | calificacionId, motivo, detalle }
export const enviarReporte = (reporte) =>
  enviarDatos("/api/reportes", "POST", reporte, "No se pudo enviar el reporte");
