import path from "node:path";
import fs from "node:fs";
import { Op, fn, col } from "sequelize";
import User from "../models/user.model.js";
import Servicio from "../models/servicio.model.js";
import Pago from "../models/pago.model.js";
import Mascota from "../models/mascota.model.js";
import Reclamo from "../models/reclamo.model.js";
import Calificacion from "../models/calificacion.model.js";
import AccionAdmin from "../models/accionAdmin.model.js";
import Reporte from "../models/reporte.model.js";
import { reembolsarPagoDelServicio } from "./pago.controller.js";
import { crearNotificacion } from "./notificacion.controller.js";
import { ROLES_ADMIN, esAdministrador } from "../middlewares/admin.middleware.js";
import { CARPETA_DOCUMENTOS } from "../middlewares/upload.middleware.js";
import { registrarAccion } from "../helpers/auditoria.helper.js";
import {
  ESTADOS_APROBACION,
  ESTADOS_CUENTA,
  condicionCuentaActiva,
  leerDocumentos,
  resumenDocumentacion,
} from "../helpers/cuenta.helper.js";
import {
  TIPOS_SERVICIO,
  parsearRango,
  resumirServicios,
} from "../helpers/metricas.helper.js";

const ROLES_VALIDOS = ["dueño", "prestador", ...ROLES_ADMIN];

// El administrador puede intervenir un servicio mientras no esté cerrado
const ESTADOS_CANCELABLES_ADMIN = ["programado", "aceptado", "en-curso"];

// Reservas que se cancelan al suspender una cuenta (todavía no empezaron)
const ESTADOS_RESERVA_FUTURA = ["programado", "aceptado"];

const DOCUMENTOS_VALIDOS = ["documento", "selfie", "cv"];

const MIN_MOTIVO = 5;

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
  "estadoAprobacion",
  "estadoCuenta",
  "createdAt",
];

// Todo el perfil salvo credenciales y tokens de recuperación
const ATRIBUTOS_LEGAJO = {
  exclude: ["password", "resetTokenHash", "resetExpira"],
};

const parsearPaginacion = (query) => {
  const limite = Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 100);
  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);

  return { limite, pagina, offset: (pagina - 1) * limite };
};

const respuestaPaginada = (clave, filas, total, pagina, limite) => ({
  [clave]: filas,
  total,
  pagina,
  limite,
  totalPaginas: Math.max(Math.ceil(total / limite), 1),
});

const nombreCompleto = (usuario) =>
  usuario ? `${usuario.nombre} ${usuario.apellido}`.trim() : "";

const leerMotivo = (valor) => String(valor ?? "").trim().slice(0, 255);

const condicionTipo = (tipo) => {
  if (!tipo) return {};

  if (!TIPOS_SERVICIO.includes(tipo)) {
    throw new Error("Tipo de servicio inválido");
  }

  return { tipo: { [Op.like]: `${tipo}%` } };
};

// Cancela con reembolso una reserva y avisa a las dos partes
const cancelarConReembolso = async (servicio, motivo) => {
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
      mensaje: `La reserva #${servicio.id} fue cancelada por administración. Motivo: ${motivo}`,
      servicioId: servicio.id,
    });
  }

  return pago;
};

