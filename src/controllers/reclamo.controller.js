import fs from "node:fs/promises";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import Reclamo from "../models/reclamo.model.js";
import Notificacion from "../models/notificacion.model.js";
import Servicio from "../models/servicio.model.js";
import User from "../models/user.model.js";
import { RUTA_PUBLICA_EVIDENCIAS } from "../middlewares/upload.middleware.js";

const ROLES_ADMIN = ["admin", "administrador"];
const ESTADOS = ["pendiente", "en-revision", "finalizado"];
const ORDEN_ESTADOS = { pendiente: 0, "en-revision": 1, finalizado: 2 };
const TEXTO_ESTADOS = {
  "en-revision": "pasó a estar En revisión",
  finalizado: "fue finalizado",
};

const INCLUDE_RECLAMO = [
  {
    model: Servicio,
    as: "servicio",
    attributes: ["id", "tipo", "mascotaNombre", "prestadorNombre"],
  },
  {
    model: User,
    as: "reclamante",
    attributes: ["id", "nombre", "apellido", "rol"],
  },
  {
    model: User,
    as: "reclamado",
    attributes: ["id", "nombre", "apellido", "rol"],
  },
];

const esAdministrador = (user) => ROLES_ADMIN.includes(user.rol);

const nombreCompleto = (user) => `${user.nombre} ${user.apellido}`;

const borrarArchivos = async (archivos = []) => {
  await Promise.all(
    archivos.map((archivo) => fs.unlink(archivo.path).catch(() => null)),
  );
};

const leerEvidencias = (valor) => {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    try {
      const resultado = JSON.parse(valor);
      return Array.isArray(resultado) ? resultado : [];
    } catch {
      return [];
    }
  }

  return [];
};

const presentarPersona = (persona) =>
  persona
    ? { id: persona.id, nombre: nombreCompleto(persona), rol: persona.rol }
    : null;

const presentarReclamo = (reclamo, user) => ({
  id: reclamo.id,
  servicioId: reclamo.servicioId,
  estado: reclamo.estado,
  descripcion: reclamo.descripcion,
  evidencias: leerEvidencias(reclamo.evidencias),
  creadoEn: reclamo.createdAt,
  actualizadoEn: reclamo.updatedAt,
  soyReclamante: Number(reclamo.reclamanteId) === Number(user.id),
  servicio: reclamo.servicio
    ? {
        id: reclamo.servicio.id,
        tipo: reclamo.servicio.tipo,
        mascota: reclamo.servicio.mascotaNombre,
        prestador: reclamo.servicio.prestadorNombre,
      }
    : null,
  reclamante: presentarPersona(reclamo.reclamante),
  reclamado: presentarPersona(reclamo.reclamado),
});

