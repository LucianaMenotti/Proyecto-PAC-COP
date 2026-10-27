import { Op } from "sequelize";
import Mensaje from "../models/mensaje.model.js";
import Servicio from "../models/servicio.model.js";
import User from "../models/user.model.js";
import {
    guardarImagenDesdeDataUrl,
    rutaDeImagen
} from "../helpers/imagen.helper.js";

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

        const desde = Number(req.query.desde) || 0;

        const mensajes = await Mensaje.findAll({
            where: {
                servicioId: servicio.id,
                ...(desde > 0 ? { id: { [Op.gt]: desde } } : {})
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
        const imagen = req.body.imagen;

        if (!texto && !imagen) {
            return res.status(400).json({
                mensaje: "El mensaje no puede estar vacío"
            });
        }

        let imagenArchivo = null;

        if (imagen) {
            const resultado = guardarImagenDesdeDataUrl(imagen);

            if (resultado.error) {
                return res.status(400).json({
                    mensaje: resultado.error
                });
            }

            imagenArchivo = resultado.nombre;
        }

        const latitud = Number(req.body.latitud);
        const longitud = Number(req.body.longitud);
        const tieneUbicacion =
            imagenArchivo &&
            req.body.latitud !== undefined &&
            req.body.longitud !== undefined &&
            Number.isFinite(latitud) &&
            Number.isFinite(longitud) &&
            Math.abs(latitud) <= 90 &&
            Math.abs(longitud) <= 180;

        const mensaje = await Mensaje.create({
            servicioId: servicio.id,
            remitenteId: req.user.id,
            texto,
            imagenArchivo,
            latitud: tieneUbicacion ? latitud : null,
            longitud: tieneUbicacion ? longitud : null
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

export const obtenerImagen = async (req, res) => {
    try {
        const servicio = await Servicio.findByPk(req.params.servicioId);

        if (!servicio) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada"
            });
        }

        if (!puedeAccederAlChat(servicio, req.user)) {
            return res.status(403).json({
                mensaje: "No tenés permiso para ver esta imagen"
            });
        }

        const mensaje = await Mensaje.findOne({
            where: {
                servicioId: servicio.id,
                imagenArchivo: req.params.archivo
            }
        });

        const ruta = mensaje ? rutaDeImagen(req.params.archivo) : null;

        if (!ruta) {
            return res.status(404).json({
                mensaje: "Imagen no encontrada"
            });
        }

        return res.sendFile(ruta);
    } catch (error) {
        console.error("Error al obtener imagen:", error);

        return res.status(500).json({
            mensaje: "No se pudo obtener la imagen"
        });
    }
};
