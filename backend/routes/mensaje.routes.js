import express from "express";

import {
    obtenerMensajes,
    enviarMensaje,
    obtenerImagen
} from "../controllers/mensaje.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:servicioId", obtenerMensajes);

router.get("/:servicioId/imagen/:archivo", obtenerImagen);

router.post("/:servicioId", enviarMensaje);

export default router;
