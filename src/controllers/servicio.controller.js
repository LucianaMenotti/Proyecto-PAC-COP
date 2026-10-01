import { Op } from "sequelize";
import Servicio from "../models/servicio.model.js";
import Ubicacion from "../models/ubicacion.model.js";
import Calificacion from "../models/calificacion.model.js";
import User from "../models/user.model.js";
import Mascota from "../models/mascota.model.js";

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
  calificacion: servicio.calificacion ?? null, // <-- AGREGAR ESTA LÍNEA
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

export const crearServicio = async (req, res) => {
  try {
    if (req.user.rol !== "dueño") {
      return res
        .status(403)
        .json({ mensaje: "Solo un dueño de mascota puede reservar servicios" });
    }

    const { providerId, mascotaId, tipo, horaProgramada } = req.body;

    if (!SERVICIOS_RESERVABLES.includes(tipo)) {
      return res.status(400).json({ mensaje: "Elegí un servicio válido" });
    }

    const fecha = new Date(horaProgramada);

    if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
      return res
        .status(400)
        .json({ mensaje: "Elegí una fecha y hora futuras" });
    }

    const prestador = await User.findOne({
      where: { id: providerId, rol: "prestador" },
    });

    if (!prestador) {
      return res.status(404).json({ mensaje: "Prestador no encontrado" });
    }

    if (!leerLista(prestador.servicios).includes(tipo)) {
      return res
        .status(400)
        .json({ mensaje: "Ese prestador no ofrece el servicio elegido" });
    }

    const monto = Number(prestador.preciosServicios?.[tipo]);

    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({
        mensaje: "El prestador todavía no cargó el precio de este servicio",
      });
    }

    const mascota = await Mascota.findOne({
      where: { id: mascotaId, userId: req.user.id },
    });

    if (!mascota) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    const servicio = await Servicio.create({
      ownerId: req.user.id,
      providerId: prestador.id,
      mascotaId: mascota.id,
      prestadorNombre: `${prestador.nombre} ${prestador.apellido}`,
      tipo,
      mascotaNombre: mascota.nombre,
      monto,
      horaProgramada: fecha,
    });

    return res.status(201).json({
      mensaje: "Reserva creada correctamente",
      servicio: presentarServicio(servicio, null, req.user),
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

  const servicios = await Servicio.findAll({ where, order: [["id", "DESC"]] });
  return res.json({
    servicios: servicios.map((servicio) =>
      presentarServicio(servicio, null, req.user),
    ),
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

  return res.json({
    servicio: presentarServicio(resultado.servicio, ubicacion, req.user),
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

  if (resultado.servicio.estado !== "programado") {
    return res.status(409).json({ mensaje: "El servicio no está programado" });
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
  return res.json({
    servicio: presentarServicio(resultado.servicio, null, req.user),
  });
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

    const calificaciones = await Calificacion.findAll({
      where: {
        providerId: servicio.providerId,
      },
      attributes: ["puntuacion"],
    });

    const cantidad = calificaciones.length;
    const promedio =
      calificaciones.reduce(
        (total, item) => total + Number(item.puntuacion),
        0,
      ) / cantidad;

    await User.update(
      {
        calificacion: Number(promedio.toFixed(2)),
        resenas: cantidad,
      },
      {
        where: {
          id: servicio.providerId,
        },
      },
    );

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

export const calificarServicio = async (req, res) => {
  try {
    const { nota, comentario } = req.body;
    const valorNota = Number(nota);

    if (!valorNota || valorNota < 1 || valorNota > 5) {
      return res
        .status(400)
        .json({ mensaje: "La calificación debe ser un número del 1 al 5." });
    }

    const resultado = await obtenerServicioAutorizado(req.params.id, req.user);
    if (resultado.error) {
      return res
        .status(resultado.error.status)
        .json({ mensaje: resultado.error.mensaje });
    }

    const servicio = resultado.servicio;

    // Solo el dueño que reservó puede calificar
    if (Number(servicio.ownerId) !== Number(req.user.id)) {
      return res.status(403).json({
        mensaje: "Solo el dueño de la mascota puede calificar este servicio.",
      });
    }

    // El servicio debe estar terminado
    if (servicio.estado !== "finalizado") {
      return res.status(400).json({
        mensaje: "Solo podés calificar un servicio cuando haya finalizado.",
      });
    }

    // No permitir calificar dos veces el mismo servicio
    if (servicio.calificacion !== null) {
      return res
        .status(409)
        .json({ mensaje: "Este servicio ya fue calificado." });
    }

    // Guardar calificación en el servicio
    await servicio.update({
      calificacion: valorNota,
      comentarioCalificacion: comentario ? String(comentario).trim() : null,
    });

    // Actualizar promedio y total de reseñas del prestador en la tabla User
    if (servicio.providerId) {
      const prestador = await User.findByPk(servicio.providerId);
      if (prestador) {
        const resenasPrevias = Number(prestador.resenas) || 0;
        const califPrevia = Number(prestador.calificacion) || 0;

        const nuevoTotal = resenasPrevias + 1;
        const nuevoPromedio = Number(
          ((califPrevia * resenasPrevias + valorNota) / nuevoTotal).toFixed(1),
        );

        await prestador.update({
          calificacion: nuevoPromedio,
          resenas: nuevoTotal,
        });
      }
    }

    return res.json({
      mensaje: "¡Gracias por calificar el servicio!",
      servicio: presentarServicio(servicio, null, req.user),
    });
  } catch (error) {
    console.error("Error al calificar servicio:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo registrar la calificación." });
  }
};
