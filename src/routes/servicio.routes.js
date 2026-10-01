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
router.post("/", crearServicio);
router.post("/demo", crearServicioDemo);
router.get("/", listarServicios);
router.get("/:id", obtenerServicio);
router.post("/:id/iniciar", iniciarServicio);
router.post("/:id/finalizar", finalizarServicio);
router.post("/:id/calificar", calificarServicio);
router.post("/:id/ubicacion", guardarUbicacion);
router.get("/:id/ubicacion", obtenerUbicacion);
router.post("/:id/calificacion", crearCalificacion);

export default router;
