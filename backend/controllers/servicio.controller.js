import { Op } from "sequelize";
import Servicio from "../models/servicio.model.js";
import Ubicacion from "../models/ubicacion.model.js";
import Calificacion from "../models/calificacion.model.js";
import User from "../models/user.model.js";
import Mascota from "../models/mascota.model.js";
import {
  liberarPagoDelServicio,
  reembolsarPagoDelServicio,
} from "./pago.controller.js";
import { crearNotificacion } from "./notificacion.controller.js";
import { publicarEvento } from "../helpers/realtime.helper.js";
import { calcularPresupuesto, normalizarConfigPrecio } from "../helpers/precio.helper.js";
import { condicionPrestadorVisible } from "../helpers/cuenta.helper.js";
import {
  condicionResenaVisible,
  recalcularCalificacionPrestador,
} from "../helpers/calificacion.helper.js";

const esAdministrador = (user) => ["admin", "administrador"].includes(user.rol);

const puedeAcceder = (servicio, user) =>
  esAdministrador(user) ||
  Number(servicio.ownerId) === Number(user.id) ||
  Number(servicio.providerId) === Number(user.id);

const presentarServicio = (servicio, ubicacion = null, user = null) => ({
  id: servicio.id,
  ownerId: servicio.ownerId,
  providerId: servicio.providerId,
  prestador: servicio.prestadorNombre,
  tipo: servicio.tipo,
  mascota: servicio.mascotaNombre,
  monto: Number(servicio.monto),
  estado: servicio.estado,
  horaProgramada: servicio.horaProgramada,
  duracionHoras: Number(servicio.duracionHoras || 1),
  iniciadoEn: servicio.iniciadoEn,
  finalizadoEn: servicio.finalizadoEn,
  canceladoEn: servicio.canceladoEn,
  motivoCancelacion: servicio.motivoCancelacion,
  reembolso: servicio.reembolso,
  origen: servicio.origen,
  destino: servicio.destino,
  motivoTraslado: servicio.motivoTraslado,
  servicioVueltaId: servicio.servicioVueltaId,
  horaRegreso: servicio.horaRegreso,
  checkIn: servicio.checkIn,
  checkOut: servicio.checkOut,
  ultimaUbicacion: ubicacion,
  puedeGestionar: Boolean(
    user &&
    (esAdministrador(user) || Number(servicio.providerId) === Number(user.id)),
  ),
});

const obtenerServicioAutorizado = async (id, user) => {
  const servicio = await Servicio.findByPk(id);

  if (!servicio) {
    return { error: { status: 404, mensaje: "Servicio no encontrado" } };
  }

  if (!puedeAcceder(servicio, user)) {
    return {
      error: { status: 403, mensaje: "No tenés permisos para este servicio" },
    };
  }

  return { servicio };
};

const obtenerPrestadorDisponible = async () => {
  const ocupados = await Servicio.findAll({
    where: { estado: { [Op.in]: ["programado", "en-curso"] } },
    attributes: ["providerId"],
  });
  const idsOcupados = ocupados
    .map((servicio) => servicio.providerId)
    .filter(Boolean);

  const disponible = await User.findOne({
    where: {
      rol: "prestador",
      ...(idsOcupados.length > 0 ? { id: { [Op.notIn]: idsOcupados } } : {}),
    },
    order: [["id", "ASC"]],
  });

  return (
    disponible ??
    User.findOne({ where: { rol: "prestador" }, order: [["id", "ASC"]] })
  );
};

const SERVICIOS_RESERVABLES = ["Paseo", "Guarderia", "Traslado"];

