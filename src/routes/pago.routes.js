import express from "express";
import {
    crearPago,
    confirmarPago,
    liberarPago,
    obtenerPago,
    listarLiquidaciones
} from "../controllers/pago.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", crearPago);
router.get("/liquidaciones", listarLiquidaciones);
router.get("/:id", obtenerPago);
router.post("/:id/confirmar", confirmarPago);
router.post("/:id/liberar", liberarPago);

export default router;