// GET /api/admin/resumen?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&tipo=Paseo|Guarderia|Traslado
// Indicadores de las reservas creadas en el rango (historia: panel de métricas).
export const resumenAdmin = async (req, res) => {
  let rango;
  let filtroTipo;

  try {
    rango = parsearRango(req.query);
    filtroTipo = condicionTipo(req.query.tipo);
  } catch (error) {
    return res.status(400).json({ mensaje: error.message });
  }

  try {
    const whereServicios = {
      createdAt: { [Op.between]: [rango.desde, rango.hasta] },
      ...filtroTipo,
    };

    const [
      filasServicios,
      filasPagos,
      prestadoresActivos,
      usuariosPorRol,
      prestadoresPorEstado,
      suspendidos,
      nuevosUsuarios,
      reclamosAbiertos,
      reportesPendientes,
    ] = await Promise.all([
      Servicio.findAll({
        attributes: [
          "tipo",
          "estado",
          [fn("COUNT", col("id")), "cantidad"],
          [fn("SUM", col("monto")), "monto"],
        ],
        where: whereServicios,
        group: ["tipo", "estado"],
        raw: true,
      }),
      Pago.findAll({
        attributes: [
          "estado",
          [fn("COUNT", col("Pago.id")), "cantidad"],
          [fn("SUM", col("Pago.monto")), "monto"],
        ],
        include: [{ model: Servicio, attributes: [], where: whereServicios }],
        group: ["Pago.estado"],
        raw: true,
      }),
      // Prestadores con al menos una reserva aceptada, en curso o finalizada en el rango
      Servicio.count({
        distinct: true,
        col: "providerId",
        where: {
          ...whereServicios,
          estado: { [Op.in]: ["aceptado", "en-curso", "finalizado"] },
        },
      }),
      User.findAll({
        attributes: ["rol", [fn("COUNT", col("id")), "cantidad"]],
        group: ["rol"],
        raw: true,
      }),
      User.findAll({
        attributes: ["estadoAprobacion", [fn("COUNT", col("id")), "cantidad"]],
        where: { rol: "prestador" },
        group: ["estadoAprobacion"],
        raw: true,
      }),
      User.count({ where: { estadoCuenta: "suspendida" } }),
      User.count({
        where: { createdAt: { [Op.between]: [rango.desde, rango.hasta] } },
      }),
      Reclamo.count({ where: { estado: { [Op.ne]: "finalizado" } } }),
      Reporte.count({ where: { estado: "pendiente" } }),
    ]);

    const servicios = resumirServicios(filasServicios);

    const pagos = Object.fromEntries(
      filasPagos.map((fila) => [
        fila.estado,
        { cantidad: Number(fila.cantidad) || 0, monto: Number(fila.monto) || 0 },
      ]),
    );

    const roles = Object.fromEntries(
      usuariosPorRol.map((fila) => [fila.rol, Number(fila.cantidad) || 0]),
    );

    const aprobacion = Object.fromEntries(
      prestadoresPorEstado.map((fila) => [
        fila.estadoAprobacion || "pendiente",
        Number(fila.cantidad) || 0,
      ]),
    );

    return res.status(200).json({
      rango: {
        desde: rango.desde,
        hasta: rango.hasta,
        tipo: req.query.tipo || null,
      },
      reservas: {
        total: servicios.total,
        porEstado: servicios.porEstado,
        porTipo: servicios.porTipo,
      },
      ingresos: {
        // Liberado: cobrado por los prestadores. Retenido: en custodia. Reembolsado: devuelto a dueños.
        liberado: pagos.liberado?.monto || 0,
        retenido: pagos.retenido?.monto || 0,
        reembolsado: pagos.reembolsado?.monto || 0,
        pagosConfirmados:
          (pagos.liberado?.cantidad || 0) + (pagos.retenido?.cantidad || 0),
      },
      prestadores: {
        activosEnRango: prestadoresActivos,
        aprobados: aprobacion.aprobado || 0,
        pendientes: aprobacion.pendiente || 0,
        rechazados: aprobacion.rechazado || 0,
      },
      usuarios: {
        total: Object.values(roles).reduce((suma, valor) => suma + valor, 0),
        duenos: roles["dueño"] || 0,
        prestadores: roles.prestador || 0,
        administradores: ROLES_ADMIN.reduce((suma, rol) => suma + (roles[rol] || 0), 0),
        suspendidos,
        nuevosEnRango: nuevosUsuarios,
      },
      moderacion: {
        reclamosAbiertos,
        reportesPendientes,
      },
    });
  } catch (error) {
    console.error("Error al generar el resumen admin:", error);
    return res.status(500).json({ mensaje: "Error al generar el resumen" });
  }
};