const leerLista = (valor) => {
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

// El driver puede devolver las columnas JSON como texto
const leerPrecios = (valor) => {
  if (typeof valor === "string") {
    try {
      return JSON.parse(valor);
    } catch {
      return {};
    }
  }

  return valor && typeof valor === "object" ? valor : {};
};

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const validarDisponibilidad = (prestador, fecha) => {
  const disponibilidad =
    prestador.disponibilidad && typeof prestador.disponibilidad === "object"
      ? prestador.disponibilidad
      : null;

  if (!disponibilidad) return { ok: true };

  const dia = DIAS_SEMANA[fecha.getDay()];
  const regla = disponibilidad[dia];

  if (!regla || !regla.activo) {
    return { ok: false, mensaje: "En ese horario no está disponible" };
  }

  const minutos = fecha.getHours() * 60 + fecha.getMinutes();
  const [desdeH, desdeM] = String(regla.desde).split(":").map(Number);
  const [hastaH, hastaM] = String(regla.hasta).split(":").map(Number);
  const desde = desdeH * 60 + desdeM;
  const hasta = hastaH * 60 + hastaM;

  if (!Number.isFinite(minutos) || minutos < desde || minutos > hasta) {
    return { ok: false, mensaje: "En ese horario no está disponible" };
  }

  return { ok: true };
};

const validarRestricciones = (prestador, mascota) => {
  const tamanos = prestador.tamanosAceptados;

  if (Array.isArray(tamanos) && tamanos.length > 0) {
    const tamano = String(mascota.tamano ?? "").toLowerCase();

    if (tamano && !tamanos.includes(tamano)) {
      return {
        ok: false,
        mensaje: `Este prestador no acepta mascotas de tamaño ${tamano}`,
      };
    }
  }

  const restricciones = prestador.restricciones;
  const raza = String(mascota.raza ?? "").toLowerCase();

  if (Array.isArray(restricciones) && restricciones.length > 0 && raza) {
    if (restricciones.some((item) => String(item).toLowerCase() === raza)) {
      return {
        ok: false,
        mensaje: `Este prestador no acepta la raza ${mascota.raza}`,
      };
    }
  }

  return { ok: true };
};

// Paseos y traslados no pueden superponerse en el horario del prestador.
// La duración contratada se utiliza para comparar los intervalos completos.
const horarioOcupado = async (providerId, fecha, duracionHoras) => {
  const serviciosActivos = await Servicio.findAll({
    where: {
      providerId,
      estado: { [Op.in]: ["programado", "aceptado", "en-curso"] },
      tipo: { [Op.notLike]: "Guarderia%" },
    },
    attributes: ["horaProgramada", "duracionHoras"],
  });

  const inicioNuevo = fecha.getTime();
  const finNuevo = inicioNuevo + duracionHoras * 60 * 60 * 1000;

  return serviciosActivos.some((servicio) => {
    const inicioExistente = new Date(servicio.horaProgramada).getTime();
    const horasExistentes = Number(servicio.duracionHoras) || 1;
    const finExistente = inicioExistente + horasExistentes * 60 * 60 * 1000;

    return inicioNuevo < finExistente && finNuevo > inicioExistente;
  });
};

export const crearServicio = async (req, res) => {
  try {
    if (req.user.rol !== "dueño") {
      return res
        .status(403)
        .json({ mensaje: "Solo un dueño de mascota puede reservar servicios" });
    }

    const {
      providerId,
      mascotaId,
      tipo,
      horaProgramada,
      duracionHoras,
      origen,
      destino,
      motivoTraslado,
      solicitarVuelta,
      horaRegreso,
    } = req.body;

    if (!SERVICIOS_RESERVABLES.includes(tipo)) {
      return res.status(400).json({ mensaje: "Elegí un servicio válido" });
    }

    if (tipo === "Traslado") {
      if (!String(origen ?? "").trim() || !String(destino ?? "").trim()) {
        return res.status(400).json({
          mensaje: "Para traslados indicá el origen y el destino",
        });
      }
    }

    const fecha = new Date(horaProgramada);
    const horasContratadas = Number(duracionHoras);

    if (!Number.isFinite(horasContratadas) || horasContratadas < 1 || horasContratadas > 24) {
      return res.status(400).json({ mensaje: "La duración debe estar entre 1 y 24 horas" });
    }

    if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
      return res
        .status(400)
        .json({ mensaje: "Elegí una fecha y hora futuras" });
    }

    // Solo se reserva a prestadores aprobados por la administración y con la cuenta activa
    const prestador = await User.findOne({
      where: condicionPrestadorVisible({ id: providerId }),
    });

    if (!prestador) {
      return res
        .status(404)
        .json({ mensaje: "El prestador no está disponible para reservas" });
    }

    if (!leerLista(prestador.servicios).includes(tipo)) {
      return res
        .status(400)
        .json({ mensaje: "Ese prestador no ofrece el servicio elegido" });
    }

    const rawMascotaIds = Array.isArray(req.body.mascotaIds)
      ? req.body.mascotaIds.map(Number).filter(Boolean)
      : (req.body.mascotaId ? [Number(req.body.mascotaId)] : []);

    if (rawMascotaIds.length === 0) {
      return res
        .status(400)
        .json({ mensaje: "Elegí al menos una mascota para reservar" });
    }

    const mascotas = await Mascota.findAll({
      where: { id: rawMascotaIds, userId: req.user.id },
    });

    if (mascotas.length !== rawMascotaIds.length) {
      return res.status(404).json({
        mensaje: "Una o más mascotas seleccionadas no fueron encontradas",
      });
    }

    const configPrecio = normalizarConfigPrecio(
      leerPrecios(prestador.preciosServicios)?.[tipo],
    );

    if (!Number.isFinite(configPrecio.precioBase) || configPrecio.precioBase <= 0) {
      return res.status(400).json({
        mensaje: "El prestador todavía no cargó el precio de este servicio",
      });
    }

    const presupuesto = calcularPresupuesto(configPrecio.precioBase, horasContratadas);
    const monto = presupuesto.total;

    const disponibilidad = validarDisponibilidad(prestador, fecha);

    if (!disponibilidad.ok) {
      return res.status(409).json({ mensaje: disponibilidad.mensaje });
    }

    if (tipo !== "Guarderia" && (await horarioOcupado(prestador.id, fecha, horasContratadas))) {
      return res.status(409).json({
        mensaje: "El prestador ya tiene una reserva en ese horario. Elegí otro.",
      });
    }

    for (const m of mascotas) {
      const restricciones = validarRestricciones(prestador, m);
      if (!restricciones.ok) {
        return res.status(409).json({
          mensaje: `La mascota "${m.nombre}" no cumple las restricciones: ${restricciones.mensaje}`,
        });
      }
    }

    const mascotaNombreCompleto = mascotas.map((m) => m.nombre).join(", ").slice(0, 100);
    const mascota = mascotas[0];

    const esIdaVuelta =
      tipo === "Traslado" &&
      String(motivoTraslado ?? "").trim() === "queda" &&
      solicitarVuelta === true;

    // La vuelta se valida antes de crear la ida para no dejar reservas a medias
    const regreso = esIdaVuelta ? new Date(horaRegreso) : null;

    if (esIdaVuelta) {
      if (Number.isNaN(regreso.getTime()) || regreso <= fecha) {
        return res.status(400).json({
          mensaje: "La hora de regreso debe ser posterior a la salida",
        });
      }

      const disponibilidadVuelta = validarDisponibilidad(prestador, regreso);

      if (!disponibilidadVuelta.ok) {
        return res.status(409).json({
          mensaje: `La vuelta no se puede programar: ${disponibilidadVuelta.mensaje}`,
        });
      }

      if (await horarioOcupado(prestador.id, regreso, horasContratadas)) {
        return res.status(409).json({
          mensaje: "La vuelta no se puede programar: el prestador ya tiene una reserva en ese horario",
        });
      }
    }

    const servicio = await Servicio.create({
      ownerId: req.user.id,
      providerId: prestador.id,
      mascotaId: mascota.id,
      prestadorNombre: `${prestador.nombre} ${prestador.apellido}`,
      tipo,
      mascotaNombre: mascotaNombreCompleto,
      monto,
      horaProgramada: fecha,
      duracionHoras: horasContratadas,
      origen: tipo === "Traslado" ? String(origen).trim() : null,
      destino: tipo === "Traslado" ? String(destino).trim() : null,
      motivoTraslado:
        tipo === "Traslado"
          ? String(motivoTraslado ?? "").trim().slice(0, 60) || null
          : null,
    });

    let servicioVuelta = null;

    if (esIdaVuelta) {
      servicioVuelta = await Servicio.create({
        ownerId: req.user.id,
        providerId: prestador.id,
        mascotaId: mascota.id,
        prestadorNombre: `${prestador.nombre} ${prestador.apellido}`,
        tipo,
        mascotaNombre: mascota.nombre,
        monto,
        horaProgramada: regreso,
        duracionHoras: horasContratadas,
        origen: String(destino).trim(),
        destino: String(origen).trim(),
        motivoTraslado: "vuelta",
      });

      await servicio.update({ servicioVueltaId: servicioVuelta.id });
      await servicioVuelta.update({ servicioVueltaId: servicio.id });
    }

    await crearNotificacion({
      usuarioId: prestador.id,
      tipo: "reserva",
      titulo: "Nueva solicitud de reserva",
      mensaje: `${req.user.nombre} reservó ${tipo} para ${mascotaNombreCompleto}.`,
      servicioId: servicio.id,
    });

    return res.status(201).json({
      mensaje: esIdaVuelta
        ? "Reserva de traslado y vuelta creadas correctamente"
        : "Reserva creada correctamente",
      servicio: presentarServicio(servicio, null, req.user),
      servicioVuelta: servicioVuelta
        ? presentarServicio(servicioVuelta, null, req.user)
        : null,
    });
  } catch (error) {
    console.error("Error al crear la reserva:", error);
    return res.status(500).json({ mensaje: "No se pudo crear la reserva" });
  }
};

