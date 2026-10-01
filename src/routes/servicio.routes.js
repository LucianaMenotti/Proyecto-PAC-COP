import express from "express";

import {
  crearServicioDemo,
  listarServicios,
  obtenerServicio,
  iniciarServicio,
  finalizarServicio,
  guardarUbicacion,
  obtenerUbicacion,
  crearCalificacion,
} from "../controllers/servicio.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Servicio utilizado para la demo actual
router.post("/demo", crearServicioDemo);

// Servicios existentes
router.get("/", listarServicios);
router.get("/:id", obtenerServicio);

// Estados del servicio
router.post("/:id/iniciar", iniciarServicio);
router.post("/:id/finalizar", finalizarServicio);

// Seguimiento GPS
router.post("/:id/ubicacion", guardarUbicacion);
router.get("/:id/ubicacion", obtenerUbicacion);

// Calificación del dueño
router.post("/:id/calificacion", crearCalificacion);

export default router;
