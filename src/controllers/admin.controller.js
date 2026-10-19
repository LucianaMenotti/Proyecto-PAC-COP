import { Op } from "sequelize";
import User from "../models/user.model.js";
import Servicio from "../models/servicio.model.js";
import Pago from "../models/pago.model.js";
import { reembolsarPagoDelServicio } from "./pago.controller.js";
import { crearNotificacion } from "./notificacion.controller.js";

const ROLES_VALIDOS = ["dueño", "prestador", "admin", "administrador"];

const ATRIBUTOS_USUARIO = [
  "id",
  "nombre",
  "apellido",
  "dni",
  "email",
  "telefono",
  "zona",
  "rol",
  "vehiculo",
  "servicios",
  "verificado",
  "calificacion",
  "resenas",
  "createdAt",
];

const parsearPaginacion = (query) => {
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 100);
  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);

  return { limite, pagina, offset: (pagina - 1) * limite };
};

export const resumenAdmin = async (req, res) => {
  try {
    const [
      usuarios,
      prestadores,
      verificados,
      programados,
      aceptados,
      enCurso,
      finalizados,
      cancelados,
      pagosRetenidos,
      recaudado,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { rol: "prestador" } }),
      User.count({ where: { verificado: true } }),
      Servicio.count({ where: { estado: "programado" } }),
      Servicio.count({ where: { estado: "aceptado" } }),
      Servicio.count({ where: { estado: "en-curso" } }),
      Servicio.count({ where: { estado: "finalizado" } }),
      Servicio.count({ where: { estado: "cancelado" } }),
      Pago.count({ where: { estado: "retenido" } }),
      Pago.sum("monto", { where: { estado: "liberado" } }),
    ]);

    return res.status(200).json({
      usuarios,
      prestadores,
      verificados,
      servicios: programados + aceptados + enCurso + finalizados + cancelados,
      serviciosPorEstado: {
        programados,
        aceptados,
        enCurso,
        finalizados,
        cancelados,
      },
      pagos: {
        retenidos: pagosRetenidos,
        recaudado: Number(recaudado) || 0,
      },
    });
  } catch (error) {
    console.error("Error al generar el resumen admin:", error);
    return res.status(500).json({ mensaje: "Error al generar el resumen" });
  }
};

export const listarUsuariosAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const where = {};

    if (req.query.rol) {
      if (!ROLES_VALIDOS.includes(req.query.rol)) {
        return res.status(400).json({ mensaje: "Rol inválido" });
      }
      where.rol = req.query.rol;
    }

    if (req.query.verificado !== undefined) {
      where.verificado = req.query.verificado === "true";
    }

    if (req.query.buscar) {
      const buscado = `%${String(req.query.buscar).trim()}%`;
      where[Op.or] = [
        { nombre: { [Op.like]: buscado } },
        { apellido: { [Op.like]: buscado } },
        { email: { [Op.like]: buscado } },
        { dni: { [Op.like]: buscado } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ATRIBUTOS_USUARIO,
      order: [["createdAt", "DESC"]],
      limit: limite,
      offset,
    });

    return res.status(200).json({
      usuarios: rows,
      total: count,
      pagina,
      limite,
      totalPaginas: Math.max(Math.ceil(count / limite), 1),
    });
  } catch (error) {
    console.error("Error al listar usuarios (admin):", error);
    return res.status(500).json({ mensaje: "Error al listar los usuarios" });
  }
};

export const actualizarUsuarioAdmin = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const cambios = {};

    if (req.body.rol !== undefined) {
      if (!ROLES_VALIDOS.includes(req.body.rol)) {
        return res.status(400).json({ mensaje: "Rol inválido" });
      }
      cambios.rol = req.body.rol;
    }

    if (req.body.verificado !== undefined) {
      cambios.verificado = Boolean(req.body.verificado);
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ mensaje: "No se enviaron cambios válidos" });
    }

    await usuario.update(cambios);

    return res.status(200).json({
      mensaje: "Usuario actualizado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        verificado: usuario.verificado,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario (admin):", error);
    return res.status(500).json({ mensaje: "Error al actualizar el usuario" });
  }
};

export const listarServiciosAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const where = {};

    if (req.query.estado) {
      where.estado = req.query.estado;
    }

    const { count, rows } = await Servicio.findAndCountAll({
      where,
      include: [
        { model: User, as: "dueno", attributes: ["id", "nombre", "apellido", "email"] },
        { model: User, as: "prestador", attributes: ["id", "nombre", "apellido", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limite,
      offset,
    });

    return res.status(200).json({
      servicios: rows,
      total: count,
      pagina,
      limite,
      totalPaginas: Math.max(Math.ceil(count / limite), 1),
    });
  } catch (error) {
    console.error("Error al listar servicios (admin):", error);
    return res.status(500).json({ mensaje: "Error al listar los servicios" });
  }
};

export const cancelarServicioAdmin = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    if (["finalizado", "cancelado"].includes(servicio.estado)) {
      return res.status(400).json({
        mensaje: "El servicio ya está finalizado o cancelado",
      });
    }

    const motivo =
      String(req.body.motivo || "").trim() || "Cancelado por administración";

    await servicio.update({
      estado: "cancelado",
      canceladoEn: new Date(),
      motivoCancelacion: motivo,
      reembolso: true,
    });

    const pago = await reembolsarPagoDelServicio(servicio.id);

    const destinatarios = [servicio.ownerId, servicio.providerId].filter(
      (id, index, lista) => id && lista.indexOf(id) === index,
    );

    for (const usuarioId of destinatarios) {
      await crearNotificacion({
        usuarioId,
        tipo: "reserva-cancelada",
        titulo: "Reserva cancelada",
        mensaje: `La reserva #${servicio.id} fue cancelada por administración.`,
        servicioId: servicio.id,
      });
    }

    return res.status(200).json({
      mensaje: "Servicio cancelado correctamente",
      servicio,
      pagoReembolsado: Boolean(pago),
    });
  } catch (error) {
    console.error("Error al cancelar servicio (admin):", error);
    return res.status(500).json({ mensaje: "Error al cancelar el servicio" });
  }
};
