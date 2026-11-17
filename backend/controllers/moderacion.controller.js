import { Op } from "sequelize";
import User from "../models/user.model.js";
import Servicio from "../models/servicio.model.js";
import Calificacion from "../models/calificacion.model.js";
import Reporte from "../models/reporte.model.js";
import { crearNotificacion } from "./notificacion.controller.js";
import { ROLES_ADMIN, esAdministrador } from "../middlewares/admin.middleware.js";
import { registrarAccion } from "../helpers/auditoria.helper.js";
import {
  condicionResenaVisible,
  recalcularCalificacionPrestador,
} from "../helpers/calificacion.helper.js";

// Motivos admitidos por tipo de reporte (historias "Moderación de reseñas" y "Reporte de usuario")
export const MOTIVOS_REPORTE = {
  usuario: ["comportamiento-inapropiado", "incumplimiento", "fraude", "acoso", "otro"],
  resena: ["lenguaje-ofensivo", "informacion-falsa", "spam", "otro"],
};

const MAX_DETALLE = 1000;
const MIN_MOTIVO = 5;

const ATRIBUTOS_PERSONA = ["id", "nombre", "apellido", "email", "rol", "estadoCuenta"];

const nombreCompleto = (usuario) =>
  usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : "";

const parsearPaginacion = (query) => {
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 100);
  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);

  return { limite, pagina, offset: (pagina - 1) * limite };
};

const presentarResena = (calificacion, reportesPendientes = 0) =>
  calificacion
    ? {
        id: calificacion.id,
        servicioId: calificacion.servicioId,
        puntuacion: calificacion.puntuacion,
        comentario: calificacion.comentario,
        oculta: Boolean(calificacion.oculta),
        motivoModeracion: calificacion.motivoModeracion,
        fecha: calificacion.createdAt,
        autor: calificacion.dueno
          ? { id: calificacion.dueno.id, nombre: nombreCompleto(calificacion.dueno) }
          : null,
        prestador: calificacion.prestador
          ? { id: calificacion.prestador.id, nombre: nombreCompleto(calificacion.prestador) }
          : null,
        reportesPendientes,
      }
    : null;

const INCLUDE_RESENA = [
  { model: User, as: "dueno", attributes: ["id", "nombre", "apellido"] },
  { model: User, as: "prestador", attributes: ["id", "nombre", "apellido"] },
];

const avisarAdministradores = async (titulo, mensaje) => {
  const administradores = await User.findAll({
    where: { rol: { [Op.in]: ROLES_ADMIN } },
    attributes: ["id"],
  });

  for (const administrador of administradores) {
    await crearNotificacion({
      usuarioId: administrador.id,
      tipo: "reporte-nuevo",
      titulo,
      mensaje,
    });
  }
};

// Cierra los reportes pendientes de una reseña cuando se modera
const cerrarReportesDeResena = async (calificacionId, admin, resolucion) => {
  await Reporte.update(
    {
      estado: "resuelto",
      resolucion,
      resueltoPor: admin.id,
      resueltoEn: new Date(),
    },
    { where: { calificacionId, estado: "pendiente" } },
  );
};