export const crearServicioDemo = async (req, res) => {
  if (esAdministrador(req.user)) {
    const servicioAdmin = await Servicio.findOne({
      where: { estado: { [Op.in]: ["programado", "en-curso"] } },
      order: [["id", "DESC"]],
    });

    if (!servicioAdmin) {
      return res
        .status(404)
        .json({ mensaje: "Todavía no hay servicios para supervisar" });
    }

    return res.json({
      servicio: presentarServicio(servicioAdmin, null, req.user),
    });
  }

  if (req.user.rol === "prestador") {
    const servicioPrestador = await Servicio.findOne({
      where: {
        providerId: req.user.id,
        estado: { [Op.in]: ["programado", "en-curso"] },
      },
      order: [["id", "DESC"]],
    });

    if (!servicioPrestador) {
      return res.status(404).json({
        mensaje:
          "Todavía no tenés servicios asignados. Pedile a un dueño que reserve un servicio primero.",
      });
    }

    return res.json({
      servicio: presentarServicio(servicioPrestador, null, req.user),
    });
  }

  const servicioExistente = await Servicio.findOne({
    where: {
      ownerId: req.user.id,
      estado: { [Op.in]: ["programado", "en-curso"] },
    },
    order: [["id", "DESC"]],
  });

  if (servicioExistente) {
    if (!servicioExistente.providerId) {
      const prestador = await obtenerPrestadorDisponible();
      if (prestador) {
        await servicioExistente.update({
          providerId: prestador.id,
          prestadorNombre: `${prestador.nombre} ${prestador.apellido}`,
        });
      }
    }

    return res.json({
      servicio: presentarServicio(servicioExistente, null, req.user),
    });
  }

  const prestador = await obtenerPrestadorDisponible();

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
    horaProgramada: new Date(Date.now() + 60 * 60 * 1000),
  });

  return res
    .status(201)
    .json({ servicio: presentarServicio(servicio, null, req.user) });
};

