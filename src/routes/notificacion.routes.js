import express from "express";
import {
    listarNotificaciones,
    marcarNotificacionLeida,
    marcarTodasLeidas
} from "../controllers/notificacion.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarNotificaciones);
router.post("/leer-todas", marcarTodasLeidas);
router.post("/:id/leer", marcarNotificacionLeida);

export default router;