// POST /api/reportes { tipo: "usuario" | "resena", reportadoId | calificacionId, motivo, detalle }
export const crearReporte = async (req, res) => {
  try {
    if (esAdministrador(req.user)) {
      return res
        .status(403)
        .json({ mensaje: "La administración modera directamente desde su panel" });
    }

    const tipo = String(req.body.tipo ?? "");
    const motivo = String(req.body.motivo ?? "");
    const detalle = String(req.body.detalle ?? "").trim();

    if (!MOTIVOS_REPORTE[tipo]) {
      return res.status(400).json({ mensaje: "El tipo de reporte no es válido" });
    }

    if (!MOTIVOS_REPORTE[tipo].includes(motivo)) {
      return res.status(400).json({ mensaje: "Elegí un motivo de la lista" });
    }

    if (detalle.length > MAX_DETALLE) {
      return res
        .status(400)
        .json({ mensaje: `El detalle puede tener hasta ${MAX_DETALLE} caracteres` });
    }

    let reportadoId = null;
    let calificacionId = null;

    if (tipo === "resena") {
      const calificacion = await Calificacion.findOne({
        where: { id: req.body.calificacionId, ...condicionResenaVisible() },
      });

      if (!calificacion) {
        return res.status(404).json({ mensaje: "Reseña no encontrada" });
      }

      if (Number(calificacion.ownerId) === Number(req.user.id)) {
        return res.status(409).json({ mensaje: "No podés reportar tu propia reseña" });
      }

      calificacionId = calificacion.id;
      reportadoId = calificacion.ownerId;
    } else {
      reportadoId = Number(req.body.reportadoId);
      const reportado = await User.findByPk(reportadoId, { attributes: ["id", "rol"] });

      if (!reportado || esAdministrador(reportado)) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      if (reportado.id === Number(req.user.id)) {
        return res.status(409).json({ mensaje: "No podés reportarte a vos mismo" });
      }

      // Solo se reporta a alguien con quien se compartió al menos un servicio
      const compartido = await Servicio.count({
        where: {
          [Op.or]: [
            { ownerId: req.user.id, providerId: reportado.id },
            { ownerId: reportado.id, providerId: req.user.id },
          ],
        },
      });

      if (!compartido) {
        return res.status(403).json({
          mensaje: "Solo podés reportar a usuarios con los que tuviste un servicio",
        });
      }
    }

    const duplicado = await Reporte.findOne({
      where: {
        reportanteId: req.user.id,
        estado: "pendiente",
        ...(calificacionId ? { calificacionId } : { tipo: "usuario", reportadoId }),
      },
    });

    if (duplicado) {
      return res
        .status(409)
        .json({ mensaje: "Ya enviaste un reporte que está pendiente de revisión" });
    }

    const reporte = await Reporte.create({
      tipo,
      reportanteId: req.user.id,
      reportadoId,
      calificacionId,
      motivo,
      detalle: detalle || null,
    });

    await avisarAdministradores(
      tipo === "resena" ? "Reseña reportada" : "Usuario reportado",
      `${nombreCompleto(req.user)} envió el reporte #${reporte.id} (${motivo}).`,
    );

    return res.status(201).json({
      mensaje: "Reporte enviado. La administración lo revisará.",
      reporte: { id: reporte.id, estado: reporte.estado },
    });
  } catch (error) {
    console.error("Error al crear el reporte:", error);
    return res.status(500).json({ mensaje: "No se pudo enviar el reporte" });
  }
};

// GET /api/admin/reportes?estado=&tipo=&pagina=&limite=
export const listarReportesAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const where = {};

    if (req.query.estado) where.estado = String(req.query.estado);
    if (req.query.tipo) where.tipo = String(req.query.tipo);

    const { count, rows } = await Reporte.findAndCountAll({
      where,
      include: [
        { model: User, as: "reportante", attributes: ATRIBUTOS_PERSONA },
        { model: User, as: "reportado", attributes: ATRIBUTOS_PERSONA },
        { model: Calificacion, as: "calificacion", include: INCLUDE_RESENA },
      ],
      // Los pendientes más antiguos primero; el resto, los más recientes primero
      order: [["id", where.estado === "pendiente" ? "ASC" : "DESC"]],
      limit: limite,
      offset,
      distinct: true,
    });

    const reportes = rows.map((reporte) => ({
      id: reporte.id,
      tipo: reporte.tipo,
      motivo: reporte.motivo,
      detalle: reporte.detalle,
      estado: reporte.estado,
      resolucion: reporte.resolucion,
      fecha: reporte.createdAt,
      resueltoEn: reporte.resueltoEn,
      reportante: reporte.reportante
        ? { ...reporte.reportante.toJSON(), nombre: nombreCompleto(reporte.reportante) }
        : null,
      reportado: reporte.reportado
        ? { ...reporte.reportado.toJSON(), nombre: nombreCompleto(reporte.reportado) }
        : null,
      // null cuando la reseña ya fue eliminada
      resena: presentarResena(reporte.calificacion),
    }));

    return res.status(200).json({
      reportes,
      total: count,
      pagina,
      limite,
      totalPaginas: Math.max(Math.ceil(count / limite), 1),
    });
  } catch (error) {
    console.error("Error al listar reportes:", error);
    return res.status(500).json({ mensaje: "No se pudieron obtener los reportes" });
  }
};

