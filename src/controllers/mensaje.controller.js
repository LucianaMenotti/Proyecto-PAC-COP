import Mensaje from "../models/mensaje.model.js";
import Servicio from "../models/servicio.model.js";
import User from "../models/user.model.js";

const puedeAccederAlChat = (servicio, usuario) => {
    return (
        Number(servicio.ownerId) === Number(usuario.id) ||
        Number(servicio.providerId) === Number(usuario.id) ||
        ["admin", "administrador"].includes(usuario.rol)
    );
};

export const obtenerMensajes = async (req, res) => {
    try {
        const servicio = await Servicio.findByPk(req.params.servicioId);

        if (!servicio) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        if (!puedeAccederAlChat(servicio, req.user)) {
            return res.status(403).json({
                mensaje: "No tenés permiso para acceder a este chat"
            });
        }

        if (servicio.estado !== "aceptado" && servicio.estado !== "en-curso") {
            return res.status(409).json({
                mensaje: "El chat todavía no está disponible"
            });
        }

        const mensajes = await Mensaje.findAll({
            where: {
                servicioId: servicio.id
            },
            include: [
                {
                    model: User,
                    as: "remitente",
                    attributes: ["id", "nombre", "apellido"]
                }
            ],
            order: [["creadoEn", "ASC"]]
        });

        return res.json({
            mensajes
        });
    } catch (error) {
        console.error("Error al obtener mensajes:", error);

        return res.status(500).json({
            mensaje: "No se pudieron obtener los mensajes"
        });
    }
};

export const enviarMensaje = async (req, res) => {
    try {
        const servicio = await Servicio.findByPk(req.params.servicioId);

        if (!servicio) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        if (!puedeAccederAlChat(servicio, req.user)) {
            return res.status(403).json({
                mensaje: "No tenés permiso para usar este chat"
            });
        }

        if (servicio.estado !== "aceptado" && servicio.estado !== "en-curso") {
            return res.status(409).json({
                mensaje: "El chat todavía no está disponible"
            });
        }

        const texto = String(req.body.texto || "").trim();

        if (!texto) {
            return res.status(400).json({
                mensaje: "El mensaje no puede estar vacío"
            });
        }

        const mensaje = await Mensaje.create({
            servicioId: servicio.id,
            remitenteId: req.user.id,
            texto
        });

        const mensajeCompleto = await Mensaje.findByPk(mensaje.id, {
            include: [
                {
                    model: User,
                    as: "remitente",
                    attributes: ["id", "nombre", "apellido"]
                }
            ]
        });

        return res.status(201).json({
            mensaje: mensajeCompleto
        });
    } catch (error) {
        console.error("Error al enviar mensaje:", error);

        return res.status(500).json({
            mensaje: "No se pudo enviar el mensaje"
        });
    }
};