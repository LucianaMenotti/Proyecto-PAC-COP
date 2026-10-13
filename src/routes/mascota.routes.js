import express from "express";

import {
    crearMascota,
    obtenerMascotasPorUsuario,
    obtenerMascotaPorId,
    actualizarMascota
} from "../controllers/mascota.controller.js";
import {
    authMiddleware,
    mascotaOwnerMiddleware,
    ownerOrAdminMiddleware
} from "../middlewares/auth.middleware.js";
import { validateMascota } from "../middlewares/validation.middleware.js";

const router = express.Router();


// Crear mascota
router.post("/", authMiddleware, validateMascota, crearMascota);


// Obtener todas las mascotas de un usuario
router.get("/usuario/:userId", authMiddleware, ownerOrAdminMiddleware, obtenerMascotasPorUsuario);


// Obtener una mascota específica
router.get("/:id", authMiddleware, mascotaOwnerMiddleware, obtenerMascotaPorId);


// Actualizar ficha de salud
router.put("/:id", authMiddleware, mascotaOwnerMiddleware, actualizarMascota);


export default router;
