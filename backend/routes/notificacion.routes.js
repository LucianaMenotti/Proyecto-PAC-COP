import express from "express";
import {
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../controllers/notificacion.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarNotificaciones);
router.post("/leer-todas", marcarTodasLeidas);
router.post("/:id/leer", marcarLeida);

export default router;
