import { Op } from "sequelize";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import User from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../helpers/password.helper.js";
import { enviarEmail } from "../helpers/email.helper.js";
import { plantillaRecuperacion } from "../helpers/email.templates.js";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../helpers/auth.helper.js";
import {
  condicionPrestadorVisible,
  estaSuspendido,
  leerDocumentos,
  resumenDocumentacion,
} from "../helpers/cuenta.helper.js";
import { CARPETA_DOCUMENTOS } from "../middlewares/upload.middleware.js";
import { ROLES_ADMIN } from "../middlewares/admin.middleware.js";
import { crearNotificacion } from "./notificacion.controller.js";

const PUBLIC_USER_FIELDS = [
  "id",
  "nombre",
  "apellido",
  "fechaNacimiento",
  "email",
  "telefono",
  "zona",
  "rol",
  "servicios",
  "preciosServicios",
  "vehiculo",
  "verificado",
  "calificacion",
  "resenas",
  "disponibilidad",
  "tamanosAceptados",
  "restricciones",
  "cuentaCobro",
  "estadoAprobacion",
  "motivoRechazo",
  "experiencia",
  "estadoCuenta",
];

// documentos guarda nombres de archivo: se consulta pero nunca se devuelve tal cual
const PROFILE_QUERY_FIELDS = [...PUBLIC_USER_FIELDS, "documentos"];

const DIRECTORY_USER_FIELDS = [
  "id",
  "nombre",
  "apellido",
  "zona",
  "rol",
  "servicios",
  "preciosServicios",
  "vehiculo",
  "verificado",
  "calificacion",
  "resenas",
  "tamanosAceptados",
  "restricciones",
  "experiencia",
];

const publicUser = (user) => {
  const data = user.toJSON ? user.toJSON() : user;
  const resultado = Object.fromEntries(
    PUBLIC_USER_FIELDS.filter((field) => data[field] !== undefined).map(
      (field) => [field, data[field]],
    ),
  );

  if (data.rol === "prestador") {
    resultado.documentacion = resumenDocumentacion(data.documentos);
  }

  return resultado;
};

export const crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      fechaNacimiento,
      email,
      password,
      telefono,
      zona,
      rol = "dueño",
      servicios,
      vehiculo,
    } = req.body;

    if (
      rol === "prestador" &&
      (!zona || !Array.isArray(servicios) || servicios.length === 0)
    ) {
      return res.status(400).json({
        mensaje: "El prestador debe indicar zona y al menos un servicio",
      });
    }

    if (rol === "prestador" && servicios.includes("Traslado") && !vehiculo) {
      return res.status(400).json({
        mensaje: "Debés seleccionar un vehículo para realizar traslados",
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ mensaje: "El correo ya está registrado" });
    }

    const user = await User.create({
      nombre,
      apellido,
      fechaNacimiento,
      email,
      password: await hashPassword(password),
      telefono,
      zona: rol === "prestador" ? zona : null,
      rol,
      servicios: rol === "prestador" ? servicios : null,
      vehiculo: rol === "prestador" ? (vehiculo ?? null) : null,
      estadoAprobacion: rol === "prestador" ? "aprobado" : null,
      verificado: rol === "prestador",
      estadoCuenta: "activa",
    });

    setAuthCookie(res, createAuthToken(user));

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: publicUser(user),
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ mensaje: "El correo ya está registrado" });
    }

    return res.status(500).json({ mensaje: "Error al registrar el usuario" });
  }
};

export const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ mensaje: "El correo y la contraseña son obligatorios" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ mensaje: "Correo o contraseña incorrectos" });
    }

    const passwordResult = await verifyPassword(password, user.password);

    if (!passwordResult.valid) {
      return res
        .status(401)
        .json({ mensaje: "Correo o contraseña incorrectos" });
    }

    if (estaSuspendido(user)) {
      return res.status(403).json({
        mensaje: `Tu cuenta está suspendida${user.motivoSuspension ? `: ${user.motivoSuspension}` : ""}. Comunicate con la administración.`,
        suspendida: true,
      });
    }

    if (passwordResult.needsUpgrade) {
      await user.update({ password: await hashPassword(password) });
    }

    setAuthCookie(res, createAuthToken(user));

    return res.status(200).json({
      mensaje: "Inicio de sesión correcto",
      usuario: publicUser(user),
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ mensaje: "Error al iniciar sesión" });
  }
};

