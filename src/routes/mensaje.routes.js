import express from "express";

import {
    obtenerMensajes,
    enviarMensaje
} from "../controllers/mensaje.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:servicioId", obtenerMensajes);

router.post("/:servicioId", enviarMensaje);

export default router;