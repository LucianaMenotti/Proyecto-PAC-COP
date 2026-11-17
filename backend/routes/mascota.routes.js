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

router.post("/", authMiddleware, validateMascota, crearMascota);

router.get("/usuario/:userId", authMiddleware, ownerOrAdminMiddleware, obtenerMascotasPorUsuario);

router.get("/:id", authMiddleware, mascotaOwnerMiddleware, obtenerMascotaPorId);

router.put("/:id", authMiddleware, mascotaOwnerMiddleware, actualizarMascota);

export default router;
