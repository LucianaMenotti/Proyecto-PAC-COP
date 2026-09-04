import User from "../models/user.model.js";

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
            rol,
            servicios,
            vehiculo
        } = req.body;


        // ===============================
        // VALIDACIONES GENERALES
        // ===============================

        if (
            !nombre ||
            !apellido ||
            !dni ||
            !fechaNacimiento ||
            !email ||
            !password ||
            !telefono
        ) {
            return res.status(400).json({
                mensaje: "Completá todos los datos obligatorios"
            });
        }


        if (!["dueño", "prestador"].includes(rol)) {
            return res.status(400).json({
                mensaje: "El rol seleccionado no es válido"
            });
        }


        // ===============================
        // COMPROBAR EMAIL
        // ===============================

        const usuarioExistente = await User.findOne({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({
                mensaje: "El correo ya está registrado"
            });
        }


        // ===============================
        // COMPROBAR DNI
        // ===============================

        const dniExistente = await User.findOne({
            where: { dni }
        });

        if (dniExistente) {
            return res.status(400).json({
                mensaje: "El DNI ya está registrado"
            });
        }


        // ===============================
        // DATOS DEL PRESTADOR
        // ===============================

        let zonaUsuario = null;
        let serviciosUsuario = null;
        let vehiculoUsuario = null;


        if (rol === "prestador") {

            if (!zona) {
                return res.status(400).json({
                    mensaje: "El prestador debe indicar su zona de trabajo"
                });
            }


            if (!Array.isArray(servicios) || servicios.length === 0) {
                return res.status(400).json({
                    mensaje: "El prestador debe seleccionar al menos un servicio"
                });
            }


            zonaUsuario = zona;
            serviciosUsuario = servicios;


            // El vehículo solamente es necesario para traslado
            if (servicios.includes("Traslado")) {

                if (!vehiculo) {
                    return res.status(400).json({
                        mensaje: "Debés seleccionar un vehículo para realizar traslados"
                    });
                }

                vehiculoUsuario = vehiculo;
            }
        }


        // ===============================
        // CREAR USUARIO
        // ===============================

        const nuevoUsuario = await User.create({
            nombre,
            apellido,
            dni,
            fechaNacimiento,
            email,
            password,
            telefono,
            zona: zonaUsuario,
            rol,
            servicios: serviciosUsuario,
            vehiculo: vehiculoUsuario
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


// ===============================
// INICIAR SESIÓN
// ===============================

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


// ===============================
// OBTENER TODOS LOS USUARIOS
// ===============================

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


// ===============================
// OBTENER USUARIO POR ID
// ===============================

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