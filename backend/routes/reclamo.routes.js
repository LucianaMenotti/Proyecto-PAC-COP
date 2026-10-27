import express from "express";
import {
  crearReclamo,
  listarReclamos,
  actualizarEstadoReclamo,
} from "../controllers/reclamo.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { subirEvidencias } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarReclamos);
router.post("/", subirEvidencias, crearReclamo);
router.patch("/:id/estado", actualizarEstadoReclamo);

export default router;
