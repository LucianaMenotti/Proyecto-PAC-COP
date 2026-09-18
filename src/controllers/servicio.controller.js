import { Op } from "sequelize";
import Servicio from "../models/servicio.model.js";
import Ubicacion from "../models/ubicacion.model.js";

const esAdministrador = (user) => ["admin", "administrador"].includes(user.rol);

const puedeAcceder = (servicio, user) =>
    esAdministrador(user) ||
    Number(servicio.ownerId) === Number(user.id) ||
    Number(servicio.providerId) === Number(user.id);

const presentarServicio = (servicio, ubicacion = null) => ({
    id: servicio.id,
    prestador: servicio.prestadorNombre,
    tipo: servicio.tipo,
    mascota: servicio.mascotaNombre,
    monto: Number(servicio.monto),
    estado: servicio.estado,
    horaProgramada: servicio.horaProgramada,
    iniciadoEn: servicio.iniciadoEn,
    finalizadoEn: servicio.finalizadoEn,
    ultimaUbicacion: ubicacion
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
    const servicioExistente = await Servicio.findOne({
        where: {
            ownerId: req.user.id,
            estado: { [Op.in]: ["programado", "en-curso"] }
        },
        order: [["id", "DESC"]]
    });

    if (servicioExistente) {
        return res.json({ servicio: presentarServicio(servicioExistente) });
    }

    const servicio = await Servicio.create({
        ownerId: req.user.id,
        prestadorNombre: "Julieta Ramos",
        tipo: "Paseo · 1 hora",
        mascotaNombre: "Toby",
        monto: 4500,
        estado: "programado",
        horaProgramada: new Date(Date.now() + 60 * 60 * 1000)
    });

    return res.status(201).json({ servicio: presentarServicio(servicio) });
};

export const obtenerServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    const ubicacion = await Ubicacion.findOne({
        where: { servicioId: resultado.servicio.id },
        order: [["registradoEn", "DESC"]]
    });

    return res.json({ servicio: presentarServicio(resultado.servicio, ubicacion) });
};

export const iniciarServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    if (resultado.servicio.estado !== "programado") {
        return res.status(409).json({ mensaje: "El servicio no está programado" });
    }

    await resultado.servicio.update({ estado: "en-curso", iniciadoEn: new Date() });
    return res.json({ servicio: presentarServicio(resultado.servicio) });
};

export const finalizarServicio = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

    if (resultado.servicio.estado !== "en-curso") {
        return res.status(409).json({ mensaje: "El servicio no está en curso" });
    }

    await resultado.servicio.update({ estado: "finalizado", finalizadoEn: new Date() });
    return res.json({ servicio: presentarServicio(resultado.servicio) });
};

export const guardarUbicacion = async (req, res) => {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) return res.status(resultado.error.status).json({ mensaje: resultado.error.mensaje });

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
