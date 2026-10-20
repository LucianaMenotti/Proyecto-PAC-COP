import Mascota from "../models/mascota.model.js";

export const crearMascota = async (req, res) => {
    try {

        const {
            nombre,
            especie,
            raza,
            edad,
            descripcion,
            userId
        } = req.body;

        const mascota = await Mascota.create({
            nombre,
            especie,
            raza,
            edad,
            descripcion,
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