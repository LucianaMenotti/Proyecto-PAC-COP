import { Router } from "express";
import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import {
  resumenAdmin,
  listarUsuariosAdmin,
  actualizarUsuarioAdmin,
  listarServiciosAdmin,
  cancelarServicioAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/resumen", resumenAdmin);

router.get("/usuarios", listarUsuariosAdmin);
router.put("/usuarios/:id", actualizarUsuarioAdmin);

router.get("/servicios", listarServiciosAdmin);
router.post("/servicios/:id/cancelar", cancelarServicioAdmin);

export default router;
