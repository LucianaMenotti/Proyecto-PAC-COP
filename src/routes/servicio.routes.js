import express from "express";

import {
  crearServicio,
  crearServicioDemo,
  listarServicios,
  obtenerServicio,
  iniciarServicio,
  finalizarServicio,
  aceptarServicio,
  rechazarServicio,
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

// Confirmación de la reserva (prestador)
router.post("/:id/aceptar", aceptarServicio);
router.post("/:id/rechazar", rechazarServicio);

// Estados del servicio
router.post("/:id/iniciar", iniciarServicio);
router.post("/:id/finalizar", finalizarServicio);

// Seguimiento GPS
router.post("/:id/ubicacion", guardarUbicacion);
router.get("/:id/ubicacion", obtenerUbicacion);

// Calificación del dueño
router.post("/:id/calificacion", crearCalificacion);

export default router;
