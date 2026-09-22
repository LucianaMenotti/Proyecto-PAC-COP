import User from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../helpers/password.helper.js";
import {
    clearAuthCookie,
    createAuthToken,
    setAuthCookie
} from "../helpers/auth.helper.js";

const PUBLIC_USER_FIELDS = [
    "id",
    "nombre",
    "apellido",
    "dni",
    "fechaNacimiento",
    "email",
    "telefono",
    "zona",
    "rol",
    "servicios",
    "vehiculo",
    "verificado",
    "calificacion",
    "resenas"
];

const DIRECTORY_USER_FIELDS = [
    "id",
    "nombre",
    "apellido",
    "zona",
    "rol",
    "servicios",
    "vehiculo",
    "verificado",
    "calificacion",
    "resenas"
];

const publicUser = (user) => {
    const data = user.toJSON ? user.toJSON() : user;
    return Object.fromEntries(
        PUBLIC_USER_FIELDS
            .filter((field) => data[field] !== undefined)
            .map((field) => [field, data[field]])
    );
};


export const crearUsuario = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            dni,
            fechaNacimiento,
            email,
            password,
            telefono,
            zona,
            rol = "dueño",
            servicios,
            vehiculo
        } = req.body;

        
        if (rol === "prestador" && (!zona || !Array.isArray(servicios) || servicios.length === 0)) {
            return res.status(400).json({
                mensaje: "El prestador debe indicar zona y al menos un servicio"
            });
        }

        if (rol === "prestador" && servicios.includes("Traslado") && !vehiculo) {
            return res.status(400).json({
                mensaje: "Debés seleccionar un vehículo para realizar traslados"
            });
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(409).json({ mensaje: "El correo ya está registrado" });
        }

        const existingDni = await User.findOne({ where: { dni } });

        if (existingDni) {
            return res.status(409).json({ mensaje: "El DNI ya está registrado" });
        }

        const user = await User.create({
            nombre,
            apellido,
            dni,
            fechaNacimiento,
            email,
            password: await hashPassword(password),
            telefono,
            zona: rol === "prestador" ? zona : null,
            rol,
            servicios: rol === "prestador" ? servicios : null,
            vehiculo: rol === "prestador" ? vehiculo ?? null : null
        });

        setAuthCookie(res, createAuthToken(user));

        return res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: publicUser(user)
        });
    } catch (error) {
        console.error("Error al crear usuario:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({ mensaje: "El email o DNI ya está registrado" });
        }

        return res.status(500).json({ mensaje: "Error al registrar el usuario" });
    }
};

export const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ mensaje: "El correo y la contraseña son obligatorios" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
        }

        const passwordResult = await verifyPassword(password, user.password);

        if (!passwordResult.valid) {
            return res.status(401).json({ mensaje: "Correo o contraseña incorrectos" });
        }

        if (passwordResult.needsUpgrade) {
            await user.update({ password: await hashPassword(password) });
        }

        setAuthCookie(res, createAuthToken(user));

        return res.status(200).json({
            mensaje: "Inicio de sesión correcto",
            usuario: publicUser(user)
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

export const obtenerSesion = (req, res) => res.status(200).json({ usuario: publicUser(req.user) });

export const obtenerUsuarios = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: DIRECTORY_USER_FIELDS,
            order: [["nombre", "ASC"]]
        });

        return res.status(200).json(users);
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
            attributes: esPropioOAdmin ? PUBLIC_USER_FIELDS : DIRECTORY_USER_FIELDS
        });

        if (!user) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error al obtener usuario:", error);
        return res.status(500).json({ mensaje: "Error al obtener el usuario" });
    }
};
export const actualizarMisServicios = async (req, res) => {
    try {
        if (req.user.rol !== "prestador") {
            return res.status(403).json({ mensaje: "Solo un prestador puede publicar servicios" });
        }

        const { servicios, preciosServicios } = req.body;

        if (servicios.includes("Traslado") && !req.user.vehiculo) {
            return res.status(400).json({
                mensaje: "Necesitás cargar un vehículo en tu perfil para ofrecer Traslado"
            });
        }

        await req.user.update({ servicios, preciosServicios });

        return res.status(200).json({
            mensaje: "Servicios actualizados correctamente",
            usuario: publicUser(req.user)
        });
    } catch (error) {
        console.error("Error al actualizar servicios:", error);
        return res.status(500).json({ mensaje: "No se pudieron actualizar los servicios" });
    }
};