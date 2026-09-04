import express from "express";

import {
    crearMascota,
    obtenerMascotasPorUsuario,
    obtenerMascotaPorId,
    actualizarMascota
} from "../controllers/mascota.controller.js";

const router = express.Router();


// Crear mascota
router.post("/", crearMascota);


// Obtener todas las mascotas de un usuario
router.get("/usuario/:userId", obtenerMascotasPorUsuario);


// Obtener una mascota específica
router.get("/:id", obtenerMascotaPorId);


// Actualizar ficha de salud
router.put("/:id", actualizarMascota);


export default router;