export const listarServicios = async (req, res) => {
  const where = esAdministrador(req.user)
    ? {}
    : req.user.rol === "prestador"
      ? { providerId: req.user.id }
      : { ownerId: req.user.id };

  const { estado, servicio } = req.query;
  if (estado) where.estado = estado;
  if (servicio) where.tipo = { [Op.like]: `%${servicio}%` };

  const limitePedido = Number(req.query.limite);
  const paginaPedida = Number(req.query.pagina);
  const paginar = Number.isInteger(limitePedido) && limitePedido > 0;
  const pagina =
    Number.isInteger(paginaPedida) && paginaPedida > 0 ? paginaPedida : 1;

  const consulta = { where, order: [["id", "DESC"]] };
  if (paginar) {
    consulta.limit = Math.min(limitePedido, 100);
    consulta.offset = (pagina - 1) * consulta.limit;
  }

  const { count, rows } = await Servicio.findAndCountAll(consulta);

  // Servicios finalizados que el usuario (dueño) ya calificó
  const idsFinalizados = rows
    .filter((item) => item.estado === "finalizado")
    .map((item) => item.id);
  const calificados = new Set();

  if (idsFinalizados.length > 0) {
    const calificaciones = await Calificacion.findAll({
      where: { servicioId: idsFinalizados, ownerId: req.user.id },
      attributes: ["servicioId"],
    });

    calificaciones.forEach((item) => calificados.add(Number(item.servicioId)));
  }

  return res.json({
    servicios: rows.map((item) => ({
      ...presentarServicio(item, null, req.user),
      calificado: calificados.has(Number(item.id)),
    })),
    total: count,
    pagina,
    limite: paginar ? consulta.limit : count,
    totalPaginas: paginar ? Math.ceil(count / consulta.limit) : 1,
  });
};

