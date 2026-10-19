import Notificacion from "../models/notificacion.model.js";
import { publicarEvento } from "../helpers/realtime.helper.js";

const LIMITE_NOTIFICACIONES = 30;

export const crearNotificacion = async ({
    usuarioId,
    tipo,
    titulo,
    mensaje = null,
    servicioId = null
}) => {
    try {
        if (!usuarioId || !tipo || !titulo) return null;

        const notificacion = await Notificacion.create({
            usuarioId,
            tipo,
            titulo,
            mensaje,
            servicioId
        });

        publicarEvento(usuarioId, "notificacion", {
            id: notificacion.id,
            tipo,
            titulo,
            mensaje,
            servicioId
        });

        return notificacion;
    } catch (error) {
        console.error("Error al crear notificación:", error);
        return null;
    }
};

export const listarNotificaciones = async (req, res) => {
    try {
        const { rows, count } = await Notificacion.findAndCountAll({
            where: { usuarioId: req.user.id },
            order: [["id", "DESC"]],
            limit: LIMITE_NOTIFICACIONES
        });

        const noLeidas = await Notificacion.count({
            where: { usuarioId: req.user.id, leida: false }
        });

        return res.json({ notificaciones: rows, noLeidas, total: count });
    } catch (error) {
        console.error("Error al listar notificaciones:", error);
        return res
            .status(500)
            .json({ mensaje: "No se pudieron cargar las notificaciones" });
    }
};

export const marcarNotificacionLeida = async (req, res) => {
    try {
        const notificacion = await Notificacion.findOne({
            where: { id: req.params.id, usuarioId: req.user.id }
        });

        if (!notificacion) {
            return res.status(404).json({ mensaje: "Notificación no encontrada" });
        }

        if (!notificacion.leida) {
            await notificacion.update({ leida: true });
        }

        return res.json({ notificacion });
    } catch (error) {
        console.error("Error al marcar notificación:", error);
        return res
            .status(500)
            .json({ mensaje: "No se pudo actualizar la notificación" });
    }
};

export const marcarTodasLeidas = async (req, res) => {
    try {
        await Notificacion.update(
            { leida: true },
            { where: { usuarioId: req.user.id, leida: false } }
        );

        return res.json({ mensaje: "Notificaciones marcadas como leídas" });
    } catch (error) {
        console.error("Error al marcar notificaciones:", error);
        return res
            .status(500)
            .json({ mensaje: "No se pudieron actualizar las notificaciones" });
    }
};
