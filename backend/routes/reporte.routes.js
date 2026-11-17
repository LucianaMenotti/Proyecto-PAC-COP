import express from "express";
import { crearReporte } from "../controllers/moderacion.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Reporte de un usuario o de una reseña (lo revisa la administración)
router.post("/", authMiddleware, crearReporte);

export default router;