export const cerrarSesion = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
};

export const obtenerSesion = (req, res) =>
  res.status(200).json({ usuario: publicUser(req.user) });

export const obtenerUsuarios = async (req, res) => {
  try {
    const { servicio, zona, q } = req.query;

    // El directorio es público: solo expone prestadores aprobados con la cuenta activa
    const extra = {};

    if (zona) extra.zona = { [Op.like]: `%${zona}%` };
    if (q) {
      extra[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { apellido: { [Op.like]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where: condicionPrestadorVisible(extra),
      attributes: DIRECTORY_USER_FIELDS,
      order: [["nombre", "ASC"]],
    });

    const filtrados = servicio
      ? users.filter((user) => {
          const lista = Array.isArray(user.servicios) ? user.servicios : [];
          const buscado = String(servicio).toLowerCase();
          return lista.some((item) =>
            String(item).toLowerCase().includes(buscado),
          );
        })
      : users;

    return res.status(200).json(filtrados);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({ mensaje: "Error al obtener los usuarios" });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const esPropioOAdmin =
      Number(req.params.id) === Number(req.user.id) ||
      ["admin", "administrador"].includes(req.user.rol);

    const user = await User.findByPk(req.params.id, {
      attributes: esPropioOAdmin ? PROFILE_QUERY_FIELDS : DIRECTORY_USER_FIELDS,
    });

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    return res.status(200).json(esPropioOAdmin ? publicUser(user) : user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return res.status(500).json({ mensaje: "Error al obtener el usuario" });
  }
};
export const actualizarMisServicios = async (req, res) => {
  try {
    if (req.user.rol !== "prestador") {
      return res
        .status(403)
        .json({ mensaje: "Solo un prestador puede publicar servicios" });
    }

    const { servicios, preciosServicios } = req.body;

    if (servicios.includes("Traslado") && !req.user.vehiculo) {
      return res.status(400).json({
        mensaje:
          "Necesitás cargar un vehículo en tu perfil para ofrecer Traslado",
      });
    }

    await req.user.update({ servicios, preciosServicios });

    return res.status(200).json({
      mensaje: "Servicios actualizados correctamente",
      usuario: publicUser(req.user),
    });
  } catch (error) {
    console.error("Error al actualizar servicios:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudieron actualizar los servicios" });
  }
};

const requierePrestador = (req, res) => {
  if (req.user.rol !== "prestador") {
    res
      .status(403)
      .json({ mensaje: "Solo un prestador puede modificar este dato" });
    return false;
  }
  return true;
};

export const actualizarDisponibilidad = async (req, res) => {
  if (!requierePrestador(req, res)) return;

  try {
    const { disponibilidad } = req.body;

    if (typeof disponibilidad !== "object" || disponibilidad === null) {
      return res
        .status(400)
        .json({ mensaje: "La disponibilidad no es válida" });
    }

    const diasValidos = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];

    const esHora = (valor) => /^\d{2}:\d{2}$/.test(String(valor ?? ""));

    for (const [dia, valor] of Object.entries(disponibilidad)) {
      if (!diasValidos.includes(dia)) continue;

      if (valor && valor.activo) {
        if (!esHora(valor.desde) || !esHora(valor.hasta)) {
          return res.status(400).json({
            mensaje: `Los horarios de ${dia} no son válidos (usá HH:MM)`,
          });
        }

        if (valor.desde >= valor.hasta) {
          return res.status(400).json({
            mensaje: `El horario de ${dia} debe terminar después de empezar`,
          });
        }
      }
    }

    await req.user.update({ disponibilidad });

    return res.status(200).json({
      mensaje: "Disponibilidad actualizada correctamente",
      disponibilidad: req.user.disponibilidad,
    });
  } catch (error) {
    console.error("Error al actualizar disponibilidad:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo actualizar la disponibilidad" });
  }
};