export const obtenerServicio = async (req, res) => {
  const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
  if (resultado.error)
    return res
      .status(resultado.error.status)
      .json({ mensaje: resultado.error.mensaje });

  const ubicacion = await Ubicacion.findOne({
    where: { servicioId: resultado.servicio.id },
    order: [["registradoEn", "DESC"]],
  });

  const calificacion = await Calificacion.findOne({
    where: {
      servicioId: resultado.servicio.id,
      ownerId: req.user.id,
    },
  });

  return res.json({
    servicio: {
      ...presentarServicio(resultado.servicio, ubicacion, req.user),
      calificado: Boolean(calificacion),
      puedeCalificar:
        resultado.servicio.estado === "finalizado" &&
        Number(resultado.servicio.ownerId) === Number(req.user.id) &&
        !calificacion,
    },
  });
};

export const iniciarServicio = async (req, res) => {
  const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
  if (resultado.error)
    return res
      .status(resultado.error.status)
      .json({ mensaje: resultado.error.mensaje });

  if (
    !esAdministrador(req.user) &&
    Number(resultado.servicio.providerId) !== Number(req.user.id)
  ) {
    return res.status(403).json({
      mensaje: "Solo el prestador asignado puede iniciar el servicio",
    });
  }

  if (resultado.servicio.estado !== "aceptado") {
    return res.status(409).json({
      mensaje: "El servicio debe estar aceptado antes de iniciarlo",
    });
  }

  await resultado.servicio.update({
    estado: "en-curso",
    iniciadoEn: new Date(),
  });
  return res.json({
    servicio: presentarServicio(resultado.servicio, null, req.user),
  });
};

export const finalizarServicio = async (req, res) => {
  const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
  if (resultado.error)
    return res
      .status(resultado.error.status)
      .json({ mensaje: resultado.error.mensaje });

  if (
    !esAdministrador(req.user) &&
    Number(resultado.servicio.providerId) !== Number(req.user.id)
  ) {
    return res.status(403).json({
      mensaje: "Solo el prestador asignado puede finalizar el servicio",
    });
  }

  if (resultado.servicio.estado !== "en-curso") {
    return res.status(409).json({ mensaje: "El servicio no está en curso" });
  }

  await resultado.servicio.update({
    estado: "finalizado",
    finalizadoEn: new Date(),
  });

  await liberarPagoDelServicio(resultado.servicio.id);

  return res.json({
    servicio: presentarServicio(resultado.servicio, null, req.user),
  });
};

export const aceptarServicio = async (req, res) => {
  try {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error)
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });

    const servicio = resultado.servicio;

    if (
      !esAdministrador(req.user) &&
      Number(servicio.providerId) !== Number(req.user.id)
    ) {
      return res
        .status(403)
        .json({ mensaje: "Solo el prestador asignado puede aceptar esta reserva" });
    }

    if (servicio.estado !== "programado") {
      return res
        .status(409)
        .json({ mensaje: "Esta reserva ya fue gestionada" });
    }

    await servicio.update({ estado: "aceptado" });

    await crearNotificacion({
      usuarioId: servicio.ownerId,
      tipo: "reserva-aceptada",
      titulo: "Reserva aceptada",
      mensaje: `Tu reserva de ${servicio.tipo} fue aceptada.`,
      servicioId: servicio.id,
    });

    return res.json({
      mensaje: "Reserva aceptada correctamente",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al aceptar la reserva:", error);
    return res.status(500).json({ mensaje: "No se pudo aceptar la reserva" });
  }
};

export const rechazarServicio = async (req, res) => {
  try {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error)
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });

    const servicio = resultado.servicio;

    if (
      !esAdministrador(req.user) &&
      Number(servicio.providerId) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        mensaje: "Solo el prestador asignado puede rechazar esta reserva",
      });
    }

    if (servicio.estado !== "programado") {
      return res
        .status(409)
        .json({ mensaje: "Esta reserva ya fue gestionada" });
    }

    await servicio.update({ estado: "rechazado" });

    await crearNotificacion({
      usuarioId: servicio.ownerId,
      tipo: "reserva-rechazada",
      titulo: "Reserva rechazada",
      mensaje: `Tu reserva de ${servicio.tipo} fue rechazada.`,
      servicioId: servicio.id,
    });

    return res.json({
      mensaje: "Reserva rechazada correctamente",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al rechazar la reserva:", error);
    return res.status(500).json({ mensaje: "No se pudo rechazar la reserva" });
  }
};

