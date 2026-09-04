import Mascota from "../models/mascota.model.js";


// ===============================
// CREAR MASCOTA
// ===============================

export const crearMascota = async (req, res) => {
    try {

        const {
            nombre,
            especie,
            raza,
            edad,
            descripcion,
            condicion,
            alergias,
            vacunacion,
            reactividad,
            alertaDueno,
            userId
        } = req.body;


        const mascota = await Mascota.create({
            nombre,
            especie,
            raza,
            edad,
            descripcion,
            condicion,
            alergias,
            vacunacion,
            reactividad,
            alertaDueno,
            userId
        });


        res.status(201).json({
            mensaje: "Mascota registrada correctamente",
            mascota
        });


    } catch (error) {

        console.error("Error al crear mascota:", error);

        res.status(500).json({
            mensaje: "Error al registrar la mascota"
        });
    }
};


// ===============================
// OBTENER MASCOTAS POR USUARIO
// ===============================

export const obtenerMascotasPorUsuario = async (req, res) => {
    try {

        const mascotas = await Mascota.findAll({
            where: {
                userId: req.params.userId
            }
        });


        res.status(200).json(mascotas);


    } catch (error) {

        console.error("Error al obtener mascotas:", error);

        res.status(500).json({
            mensaje: "Error al obtener las mascotas"
        });
    }
};


// ===============================
// OBTENER UNA MASCOTA POR ID
// ===============================

export const obtenerMascotaPorId = async (req, res) => {
    try {

        const mascota = await Mascota.findByPk(req.params.id);


        if (!mascota) {

            return res.status(404).json({
                mensaje: "Mascota no encontrada"
            });
        }


        res.status(200).json(mascota);


    } catch (error) {

        console.error("Error al obtener mascota:", error);

        res.status(500).json({
            mensaje: "Error al obtener la mascota"
        });
    }
};


// ===============================
// ACTUALIZAR FICHA DE SALUD
// ===============================

export const actualizarMascota = async (req, res) => {
    try {

        const {
            condicion,
            alergias,
            vacunacion,
            reactividad,
            alertaDueno
        } = req.body;


        const mascota = await Mascota.findByPk(req.params.id);


        if (!mascota) {

            return res.status(404).json({
                mensaje: "Mascota no encontrada"
            });
        }


        await mascota.update({
            condicion,
            alergias,
            vacunacion,
            reactividad,
            alertaDueno
        });


        res.status(200).json({
            mensaje: "Ficha de salud actualizada correctamente",
            mascota
        });


    } catch (error) {

        console.error("Error al actualizar mascota:", error);

        res.status(500).json({
            mensaje: "Error al actualizar la ficha de salud"
        });
    }
};