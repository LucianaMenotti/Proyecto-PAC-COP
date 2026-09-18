import { Op } from "sequelize";
import Servicio from "../models/servicio.model.js";
import Ubicacion from "../models/ubicacion.model.js";
import User from "../models/user.model.js";

const esAdministrador = (user) => ["admin", "administrador"].includes(user.rol);

const puedeAcceder = (servicio, user) =>
    esAdministrador(user) ||
    Number(servicio.ownerId) === Number(user.id) ||
    Number(servicio.providerId) === Number(user.id);

const presentarServicio = (servicio, ubicacion = null, user = null) => ({
    id: servicio.id,
    prestador: servicio.prestadorNombre,
    tipo: servicio.tipo,
    mascota: servicio.mascotaNombre,
    monto: Number(servicio.monto),
    estado: servicio.estado,
    horaProgramada: servicio.horaProgramada,
    iniciadoEn: servicio.iniciadoEn,
    finalizadoEn: servicio.finalizadoEn,
    ultimaUbicacion: ubicacion,
    puedeGestionar: Boolean(user && (
        esAdministrador(user) || Number(servicio.providerId) === Number(user.id)
    ))
});

const obtenerServicioAutorizado = async (id, user) => {
    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
        return { error: { status: 404, mensaje: "Servicio no encontrado" } };
    }

    if (!puedeAcceder(servicio, user)) {
        return { error: { status: 403, mensaje: "No tenés permisos para este servicio" } };
    }

    return { servicio };
};

export const crearServicioDemo = async (req, res) => {
    if (esAdministrador(req.user)) {
        const servicioAdmin = await Servicio.findOne({
            where: { estado: { [Op.in]: ["programado", "en-curso"] } },
            order: [["id", "DESC"]]
        });

        if (!servicioAdmin) {
            return res.status(404).json({ mensaje: "Todavía no hay servicios para supervisar" });
        }

        return res.json({ servicio: presentarServicio(servicioAdmin, null, req.user) });
    }

    if (req.user.rol === "prestador") {
        const servicioPrestador = await Servicio.findOne({
            where: {
                providerId: req.user.id,
                estado: { [Op.in]: ["programado", "en-curso"] }
            },
            order: [["id", "DESC"]]
        });

        if (!servicioPrestador) {
            return res.status(404).json({ mensaje: "No tenés servicios asignados" });
        }

        return res.json({ servicio: presentarServicio(servicioPrestador, null, req.user) });
    }

    const servicioExistente = await Servicio.findOne({
        where: {
            ownerId: req.user.id,
            estado: { [Op.in]: ["programado", "en-curso"] }
        },
        order: [["id", "DESC"]]
    });

    if (servicioExistente) {
        if (!servicioExistente.providerId) {
            const prestador = await User.findOne({ where: { rol: "prestador" }, order: [["id", "ASC"]] });
            if (prestador) {
                await servicioExistente.update({
                    providerId: prestador.id,
                    prestadorNombre: `${prestador.nombre} ${prestador.apellido}`
                });
            }
        }

        return res.json({ servicio: presentarServicio(servicioExistente, null, req.user) });
    }

    const prestador = await User.findOne({ where: { rol: "prestador" }, order: [["id", "ASC"]] });

    const servicio = await Servicio.create({
        ownerId: req.user.id,
        providerId: prestador?.id ?? null,
        prestadorNombre: prestador
            ? `${prestador.nombre} ${prestador.apellido}`
            : "Prestador pendiente",
        tipo: "Paseo · 1 hora",
        mascotaNombre: "Toby",
        monto: 4500,
        estado: "programado",
        horaProgramada: new Date(Date.now() + 60 * 60 * 1000)
    });

    return res.status(201).json({ servicio: presentarServicio(servicio, null, req.user) });
};

export const listarServicios = async (req, res) => {
    const where = esAdministrador(req.user)
        ? {}
        : req.user.rol === "prestador"
            ? { providerId: req.user.id }
            : { ownerId: req.user.id };

    const servicios = await Servicio.findAll({ where, order: [["id", "DESC"]] });
    return res.json({ servicios: servicios.map((servicio) => presentarServicio(servicio, null, req.user)) });
};

export const obtenerServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    const ubicacion = await Ubicacion.findOne({
        where: { servicioId: resultado.servicio.id },
        order: [["registradoEn", "DESC"]]
    });

    return res.json({ servicio: presentarServicio(resultado.servicio, ubicacion, req.user) });
};

export const iniciarServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    if (!esAdministrador(req.user) && Number(resultado.servicio.providerId) !== Number(req.user.id)) {
        return res.status(403).json({ mensaje: "Solo el prestador asignado puede iniciar el servicio" });
    }

    if (resultado.servicio.estado !== "programado") {
        return res.status(409).json({ mensaje: "El servicio no está programado" });
    }

    await resultado.servicio.update({ estado: "en-curso", iniciadoEn: new Date() });
    return res.json({ servicio: presentarServicio(resultado.servicio, null, req.user) });
};

export const finalizarServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    if (!esAdministrador(req.user) && Number(resultado.servicio.providerId) !== Number(req.user.id)) {
        return res.status(403).json({ mensaje: "Solo el prestador asignado puede finalizar el servicio" });
    }

    if (resultado.servicio.estado !== "en-curso") {
        return res.status(409).json({ mensaje: "El servicio no está en curso" });
    }

    await resultado.servicio.update({ estado: "finalizado", finalizadoEn: new Date() });
    return res.json({ servicio: presentarServicio(resultado.servicio, null, req.user) });
};

export const guardarUbicacion = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    if (!esAdministrador(req.user) && Number(resultado.servicio.providerId) !== Number(req.user.id)) {
        return res.status(403).json({ mensaje: "Solo el prestador asignado puede enviar ubicaciones" });
    }

    const latitud = Number(req.body.latitud);
    const longitud = Number(req.body.longitud);
    if (!Number.isFinite(latitud) || latitud < -90 || latitud > 90 ||
        !Number.isFinite(longitud) || longitud < -180 || longitud > 180) {
        return res.status(400).json({ mensaje: "Las coordenadas no son válidas" });
    }

    const ubicacion = await Ubicacion.create({
        servicioId: resultado.servicio.id,
        userId: req.user.id,
        latitud,
        longitud
    });

    return res.status(201).json({ ubicacion });
};

export const obtenerUbicacion = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    const ubicacion = await Ubicacion.findOne({
        where: { servicioId: resultado.servicio.id },
        order: [["registradoEn", "DESC"]]
    });

    return res.json({ ubicacion });
};
