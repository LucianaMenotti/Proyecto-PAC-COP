import Reserva from "../models/reserva.model.js";
import User from "../models/user.model.js";
import Mascota from "../models/mascota.model.js";

export const crearReserva = async (req, res) => {

    try {

        const {
            userId,
            mascotaId,
            prestadorId,
            servicio,
            fecha,
            hora
        } = req.body;

        if (
            !userId ||
            !mascotaId ||
            !prestadorId ||
            !servicio ||
            !fecha ||
            !hora
        ) {
            return res.status(400).json({
                mensaje: "Todos los datos de la reserva son obligatorios"
            });
        }

        // Verificar que exista el dueño
        const dueno = await User.findByPk(userId);

        if (!dueno || dueno.rol !== "dueño") {
            return res.status(404).json({
                mensaje: "El dueño no existe"
            });
        }

        // Verificar que la mascota exista y pertenezca al dueño
        const mascota = await Mascota.findOne({
            where: {
                id: mascotaId,
                userId: userId
            }
        });

        if (!mascota) {
            return res.status(404).json({
                mensaje: "La mascota no existe o no pertenece al dueño"
            });
        }

        // Verificar que exista el prestador
        const prestador = await User.findByPk(prestadorId);

        if (!prestador || prestador.rol !== "prestador") {
            return res.status(404).json({
                mensaje: "El prestador no existe"
            });
        }

        // Verificar que el prestador ofrezca el servicio
        const servicios = Array.isArray(prestador.servicios)
            ? prestador.servicios
            : [];

        if (!servicios.includes(servicio)) {
            return res.status(400).json({
                mensaje: "El prestador no ofrece ese servicio"
            });
        }

        // Verificar que no exista otra reserva en ese horario
        const reservaExistente = await Reserva.findOne({
            where: {
                prestadorId,
                fecha,
                hora
            }
        });

        if (reservaExistente) {
            return res.status(400).json({
                mensaje: "El horario seleccionado no está disponible"
            });
        }

        // Crear reserva
        const reserva = await Reserva.create({
            userId,
            mascotaId,
            prestadorId,
            servicio,
            fecha,
            hora,
            estado: "pendiente"
        });

        return res.status(201).json({
            mensaje: "Reserva creada correctamente",
            reserva
        });

    } catch (error) {

        console.error("Error al crear reserva:", error);

        return res.status(500).json({
            mensaje: "Error al crear la reserva"
        });
    }
};