const HORAS_REEMBOLSO_COMPLETO = 12;

export const cancelarServicio = async (req, res) => {
  try {
    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error)
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });

    const servicio = resultado.servicio;

    if (!["programado", "aceptado"].includes(servicio.estado)) {
      return res.status(409).json({
        mensaje: "Solo se puede cancelar una reserva pendiente o aceptada",
      });
    }

    const esDueno = Number(servicio.ownerId) === Number(req.user.id);
    const esPrestador = Number(servicio.providerId) === Number(req.user.id);
    const motivo = String(req.body.motivo ?? "").trim().slice(0, 255);

    let reembolso = true;

    if (esDueno && !esPrestador) {
      const horas =
        (new Date(servicio.horaProgramada).getTime() - Date.now()) / 3_600_000;
      reembolso = horas >= HORAS_REEMBOLSO_COMPLETO;
    }

    await servicio.update({
      estado: "cancelado",
      canceladoEn: new Date(),
      motivoCancelacion: motivo || null,
      reembolso,
    });

    if (reembolso) {
      await reembolsarPagoDelServicio(servicio.id);
    } else {
      await liberarPagoDelServicio(servicio.id);
    }

    // Si cancela un administrador se avisa a las dos partes
    const destinatarios = esDueno
      ? [servicio.providerId]
      : esPrestador
        ? [servicio.ownerId]
        : [servicio.ownerId, servicio.providerId];

    for (const destinatario of destinatarios.filter(Boolean)) {
      await crearNotificacion({
        usuarioId: destinatario,
        tipo: "reserva-cancelada",
        titulo: "Reserva cancelada",
        mensaje: `Se canceló la reserva de ${servicio.tipo}.`,
        servicioId: servicio.id,
      });
    }

    return res.json({
      mensaje: reembolso
        ? "Reserva cancelada. El pago se reintegrará al dueño."
        : "Reserva cancelada fuera del plazo. No corresponde reembolso.",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al cancelar la reserva:", error);
    return res.status(500).json({ mensaje: "No se pudo cancelar la reserva" });
  }
};

export const guardarUbicacion = async (req, res) => {
  const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
  if (resultado.error)
    return res
      .status(resultado.error.status)
      .json({ mensaje: resultado.error.mensaje });

  if (
    !esAdministrador(req.user) &&
    Number(resultado.servicio.providerId) !== Number(req.user.id)
  ) {
    return res
      .status(403)
      .json({ mensaje: "Solo el prestador asignado puede enviar ubicaciones" });
  }

  const latitud = Number(req.body.latitud);
  const longitud = Number(req.body.longitud);
  if (
    !Number.isFinite(latitud) ||
    latitud < -90 ||
    latitud > 90 ||
    !Number.isFinite(longitud) ||
    longitud < -180 ||
    longitud > 180
  ) {
    return res.status(400).json({ mensaje: "Las coordenadas no son válidas" });
  }

  const ubicacion = await Ubicacion.create({
    servicioId: resultado.servicio.id,
    userId: req.user.id,
    latitud,
    longitud,
  });

  publicarEvento(resultado.servicio.ownerId, "ubicacion", {
    servicioId: resultado.servicio.id,
    latitud,
    longitud,
    registradoEn: ubicacion.registradoEn ?? new Date().toISOString(),
  });

  return res.status(201).json({ ubicacion });
};

export const obtenerUbicacion = async (req, res) => {
  const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
  if (resultado.error)
    return res
      .status(resultado.error.status)
      .json({ mensaje: resultado.error.mensaje });

  const ubicacion = await Ubicacion.findOne({
    where: { servicioId: resultado.servicio.id },
    order: [["registradoEn", "DESC"]],
  });

  return res.json({ ubicacion });
};