// PATCH /api/admin/reportes/:id { estado: "resuelto" | "descartado", resolucion }
export const resolverReporte = async (req, res) => {
  try {
    const estado = String(req.body.estado ?? "");
    const resolucion = String(req.body.resolucion ?? "").trim().slice(0, 255);

    if (!["resuelto", "descartado"].includes(estado)) {
      return res.status(400).json({ mensaje: "El estado debe ser resuelto o descartado" });
    }

    const reporte = await Reporte.findByPk(req.params.id);

    if (!reporte) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }

    if (reporte.estado !== "pendiente") {
      return res.status(409).json({ mensaje: "El reporte ya fue revisado" });
    }

    await reporte.update({
      estado,
      resolucion: resolucion || null,
      resueltoPor: req.user.id,
      resueltoEn: new Date(),
    });

    await crearNotificacion({
      usuarioId: reporte.reportanteId,
      tipo: "reporte-revisado",
      titulo: "Tu reporte fue revisado",
      mensaje: `La administración revisó tu reporte #${reporte.id}.${resolucion ? ` ${resolucion}` : ""}`,
    });

    await registrarAccion({
      admin: req.user,
      accion: estado === "resuelto" ? "resolver-reporte" : "descartar-reporte",
      entidad: "reporte",
      entidadId: reporte.id,
      motivo: resolucion || null,
      detalle: { tipo: reporte.tipo, reportadoId: reporte.reportadoId },
    });

    return res.status(200).json({ mensaje: "Reporte actualizado", estado: reporte.estado });
  } catch (error) {
    console.error("Error al resolver el reporte:", error);
    return res.status(500).json({ mensaje: "No se pudo actualizar el reporte" });
  }
};

// GET /api/admin/resenas?visibilidad=visibles|ocultas&reportadas=true&prestadorId=&pagina=&limite=
export const listarResenasAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const condiciones = [];

    if (req.query.visibilidad === "ocultas") condiciones.push({ oculta: true });
    if (req.query.visibilidad === "visibles") condiciones.push(condicionResenaVisible());

    const prestadorId = Number(req.query.prestadorId);
    if (Number.isInteger(prestadorId) && prestadorId > 0) condiciones.push({ providerId: prestadorId });

    const pendientes = await Reporte.findAll({
      where: { estado: "pendiente", calificacionId: { [Op.ne]: null } },
      attributes: ["calificacionId"],
      raw: true,
    });

    const conteo = pendientes.reduce((mapa, fila) => {
      mapa.set(fila.calificacionId, (mapa.get(fila.calificacionId) || 0) + 1);
      return mapa;
    }, new Map());

    if (req.query.reportadas === "true") {
      condiciones.push({ id: { [Op.in]: [...conteo.keys()] } });
    }

    const { count, rows } = await Calificacion.findAndCountAll({
      where: condiciones.length ? { [Op.and]: condiciones } : {},
      include: INCLUDE_RESENA,
      order: [["id", "DESC"]],
      limit: limite,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      resenas: rows.map((fila) => presentarResena(fila, conteo.get(fila.id) || 0)),
      total: count,
      pagina,
      limite,
      totalPaginas: Math.max(Math.ceil(count / limite), 1),
    });
  } catch (error) {
    console.error("Error al listar reseñas (admin):", error);
    return res.status(500).json({ mensaje: "No se pudieron obtener las reseñas" });
  }
};