export const crearReclamo = async (req, res) => {
  const archivos = req.files || [];

  const rechazar = async (status, mensaje) => {
    await borrarArchivos(archivos);
    return res.status(status).json({ mensaje });
  };

  try {
    if (esAdministrador(req.user)) {
      return rechazar(403, "El administrador no puede abrir reclamos");
    }

    const descripcion = String(req.body.descripcion || "").trim();

    if (descripcion.length < 10 || descripcion.length > 2000) {
      return rechazar(
        400,
        "La descripción debe tener entre 10 y 2000 caracteres",
      );
    }

    const servicio = await Servicio.findByPk(req.body.servicioId);

    if (!servicio) {
      return rechazar(404, "Servicio no encontrado");
    }

    const esDueno = Number(servicio.ownerId) === Number(req.user.id);
    const esPrestador = Number(servicio.providerId) === Number(req.user.id);

    if (!esDueno && !esPrestador) {
      return rechazar(403, "No participaste en este servicio");
    }

    if (servicio.estado !== "finalizado") {
      return rechazar(409, "Solo podés reclamar servicios finalizados");
    }

    const reclamadoId = esDueno ? servicio.providerId : servicio.ownerId;

    if (!reclamadoId) {
      return rechazar(409, "El servicio no tiene una contraparte asignada");
    }

    const reclamoExistente = await Reclamo.findOne({
      where: { servicioId: servicio.id, reclamanteId: req.user.id },
    });

    if (reclamoExistente) {
      return rechazar(409, "Ya abriste un reclamo para este servicio");
    }

    const administradores = await User.findAll({
      where: { rol: { [Op.in]: ROLES_ADMIN } },
      attributes: ["id"],
    });

    const nombre = nombreCompleto(req.user);

    const reclamo = await sequelize.transaction(async (transaccion) => {
      const nuevo = await Reclamo.create(
        {
          servicioId: servicio.id,
          reclamanteId: req.user.id,
          reclamadoId,
          descripcion,
          evidencias: archivos.map(
            (archivo) => `${RUTA_PUBLICA_EVIDENCIAS}/${archivo.filename}`,
          ),
          estado: "pendiente",
        },
        { transaction: transaccion },
      );

      const base = {
        tipo: "reclamo-nuevo",
        reclamoId: nuevo.id,
        servicioId: servicio.id,
      };

      const notificaciones = [
        ...administradores.map((administrador) => ({
          ...base,
          userId: administrador.id,
          titulo: `Nuevo reclamo #${nuevo.id}`,
          mensaje: `${nombre} abrió un reclamo sobre el servicio #${servicio.id} (${servicio.tipo}, ${servicio.mascotaNombre}).`,
        })),
        {
          ...base,
          userId: reclamadoId,
          titulo: "Recibiste un reclamo",
          mensaje: `${nombre} abrió un reclamo sobre el servicio #${servicio.id}. La administración lo revisará.`,
        },
      ];

      await Notificacion.bulkCreate(notificaciones, {
        transaction: transaccion,
      });

      return nuevo;
    });

    const completo = await Reclamo.findByPk(reclamo.id, {
      include: INCLUDE_RECLAMO,
    });

    return res.status(201).json({
      mensaje: "Reclamo enviado correctamente",
      reclamo: presentarReclamo(completo, req.user),
    });
  } catch (error) {
    console.error("Error al crear el reclamo:", error);
    await borrarArchivos(archivos);

    return res.status(500).json({ mensaje: "No se pudo crear el reclamo" });
  }
};

export const listarReclamos = async (req, res) => {
  try {
    const where = esAdministrador(req.user)
      ? {}
      : {
          [Op.or]: [
            { reclamanteId: req.user.id },
            { reclamadoId: req.user.id },
          ],
        };

    const reclamos = await Reclamo.findAll({
      where,
      include: INCLUDE_RECLAMO,
      order: [["id", "DESC"]],
    });

    return res.json({
      reclamos: reclamos.map((reclamo) => presentarReclamo(reclamo, req.user)),
    });
  } catch (error) {
    console.error("Error al listar reclamos:", error);

    return res
      .status(500)
      .json({ mensaje: "No se pudieron obtener los reclamos" });
  }
};

export const actualizarEstadoReclamo = async (req, res) => {
  try {
    if (!esAdministrador(req.user)) {
      return res.status(403).json({
        mensaje: "Solo el administrador puede cambiar el estado de un reclamo",
      });
    }

    const estado = String(req.body.estado || "");

    if (!ESTADOS.includes(estado)) {
      return res
        .status(400)
        .json({ mensaje: "El estado indicado no es válido" });
    }

    const reclamo = await Reclamo.findByPk(req.params.id);

    if (!reclamo) {
      return res.status(404).json({ mensaje: "Reclamo no encontrado" });
    }

    if (ORDEN_ESTADOS[estado] <= ORDEN_ESTADOS[reclamo.estado]) {
      return res.status(409).json({
        mensaje: "El reclamo ya está en ese estado o en uno posterior",
      });
    }

    await sequelize.transaction(async (transaccion) => {
      await reclamo.update({ estado }, { transaction: transaccion });

      const destinatarios = [reclamo.reclamanteId, reclamo.reclamadoId];

      await Notificacion.bulkCreate(
        destinatarios.map((userId) => ({
          userId,
          tipo: "reclamo-estado",
          titulo: `Actualización del reclamo #${reclamo.id}`,
          mensaje: `El reclamo #${reclamo.id} ${TEXTO_ESTADOS[estado]}.`,
          reclamoId: reclamo.id,
          servicioId: reclamo.servicioId,
        })),
        { transaction: transaccion },
      );
    });

    const completo = await Reclamo.findByPk(reclamo.id, {
      include: INCLUDE_RECLAMO,
    });

    return res.json({
      mensaje: "Estado del reclamo actualizado",
      reclamo: presentarReclamo(completo, req.user),
    });
  } catch (error) {
    console.error("Error al actualizar el reclamo:", error);

    return res
      .status(500)
      .json({ mensaje: "No se pudo actualizar el reclamo" });
  }
};