// GET /api/admin/usuarios?pagina=&limite=&buscar=&rol=&estadoAprobacion=&estadoCuenta=
export const listarUsuariosAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const condiciones = [];

    if (req.query.rol) {
      if (!ROLES_VALIDOS.includes(req.query.rol)) {
        return res.status(400).json({ mensaje: "Rol inválido" });
      }

      // "admin" agrupa los dos nombres de rol administrativo
      condiciones.push({
        rol: ROLES_ADMIN.includes(req.query.rol) ? { [Op.in]: ROLES_ADMIN } : req.query.rol,
      });
    }

    if (req.query.estadoAprobacion) {
      if (!ESTADOS_APROBACION.includes(req.query.estadoAprobacion)) {
        return res.status(400).json({ mensaje: "Estado de aprobación inválido" });
      }
      condiciones.push({ rol: "prestador", estadoAprobacion: req.query.estadoAprobacion });
    }

    if (req.query.estadoCuenta) {
      if (!ESTADOS_CUENTA.includes(req.query.estadoCuenta)) {
        return res.status(400).json({ mensaje: "Estado de cuenta inválido" });
      }
      condiciones.push(
        req.query.estadoCuenta === "activa"
          ? condicionCuentaActiva()
          : { estadoCuenta: "suspendida" },
      );
    }

    if (req.query.buscar) {
      const buscado = `%${String(req.query.buscar).trim()}%`;
      condiciones.push({
        [Op.or]: [
          { nombre: { [Op.like]: buscado } },
          { apellido: { [Op.like]: buscado } },
          { email: { [Op.like]: buscado } },
          { dni: { [Op.like]: buscado } },
        ],
      });
    }

    // Los pendientes de aprobación se atienden por orden de llegada
    const orden =
      req.query.estadoAprobacion === "pendiente"
        ? [["updatedAt", "ASC"]]
        : [["createdAt", "DESC"]];

    const { count, rows } = await User.findAndCountAll({
      where: condiciones.length ? { [Op.and]: condiciones } : {},
      attributes: [...ATRIBUTOS_USUARIO, "documentos", "experiencia", "motivoRechazo"],
      order: orden,
      limit: limite,
      offset,
    });

    const usuarios = rows.map((usuario) => {
      const { documentos, ...datos } = usuario.toJSON();

      return datos.rol === "prestador"
        ? { ...datos, documentacion: resumenDocumentacion(documentos) }
        : datos;
    });

    return res
      .status(200)
      .json(respuestaPaginada("usuarios", usuarios, count, pagina, limite));
  } catch (error) {
    console.error("Error al listar usuarios (admin):", error);
    return res.status(500).json({ mensaje: "Error al listar los usuarios" });
  }
};

// PUT /api/admin/usuarios/:id { rol }
export const actualizarUsuarioAdmin = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const rol = req.body.rol;

    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ mensaje: "Rol inválido" });
    }

    if (rol === usuario.rol) {
      return res.status(400).json({ mensaje: "El usuario ya tiene ese rol" });
    }

    const pierdeAdministracion = esAdministrador(usuario) && !ROLES_ADMIN.includes(rol);

    if (pierdeAdministracion && Number(usuario.id) === Number(req.user.id)) {
      return res
        .status(409)
        .json({ mensaje: "No podés quitarte a vos mismo el rol de administrador" });
    }

    if (pierdeAdministracion) {
      const administradores = await User.count({
        where: { rol: { [Op.in]: ROLES_ADMIN } },
      });

      if (administradores <= 1) {
        return res
          .status(409)
          .json({ mensaje: "La plataforma debe conservar al menos un administrador" });
      }
    }

    const cambios = { rol };

    // Un prestador nuevo, aunque venga de otro rol, pasa por la verificación
    if (rol === "prestador" && !usuario.estadoAprobacion) {
      cambios.estadoAprobacion = "pendiente";
    }

    const rolAnterior = usuario.rol;
    await usuario.update(cambios);

    await registrarAccion({
      admin: req.user,
      accion: "cambio-rol",
      entidad: "usuario",
      entidadId: usuario.id,
      detalle: { anterior: rolAnterior, nuevo: rol },
    });

    return res.status(200).json({
      mensaje: "Rol actualizado correctamente",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
        estadoAprobacion: usuario.estadoAprobacion,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario (admin):", error);
    return res.status(500).json({ mensaje: "Error al actualizar el usuario" });
  }
};