export const actualizarRestricciones = async (req, res) => {
  if (!requierePrestador(req, res)) return;

  try {
    const { tamanosAceptados, restricciones } = req.body;
    const TAMANOS = ["pequeño", "mediano", "grande"];

    if (
      !Array.isArray(tamanosAceptados) ||
      tamanosAceptados.some((tamano) => !TAMANOS.includes(tamano))
    ) {
      return res
        .status(400)
        .json({ mensaje: "Los tamaños aceptados no son válidos" });
    }

    // Acepta array o texto "pitbull, rottweiler" (formatos viejos en la base)
    const listaRazas = Array.isArray(restricciones)
      ? restricciones
      : typeof restricciones === "string" && restricciones.trim()
        ? restricciones.split(",")
        : [];

    await req.user.update({
      tamanosAceptados,
      restricciones: listaRazas
        .map((raza) => String(raza).trim().toLowerCase())
        .filter(Boolean),
    });

    return res.status(200).json({
      mensaje: "Restricciones actualizadas correctamente",
      usuario: publicUser(req.user),
    });
  } catch (error) {
    console.error("Error al actualizar restricciones:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudieron actualizar las restricciones" });
  }
};

export const actualizarVehiculo = async (req, res) => {
  if (!requierePrestador(req, res)) return;

  try {
    const VEHICULOS = ["auto", "moto", "camioneta"];
    const valor = String(req.body.vehiculo ?? "").trim().toLowerCase();

    if (valor && !VEHICULOS.includes(valor)) {
      return res.status(400).json({
        mensaje: "Elegí un vehículo válido (Auto, Moto o Camioneta)",
      });
    }

    const vehiculo = valor
      ? valor.charAt(0).toUpperCase() + valor.slice(1)
      : null;

    await req.user.update({ vehiculo });

    return res.status(200).json({
      mensaje: "Vehículo actualizado correctamente",
      vehiculo: req.user.vehiculo,
      usuario: publicUser(req.user),
    });
  } catch (error) {
    console.error("Error al actualizar el vehículo:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo actualizar el vehículo" });
  }
};

export const actualizarCuentaCobro = async (req, res) => {
  if (!requierePrestador(req, res)) return;

  try {
    const { tipo, titular, cbu, alias } = req.body;
    const TIPOS = ["banco", "billetera"];

    if (typeof req.body !== "object" || !TIPOS.includes(tipo)) {
      return res
        .status(400)
        .json({ mensaje: "Elegí un tipo de cuenta válido" });
    }

    if (!String(titular ?? "").trim() || (!cbu && !alias)) {
      return res.status(400).json({
        mensaje: "Completá el titular y el CBU o alias de la cuenta",
      });
    }

    await req.user.update({
      cuentaCobro: {
        tipo,
        titular: String(titular).trim(),
        cbu: cbu ? String(cbu).replace(/\D/g, "") : null,
        alias: alias ? String(alias).trim() : null,
      },
    });

    return res.status(200).json({
      mensaje: "Cuenta de cobro actualizada correctamente",
      cuentaCobro: req.user.cuentaCobro,
    });
  } catch (error) {
    console.error("Error al actualizar cuenta de cobro:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo actualizar la cuenta de cobro" });
  }
};

const borrarArchivoDocumento = (nombre) =>
  nombre
    ? fs.unlink(path.join(CARPETA_DOCUMENTOS, path.basename(nombre))).catch(() => null)
    : null;

const MAX_EXPERIENCIA = 2000;

