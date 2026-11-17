import Notificacion from "../models/notificacion.model.js";
import { publicarEvento } from "../helpers/realtime.helper.js";

const LIMITE_NOTIFICACIONES = 100;

const presentarNotificacion = (notificacion) => ({
  id: notificacion.id,
  tipo: notificacion.tipo,
  titulo: notificacion.titulo,
  mensaje: notificacion.mensaje,
  reclamoId: notificacion.reclamoId,
  servicioId: notificacion.servicioId,
  leida: notificacion.leida,
  creadoEn: notificacion.createdAt,
});

// Emite por SSE (si el usuario está conectado) una notificación ya guardada
export const emitirNotificacion = (userId, notificacion) => {
  publicarEvento(userId, "notificacion", {
    id: notificacion.id,
    tipo: notificacion.tipo,
    titulo: notificacion.titulo,
    mensaje: notificacion.mensaje,
    reclamoId: notificacion.reclamoId ?? null,
    servicioId: notificacion.servicioId ?? null,
  });
};

// Crea una notificación para un usuario y la transmite en tiempo real.
// Acepta `usuarioId` (nombre usado por los controladores de servicios/pagos)
// o `userId` (nombre de la columna).
export const crearNotificacion = async ({
  usuarioId,
  userId = usuarioId,
  tipo,
  titulo,
  mensaje = "",
  servicioId = null,
  reclamoId = null,
}) => {
  try {
    if (!userId || !tipo || !titulo) return null;

    const notificacion = await Notificacion.create({
      userId,
      tipo,
      titulo,
      mensaje: mensaje ?? "",
      servicioId,
      reclamoId,
    });

    emitirNotificacion(userId, notificacion);

    return notificacion;
  } catch (error) {
    console.error("Error al crear notificación:", error);
    return null;
  }
};

export const listarNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { userId: req.user.id },
      order: [["id", "DESC"]],
      limit: LIMITE_NOTIFICACIONES,
    });

    const noLeidas = await Notificacion.count({
      where: { userId: req.user.id, leida: false },
    });

    return res.json({
      noLeidas,
      total: notificaciones.length,
      notificaciones: notificaciones.map(presentarNotificacion),
    });
  } catch (error) {
    console.error("Error al listar notificaciones:", error);

    return res
      .status(500)
      .json({ mensaje: "No se pudieron obtener las notificaciones" });
  }
};

export const marcarLeida = async (req, res) => {
  try {
    const notificacion = await Notificacion.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notificacion) {
      return res.status(404).json({ mensaje: "Notificación no encontrada" });
    }

    if (!notificacion.leida) {
      await notificacion.update({ leida: true });
    }

    return res.json({
      mensaje: "Notificación marcada como leída",
      notificacion: presentarNotificacion(notificacion),
    });
  } catch (error) {
    console.error("Error al marcar la notificación:", error);

    return res
      .status(500)
      .json({ mensaje: "No se pudo actualizar la notificación" });
  }
};

export const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update(
      { leida: true },
      { where: { userId: req.user.id, leida: false } },
    );

    return res.json({ mensaje: "Notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar las notificaciones:", error);

    return res
      .status(500)
      .json({ mensaje: "No se pudieron actualizar las notificaciones" });
  }
};