// PATCH /api/admin/resenas/:id { oculta: boolean, motivo }
export const cambiarVisibilidadResena = async (req, res) => {
  try {
    const ocultar = req.body.oculta === true;
    const motivo = String(req.body.motivo ?? "").trim().slice(0, 255);
    const calificacion = await Calificacion.findByPk(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ mensaje: "Reseña no encontrada" });
    }

    if (Boolean(calificacion.oculta) === ocultar) {
      return res.status(409).json({
        mensaje: ocultar ? "La reseña ya está oculta" : "La reseña ya está visible",
      });
    }

    if (ocultar && motivo.length < MIN_MOTIVO) {
      return res
        .status(400)
        .json({ mensaje: "Indicá el motivo de la moderación (al menos 5 caracteres)" });
    }

    await calificacion.update({
      oculta: ocultar,
      motivoModeracion: ocultar ? motivo : null,
      moderadaEn: new Date(),
    });

    await recalcularCalificacionPrestador(calificacion.providerId);

    if (ocultar) {
      await cerrarReportesDeResena(calificacion.id, req.user, `Reseña ocultada: ${motivo}`);

      await crearNotificacion({
        usuarioId: calificacion.ownerId,
        tipo: "resena-moderada",
        titulo: "Tu reseña fue ocultada",
        mensaje: `La administración ocultó tu reseña del servicio #${calificacion.servicioId}. Motivo: ${motivo}`,
        servicioId: calificacion.servicioId,
      });
    }

    await registrarAccion({
      admin: req.user,
      accion: ocultar ? "ocultar-resena" : "mostrar-resena",
      entidad: "resena",
      entidadId: calificacion.id,
      motivo: motivo || null,
      detalle: { prestadorId: calificacion.providerId, autorId: calificacion.ownerId },
    });

    return res.status(200).json({
      mensaje: ocultar ? "Reseña ocultada" : "Reseña visible nuevamente",
      oculta: ocultar,
    });
  } catch (error) {
    console.error("Error al moderar la reseña:", error);
    return res.status(500).json({ mensaje: "No se pudo moderar la reseña" });
  }
};

// DELETE /api/admin/resenas/:id { motivo }
// El contenido eliminado queda copiado en el registro de acciones junto con el motivo.
export const eliminarResena = async (req, res) => {
  try {
    const motivo = String(req.body?.motivo ?? "").trim().slice(0, 255);

    if (motivo.length < MIN_MOTIVO) {
      return res
        .status(400)
        .json({ mensaje: "Indicá el motivo de la eliminación (al menos 5 caracteres)" });
    }

    const calificacion = await Calificacion.findByPk(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ mensaje: "Reseña no encontrada" });
    }

    const calificacionId = calificacion.id;
    const copia = {
      servicioId: calificacion.servicioId,
      autorId: calificacion.ownerId,
      prestadorId: calificacion.providerId,
      puntuacion: calificacion.puntuacion,
      comentario: calificacion.comentario,
      creadaEn: calificacion.createdAt,
    };

    await calificacion.destroy();
    await recalcularCalificacionPrestador(copia.prestadorId);
    await cerrarReportesDeResena(calificacionId, req.user, `Reseña eliminada: ${motivo}`);

    await crearNotificacion({
      usuarioId: copia.autorId,
      tipo: "resena-moderada",
      titulo: "Tu reseña fue eliminada",
      mensaje: `La administración eliminó tu reseña del servicio #${copia.servicioId}. Motivo: ${motivo}`,
      servicioId: copia.servicioId,
    });

    await registrarAccion({
      admin: req.user,
      accion: "eliminar-resena",
      entidad: "resena",
      entidadId: calificacionId,
      motivo,
      detalle: copia,
    });

    return res.status(200).json({ mensaje: "Reseña eliminada" });
  } catch (error) {
    console.error("Error al eliminar la reseña:", error);
    return res.status(500).json({ mensaje: "No se pudo eliminar la reseña" });
  }
};