// PUT /api/users/me/documentacion (multipart: documento, selfie, cv, experiencia)
// Carga o reemplaza la documentación del prestador y lo deja pendiente de revisión.
export const cargarDocumentacion = async (req, res) => {
  const archivos = Object.values(req.files || {}).flat();
  const descartarSubidos = () =>
    Promise.all(archivos.map((archivo) => borrarArchivoDocumento(archivo.filename)));

  try {
    if (req.user.rol !== "prestador") {
      await descartarSubidos();
      return res
        .status(403)
        .json({ mensaje: "Solo un prestador carga documentación" });
    }

    const nuevos = Object.fromEntries(
      Object.entries(req.files || {}).map(([campo, lista]) => [campo, lista[0]?.filename]),
    );
    const anteriores = leerDocumentos(req.user.documentos);
    const aprobado = req.user.estadoAprobacion === "aprobado";

    if (aprobado && (nuevos.documento || nuevos.selfie)) {
      await descartarSubidos();
      return res.status(409).json({
        mensaje: "Tu identidad ya fue verificada. Solo podés actualizar el CV y la experiencia.",
      });
    }

    const documentos = { ...anteriores, ...nuevos };

    if (!aprobado && (!documentos.documento || !documentos.selfie)) {
      await descartarSubidos();
      return res.status(400).json({
        mensaje: "Adjuntá la foto del documento y la selfie de validación",
      });
    }

    const cambios = { documentos };

    if (req.body.experiencia !== undefined) {
      const experiencia = String(req.body.experiencia).trim();

      if (experiencia.length > MAX_EXPERIENCIA) {
        await descartarSubidos();
        return res.status(400).json({
          mensaje: `La experiencia puede tener hasta ${MAX_EXPERIENCIA} caracteres`,
        });
      }

      cambios.experiencia = experiencia || null;
    }

    // Un rechazo previo vuelve a revisión cuando se envía documentación nueva
    const vuelveARevision = !aprobado && (nuevos.documento || nuevos.selfie);

    if (vuelveARevision) {
      cambios.estadoAprobacion = "pendiente";
      cambios.motivoRechazo = null;
    }

    await req.user.update(cambios);

    // Los archivos reemplazados ya no se usan
    await Promise.all(
      Object.keys(nuevos)
        .filter((campo) => anteriores[campo] && anteriores[campo] !== nuevos[campo])
        .map((campo) => borrarArchivoDocumento(anteriores[campo])),
    );

    if (vuelveARevision) {
      const administradores = await User.findAll({
        where: { rol: { [Op.in]: ROLES_ADMIN } },
        attributes: ["id"],
      });

      for (const administrador of administradores) {
        await crearNotificacion({
          usuarioId: administrador.id,
          tipo: "prestador-pendiente",
          titulo: "Prestador pendiente de aprobación",
          mensaje: `${req.user.nombre} ${req.user.apellido} envió su documentación para revisión.`,
        });
      }
    }

    return res.status(200).json({
      mensaje: vuelveARevision
        ? "Documentación enviada. La administración la revisará."
        : "Datos actualizados correctamente",
      usuario: publicUser(req.user),
    });
  } catch (error) {
    console.error("Error al cargar la documentación:", error);
    await descartarSubidos();
    return res
      .status(500)
      .json({ mensaje: "No se pudo guardar la documentación" });
  }
};

const hashResetToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const MINUTOS_VIGENCIA_RESET = 30;

export const solicitarRecuperacion = async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim();

    if (!email) {
      return res.status(400).json({ mensaje: "Ingresá tu correo electrónico" });
    }

    const user = await User.findOne({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expira = new Date(Date.now() + MINUTOS_VIGENCIA_RESET * 60 * 1000);

      await user.update({
        resetTokenHash: hashResetToken(token),
        resetExpira: expira,
      });

      const base = (
        process.env.FRONTEND_URL ||
        process.env.FRONTEND_ORIGIN ||
        "http://localhost:5173"
      ).replace(/\/$/, "");
      // Ruta de React que muestra el formulario de nueva contraseña
      const rutaRestablecer =
        process.env.PASSWORD_RESET_PATH || "/restablecer";
      const enlace = `${base}${rutaRestablecer}?token=${token}`;

      const plantilla = plantillaRecuperacion({
        nombre: user.nombre,
        enlace,
        minutos: MINUTOS_VIGENCIA_RESET,
      });

      const envio = await enviarEmail({
        to: user.email,
        subject: plantilla.subject,
        texto: plantilla.texto,
        html: plantilla.html,
        enlace,
      });

      if (envio?.error) {
        return res.status(502).json({
          mensaje: "No se pudo enviar el correo de recuperación",
        });
      }
    }

    return res.status(200).json({
      mensaje:
        "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña",
    });
  } catch (error) {
    console.error("Error al solicitar recuperación:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo procesar la solicitud" });
  }
};

export const restablecerPassword = async (req, res) => {
  try {
    const token = String(req.body.token ?? "").trim();
    const password = String(req.body.password ?? "");

    if (!token) {
      return res.status(400).json({ mensaje: "El enlace no es válido" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ mensaje: "La contraseña debe tener al menos 8 caracteres" });
    }

    const user = await User.findOne({
      where: { resetTokenHash: hashResetToken(token) },
    });

    if (!user || !user.resetExpira || new Date(user.resetExpira) < new Date()) {
      return res
        .status(400)
        .json({ mensaje: "El enlace es inválido o ya venció" });
    }

    await user.update({
      password: await hashPassword(password),
      resetTokenHash: null,
      resetExpira: null,
    });

    return res
      .status(200)
      .json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    return res
      .status(500)
      .json({ mensaje: "No se pudo restablecer la contraseña" });
  }
};
