import User from "../models/user.model.js";

export const crearUsuario = async (req, res) => {
    try {

        const {
            nombre,
            apellido,
            email,
            password,
            telefono,
            zona,
            rol,
            servicios
        } = req.body;

        const usuarioExistente = await User.findOne({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({
                mensaje: "El correo ya está registrado"
            });
        }

        const nuevoUsuario = await User.create({
            nombre,
            apellido,
            email,
            password,
            telefono,
            zona,
            rol: rol || "dueño",
            servicios
        });

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: nuevoUsuario
        });

    } catch (error) {

        console.error("Error al crear usuario:", error);

        res.status(500).json({
            mensaje: "Error al registrar el usuario"
        });
    }
};

export const iniciarSesion = async (req, res) => {
    try {

        const { email, password } = req.body;

        const usuario = await User.findOne({
            where: { email }
        });

        if (!usuario || usuario.password !== password) {

            return res.status(401).json({
                mensaje: "Correo o contraseña incorrectos"
            });
        }

        res.status(200).json({
            mensaje: "Inicio de sesión correcto",
            usuario
        });

    } catch (error) {

        console.error("Error al iniciar sesión:", error);

        res.status(500).json({
            mensaje: "Error al iniciar sesión"
        });
    }
};

export const obtenerUsuarios = async (req, res) => {
    try {

        const usuarios = await User.findAll();

        res.status(200).json(usuarios);

    } catch (error) {

        console.error("Error al obtener usuarios:", error);

        res.status(500).json({
            mensaje: "Error al obtener los usuarios"
        });
    }
};

export const obtenerUsuarioPorId = async (req, res) => {
    try {

        const usuario = await User.findByPk(req.params.id);

        if (!usuario) {

            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.status(200).json(usuario);

    } catch (error) {

        console.error("Error al obtener usuario:", error);

        res.status(500).json({
            mensaje: "Error al obtener el usuario"
        });
    }
};