import Notificacion from "../models/notificacion.model.js";

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

export const listarNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.findAll({
      where: { userId: req.user.id },
      order: [["id", "DESC"]],
      limit: 100,
    });

    const noLeidas = await Notificacion.count({
      where: { userId: req.user.id, leida: false },
    });

    return res.json({
      noLeidas,
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

    await notificacion.update({ leida: true });

    return res.json({ mensaje: "Notificación marcada como leída" });
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