export const crearCalificacion = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({
        mensaje: "Servicio no encontrado",
      });
    }

    if (Number(servicio.ownerId) !== Number(req.user.id)) {
      return res.status(403).json({
        mensaje: "Solo el dueño puede calificar este servicio",
      });
    }

    if (servicio.estado !== "finalizado") {
      return res.status(409).json({
        mensaje: "El servicio todavía no finalizó",
      });
    }

    if (!servicio.providerId) {
      return res.status(409).json({
        mensaje: "El servicio no tiene prestador asignado",
      });
    }

    const puntuacion = Number(req.body.puntuacion);
    const comentario = String(req.body.comentario || "").trim();

    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({
        mensaje: "La puntuación debe ser un número entre 1 y 5",
      });
    }

    const calificacionExistente = await Calificacion.findOne({
      where: {
        servicioId: servicio.id,
        ownerId: req.user.id,
      },
    });

    if (calificacionExistente) {
      return res.status(409).json({
        mensaje: "Este servicio ya fue calificado",
      });
    }

    const calificacion = await Calificacion.create({
      servicioId: servicio.id,
      ownerId: servicio.ownerId,
      providerId: servicio.providerId,
      puntuacion,
      comentario: comentario || null,
    });

    // El promedio solo considera las reseñas visibles (no ocultadas por moderación)
    await recalcularCalificacionPrestador(servicio.providerId);

    await crearNotificacion({
      usuarioId: servicio.providerId,
      tipo: "resena",
      titulo: "Nueva reseña recibida",
      mensaje: `${req.user.nombre} te dejó ${puntuacion} estrella(s).`,
      servicioId: servicio.id,
    });

    return res.status(201).json({
      mensaje: "Calificación guardada correctamente",
      calificacion,
    });
  } catch (error) {
    console.error("Error al crear calificación:", error);

    return res.status(500).json({
      mensaje: "No se pudo guardar la calificación",
    });
  }
};