// GET /api/admin/usuarios/:id
// Legajo completo: datos, documentación, servicios, reseñas, reclamos y acciones de la administración.
export const obtenerLegajoAdmin = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.params.id, {
      attributes: ATRIBUTOS_LEGAJO,
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const id = usuario.id;
    const participaEn = { [Op.or]: [{ ownerId: id }, { providerId: id }] };

    const [
      porEstado,
      servicios,
      cobrado,
      pagado,
      calificaciones,
      reclamos,
      mascotas,
      acciones,
      reportes,
    ] = await Promise.all([
      Servicio.findAll({
        attributes: ["estado", [fn("COUNT", col("id")), "cantidad"]],
        where: participaEn,
        group: ["estado"],
        raw: true,
      }),
      Servicio.findAll({
        where: participaEn,
        include: [
          { model: User, as: "dueno", attributes: ["id", "nombre", "apellido"] },
          { model: User, as: "prestador", attributes: ["id", "nombre", "apellido"] },
        ],
        order: [["horaProgramada", "DESC"]],
        limit: 30,
      }),
      Pago.sum("monto", { where: { providerId: id, estado: "liberado" } }),
      Pago.sum("monto", {
        where: { ownerId: id, estado: { [Op.in]: ["retenido", "liberado"] } },
      }),
      Calificacion.findAll({
        where: { [Op.or]: [{ providerId: id }, { ownerId: id }] },
        include: [
          { model: User, as: "dueno", attributes: ["id", "nombre", "apellido"] },
          { model: User, as: "prestador", attributes: ["id", "nombre", "apellido"] },
        ],
        order: [["id", "DESC"]],
      }),
      Reclamo.findAll({
        where: { [Op.or]: [{ reclamanteId: id }, { reclamadoId: id }] },
        include: [
          { model: User, as: "reclamante", attributes: ["id", "nombre", "apellido"] },
          { model: User, as: "reclamado", attributes: ["id", "nombre", "apellido"] },
        ],
        order: [["id", "DESC"]],
      }),
      usuario.rol === "dueño"
        ? Mascota.findAll({
            where: { userId: id },
            attributes: ["id", "nombre", "especie", "raza", "tamano", "edad"],
          })
        : [],
      AccionAdmin.findAll({
        where: { entidad: "usuario", entidadId: id },
        include: [{ model: User, as: "admin", attributes: ["id", "nombre", "apellido"] }],
        order: [["id", "DESC"]],
        limit: 50,
      }),
      Reporte.findAll({
        where: { reportadoId: id },
        include: [{ model: User, as: "reportante", attributes: ["id", "nombre", "apellido"] }],
        order: [["id", "DESC"]],
      }),
    ]);

    const { documentos, ...datos } = usuario.toJSON();

    return res.status(200).json({
      usuario: {
        ...datos,
        documentacion: resumenDocumentacion(documentos),
      },
      estadisticas: {
        serviciosPorEstado: Object.fromEntries(
          porEstado.map((fila) => [fila.estado, Number(fila.cantidad) || 0]),
        ),
        cobradoComoPrestador: Number(cobrado) || 0,
        pagadoComoDueno: Number(pagado) || 0,
        reclamosRecibidos: reclamos.filter((item) => Number(item.reclamadoId) === id).length,
        reportesRecibidos: reportes.length,
      },
      servicios: servicios.map((servicio) => ({
        id: servicio.id,
        tipo: servicio.tipo,
        estado: servicio.estado,
        monto: Number(servicio.monto),
        horaProgramada: servicio.horaProgramada,
        mascota: servicio.mascotaNombre,
        rolEnServicio: Number(servicio.providerId) === id ? "prestador" : "dueño",
        dueno: nombreCompleto(servicio.dueno),
        prestador: nombreCompleto(servicio.prestador) || servicio.prestadorNombre,
      })),
      calificaciones: calificaciones.map((calificacion) => ({
        id: calificacion.id,
        servicioId: calificacion.servicioId,
        puntuacion: calificacion.puntuacion,
        comentario: calificacion.comentario,
        recibida: Number(calificacion.providerId) === id,
        autor: nombreCompleto(calificacion.dueno),
        prestador: nombreCompleto(calificacion.prestador),
        oculta: Boolean(calificacion.oculta),
        fecha: calificacion.createdAt,
      })),
      reclamos: reclamos.map((reclamo) => ({
        id: reclamo.id,
        servicioId: reclamo.servicioId,
        estado: reclamo.estado,
        descripcion: reclamo.descripcion,
        recibido: Number(reclamo.reclamadoId) === id,
        reclamante: nombreCompleto(reclamo.reclamante),
        reclamado: nombreCompleto(reclamo.reclamado),
        fecha: reclamo.createdAt,
      })),
      mascotas,
      reportes: reportes.map((reporte) => ({
        id: reporte.id,
        tipo: reporte.tipo,
        motivo: reporte.motivo,
        detalle: reporte.detalle,
        estado: reporte.estado,
        reportante: nombreCompleto(reporte.reportante),
        fecha: reporte.createdAt,
      })),
      acciones: acciones.map((accion) => ({
        id: accion.id,
        accion: accion.accion,
        motivo: accion.motivo,
        detalle: accion.detalle,
        admin: nombreCompleto(accion.admin),
        fecha: accion.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error al obtener el legajo:", error);
    return res.status(500).json({ mensaje: "No se pudo obtener el legajo" });
  }
};

// GET /api/admin/usuarios/:id/documentos/:tipo (documento, selfie o cv)
// Los documentos de identidad solo se entregan a la administración.
export const descargarDocumentoAdmin = async (req, res) => {
  try {
    const tipo = String(req.params.tipo);

    if (!DOCUMENTOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ mensaje: "Tipo de documento inválido" });
    }

    const usuario = await User.findByPk(req.params.id, { attributes: ["id", "documentos"] });
    const archivo = leerDocumentos(usuario?.documentos)[tipo];

    if (!archivo) {
      return res.status(404).json({ mensaje: "El usuario no cargó ese documento" });
    }

    const ruta = path.join(CARPETA_DOCUMENTOS, path.basename(archivo));

    if (!fs.existsSync(ruta)) {
      return res.status(404).json({ mensaje: "El archivo ya no está disponible" });
    }

    res.set("Cache-Control", "private, no-store");
    return res.sendFile(ruta);
  } catch (error) {
    console.error("Error al entregar el documento:", error);
    return res.status(500).json({ mensaje: "No se pudo obtener el documento" });
  }
};

// POST /api/admin/usuarios/:id/aprobacion { decision: "aprobado" | "rechazado", motivo }
// Historia: aprobación de prestadores. El motivo es opcional en el rechazo.
export const resolverAprobacion = async (req, res) => {
  try {
    const decision = String(req.body.decision ?? "");
    const motivo = leerMotivo(req.body.motivo);

    if (!["aprobado", "rechazado"].includes(decision)) {
      return res.status(400).json({ mensaje: "La decisión debe ser aprobado o rechazado" });
    }

    const prestador = await User.findByPk(req.params.id);

    if (!prestador || prestador.rol !== "prestador") {
      return res.status(404).json({ mensaje: "Prestador no encontrado" });
    }

    if (prestador.estadoAprobacion === decision) {
      return res.status(409).json({ mensaje: `El prestador ya está ${decision}` });
    }

    const documentacion = resumenDocumentacion(prestador.documentos);

    if (decision === "aprobado" && (!documentacion.documento || !documentacion.selfie)) {
      return res.status(409).json({
        mensaje: "No se puede aprobar sin la foto del documento y la selfie de validación",
      });
    }

    const anterior = prestador.estadoAprobacion;

    await prestador.update({
      estadoAprobacion: decision,
      verificado: decision === "aprobado",
      motivoRechazo: decision === "rechazado" ? motivo || null : null,
      aprobacionRevisadaEn: new Date(),
    });

    await crearNotificacion({
      usuarioId: prestador.id,
      tipo: decision === "aprobado" ? "cuenta-aprobada" : "cuenta-rechazada",
      titulo: decision === "aprobado" ? "Perfil aprobado" : "Documentación rechazada",
      mensaje:
        decision === "aprobado"
          ? "La administración verificó tu identidad. Tu perfil ya aparece en el buscador."
          : `La administración rechazó tu documentación.${motivo ? ` Motivo: ${motivo}` : ""} Podés volver a enviarla desde tu panel.`,
    });

    await registrarAccion({
      admin: req.user,
      accion: decision === "aprobado" ? "aprobacion-prestador" : "rechazo-prestador",
      entidad: "usuario",
      entidadId: prestador.id,
      motivo: motivo || null,
      detalle: { anterior: anterior || "pendiente" },
    });

    return res.status(200).json({
      mensaje: decision === "aprobado" ? "Prestador aprobado" : "Prestador rechazado",
      usuario: {
        id: prestador.id,
        estadoAprobacion: prestador.estadoAprobacion,
        motivoRechazo: prestador.motivoRechazo,
        verificado: prestador.verificado,
      },
    });
  } catch (error) {
    console.error("Error al resolver la aprobación:", error);
    return res.status(500).json({ mensaje: "No se pudo registrar la decisión" });
  }
};

// POST /api/admin/usuarios/:id/suspension { suspender: boolean, motivo, cancelarReservas }
// Una cuenta suspendida no puede iniciar sesión ni usar la API.
export const cambiarSuspension = async (req, res) => {
  try {
    const suspender = req.body.suspender === true;
    const motivo = leerMotivo(req.body.motivo);
    const usuario = await User.findByPk(req.params.id);

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (Number(usuario.id) === Number(req.user.id)) {
      return res.status(409).json({ mensaje: "No podés suspender tu propia cuenta" });
    }

    if (esAdministrador(usuario)) {
      return res.status(409).json({
        mensaje: "Para suspender a un administrador primero cambiá su rol",
      });
    }

    const suspendido = usuario.estadoCuenta === "suspendida";

    if (suspender === suspendido) {
      return res.status(409).json({
        mensaje: suspender ? "La cuenta ya está suspendida" : "La cuenta ya está activa",
      });
    }

    if (suspender && motivo.length < MIN_MOTIVO) {
      return res
        .status(400)
        .json({ mensaje: "Indicá el motivo de la suspensión (al menos 5 caracteres)" });
    }

    let canceladas = [];

    if (suspender) {
      await usuario.update({
        estadoCuenta: "suspendida",
        motivoSuspension: motivo,
        suspendidoEn: new Date(),
      });

      // Las reservas que todavía no empezaron se cancelan con reembolso
      if (req.body.cancelarReservas !== false) {
        const pendientes = await Servicio.findAll({
          where: {
            estado: { [Op.in]: ESTADOS_RESERVA_FUTURA },
            [Op.or]: [{ ownerId: usuario.id }, { providerId: usuario.id }],
          },
        });

        for (const servicio of pendientes) {
          await cancelarConReembolso(servicio, "Cuenta de una de las partes suspendida");
        }

        canceladas = pendientes.map((servicio) => servicio.id);
      }
    } else {
      await usuario.update({
        estadoCuenta: "activa",
        motivoSuspension: null,
        suspendidoEn: null,
      });

      await crearNotificacion({
        usuarioId: usuario.id,
        tipo: "cuenta-reactivada",
        titulo: "Cuenta reactivada",
        mensaje: "La administración reactivó tu cuenta.",
      });
    }

    await registrarAccion({
      admin: req.user,
      accion: suspender ? "suspension-cuenta" : "reactivacion-cuenta",
      entidad: "usuario",
      entidadId: usuario.id,
      motivo: motivo || null,
      detalle: canceladas.length ? { reservasCanceladas: canceladas } : null,
    });

    return res.status(200).json({
      mensaje: suspender
        ? `Cuenta suspendida${canceladas.length ? ` y ${canceladas.length} reserva(s) cancelada(s)` : ""}`
        : "Cuenta reactivada",
      usuario: {
        id: usuario.id,
        estadoCuenta: usuario.estadoCuenta,
        motivoSuspension: usuario.motivoSuspension,
      },
      reservasCanceladas: canceladas,
    });
  } catch (error) {
    console.error("Error al cambiar la suspensión:", error);
    return res.status(500).json({ mensaje: "No se pudo actualizar la cuenta" });
  }
};

// GET /api/admin/servicios?pagina=&limite=&estado=&tipo=&usuarioId=
export const listarServiciosAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    let where;

    try {
      where = condicionTipo(req.query.tipo);
    } catch (error) {
      return res.status(400).json({ mensaje: error.message });
    }

    if (req.query.estado) {
      where.estado = req.query.estado;
    }

    const usuarioId = Number(req.query.usuarioId);

    if (Number.isInteger(usuarioId) && usuarioId > 0) {
      where[Op.or] = [{ ownerId: usuarioId }, { providerId: usuarioId }];
    }

    const { count, rows } = await Servicio.findAndCountAll({
      where,
      include: [
        { model: User, as: "dueno", attributes: ["id", "nombre", "apellido", "email"] },
        { model: User, as: "prestador", attributes: ["id", "nombre", "apellido", "email"] },
        { model: Pago, as: "pago", attributes: ["id", "estado"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: limite,
      offset,
      distinct: true,
    });

    return res
      .status(200)
      .json(respuestaPaginada("servicios", rows, count, pagina, limite));
  } catch (error) {
    console.error("Error al listar servicios (admin):", error);
    return res.status(500).json({ mensaje: "Error al listar los servicios" });
  }
};

// POST /api/admin/servicios/:id/cancelar { motivo }
export const cancelarServicioAdmin = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    if (!ESTADOS_CANCELABLES_ADMIN.includes(servicio.estado)) {
      return res.status(409).json({
        mensaje: "Solo se cancelan servicios programados, aceptados o en curso",
      });
    }

    const motivo = leerMotivo(req.body.motivo) || "Cancelado por administración";
    const estadoAnterior = servicio.estado;
    const pago = await cancelarConReembolso(servicio, motivo);

    await registrarAccion({
      admin: req.user,
      accion: "cancelacion-servicio",
      entidad: "servicio",
      entidadId: servicio.id,
      motivo,
      detalle: { estadoAnterior, pagoReembolsado: Boolean(pago) },
    });

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

// GET /api/admin/acciones?pagina=&limite=&entidad=
export const listarAccionesAdmin = async (req, res) => {
  try {
    const { limite, pagina, offset } = parsearPaginacion(req.query);
    const where = req.query.entidad ? { entidad: String(req.query.entidad) } : {};

    const { count, rows } = await AccionAdmin.findAndCountAll({
      where,
      include: [{ model: User, as: "admin", attributes: ["id", "nombre", "apellido"] }],
      order: [["id", "DESC"]],
      limit: limite,
      offset,
    });

    const acciones = rows.map((accion) => ({
      id: accion.id,
      accion: accion.accion,
      entidad: accion.entidad,
      entidadId: accion.entidadId,
      motivo: accion.motivo,
      detalle: accion.detalle,
      admin: nombreCompleto(accion.admin),
      fecha: accion.createdAt,
    }));

    return res
      .status(200)
      .json(respuestaPaginada("acciones", acciones, count, pagina, limite));
  } catch (error) {
    console.error("Error al listar acciones (admin):", error);
    return res.status(500).json({ mensaje: "No se pudo obtener el registro de acciones" });
  }
};