export const precioSugerido = async (req, res) => {
  try {
    const tipo = String(req.query.tipo ?? "").trim();
    const zona = String(req.query.zona ?? "").trim().toLowerCase();

    if (!SERVICIOS_RESERVABLES.includes(tipo)) {
      return res.json({ rango: null, mensaje: "Servicio no válido" });
    }

    // El rango de mercado se arma con los prestadores activos en la plataforma
    const prestadores = await User.findAll({
      where: condicionPrestadorVisible(),
      attributes: ["zona", "servicios", "preciosServicios"],
    });

    const precios = prestadores
      .filter((prestador) => leerLista(prestador.servicios).includes(tipo))
      .map((prestador) => ({
        valor: normalizarConfigPrecio(leerPrecios(prestador.preciosServicios)?.[tipo]).precioBase,
        zona: String(prestador.zona ?? "").toLowerCase(),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.valor) &&
          item.valor > 0 &&
          (!zona ||
            (item.zona &&
              (item.zona.includes(zona) || zona.includes(item.zona)))),
      );

    if (precios.length === 0) {
      return res.json({
        rango: null,
        mensaje: "Todavía no hay precios cargados para comparar",
      });
    }

    const valores = precios.map((item) => item.valor).sort((a, b) => a - b);
    const min = valores[0];
    const max = valores[valores.length - 1];
    const promedio = Math.round(
      valores.reduce((total, valor) => total + valor, 0) / valores.length,
    );

    return res.json({ rango: { min, promedio, max, cantidad: valores.length } });
  } catch (error) {
    console.error("Error al calcular el precio sugerido:", error);
    return res.status(500).json({ mensaje: "No se pudo calcular el rango sugerido" });
  }
};

const obtenerServicioParaGestor = async (id, user) => {
  const resultado = await obtenerServicioAutorizado(id, user);
  if (resultado.error) return resultado;

  if (
    !esAdministrador(user) &&
    Number(resultado.servicio.providerId) !== Number(user.id)
  ) {
    return {
      error: { status: 403, mensaje: "Solo el prestador asignado puede gestionar esto" },
    };
  }

  return resultado;
};

export const marcarCheckIn = async (req, res) => {
  try {
    const resultado = await obtenerServicioParaGestor(req.params.id, req.user);
    if (resultado.error)
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });

    const servicio = resultado.servicio;

    if (servicio.tipo !== "Guarderia") {
      return res.status(400).json({ mensaje: "Solo las guarderías usan check-in" });
    }

    if (!["aceptado", "en-curso"].includes(servicio.estado)) {
      return res.status(409).json({ mensaje: "La reserva no está lista para el ingreso" });
    }

    await servicio.update({
      checkIn: new Date(),
      ...(servicio.estado === "aceptado" ? { estado: "en-curso" } : {}),
    });

    return res.json({
      mensaje: "Ingreso registrado correctamente",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al registrar el check-in:", error);
    return res.status(500).json({ mensaje: "No se pudo registrar el ingreso" });
  }
};

export const marcarCheckOut = async (req, res) => {
  try {
    const resultado = await obtenerServicioParaGestor(req.params.id, req.user);
    if (resultado.error)
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });

    const servicio = resultado.servicio;

    if (servicio.tipo !== "Guarderia") {
      return res.status(400).json({ mensaje: "Solo las guarderías usan check-out" });
    }

    if (!servicio.checkIn) {
      return res.status(409).json({ mensaje: "Todavía no se registró el ingreso" });
    }

    if (servicio.checkOut) {
      return res.status(409).json({ mensaje: "El check-out ya fue registrado" });
    }

    await servicio.update({ checkOut: new Date() });

    return res.json({
      mensaje: "Egreso registrado correctamente",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al registrar el check-out:", error);
    return res.status(500).json({ mensaje: "No se pudo registrar el egreso" });
  }
};

const MINUTOS_ANTELACION_SALIDA = 25;

export const rutaDeHoy = async (req, res) => {
  try {
    if (req.user.rol !== "prestador" && !esAdministrador(req.user)) {
      return res.status(403).json({
        mensaje: "Solo los prestadores consultan su recorrido",
      });
    }

    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const servicios = await Servicio.findAll({
      where: {
        providerId: req.user.id,
        estado: { [Op.in]: ["programado", "aceptado", "en-curso"] },
        horaProgramada: { [Op.between]: [inicioDia, finDia] },
      },
      order: [["horaProgramada", "ASC"]],
    });

    const recorridos = servicios.map((servicio) => ({
      ...presentarServicio(servicio, null, req.user),
      salidaSugerida: new Date(
        new Date(servicio.horaProgramada).getTime() -
          MINUTOS_ANTELACION_SALIDA * 60 * 1000,
      ),
    }));

    return res.json({ recorridos });
  } catch (error) {
    console.error("Error al calcular la ruta de hoy:", error);
    return res.status(500).json({ mensaje: "No se pudo calcular la ruta de hoy" });
  }
};

export const listarResenasPrestador = async (req, res) => {
  const providerId = Number(req.params.id);

  if (!Number.isInteger(providerId) || providerId <= 0) {
    return res.status(400).json({ mensaje: "Prestador inválido" });
  }

  try {
    const limitePedido = Number(req.query.limite);
    const paginaPedida = Number(req.query.pagina);
    const limite =
      Number.isInteger(limitePedido) && limitePedido > 0
        ? Math.min(limitePedido, 100)
        : 50;
    const pagina =
      Number.isInteger(paginaPedida) && paginaPedida > 0 ? paginaPedida : 1;

    const { count, rows: resenas } = await Calificacion.findAndCountAll({
      where: { providerId, ...condicionResenaVisible() },
      order: [["id", "DESC"]],
      limit: limite,
      offset: (pagina - 1) * limite,
    });

    const ownerIds = [...new Set(resenas.map((resena) => resena.ownerId))];
    const owners = ownerIds.length
      ? await User.findAll({
          where: { id: ownerIds },
          attributes: ["id", "nombre", "apellido"],
        })
      : [];

    const nombres = new Map(
      owners.map((owner) => [
        owner.id,
        `${owner.nombre} ${owner.apellido}`.trim(),
      ]),
    );

    return res.json({
      resenas: resenas.map((resena) => ({
        id: resena.id,
        puntuacion: resena.puntuacion,
        comentario: resena.comentario,
        autor: nombres.get(resena.ownerId) || "Usuario",
        fecha: resena.createdAt,
      })),
      total: count,
      pagina,
      limite,
      totalPaginas: Math.ceil(count / limite),
    });
  } catch (error) {
    console.error("Error al listar reseñas:", error);
    return res.status(500).json({ mensaje: "No se pudieron cargar las reseñas" });
  }
};
