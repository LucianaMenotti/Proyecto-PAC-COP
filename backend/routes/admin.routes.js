import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import {
  resumenAdmin,
  listarUsuariosAdmin,
  actualizarUsuarioAdmin,
  obtenerLegajoAdmin,
  descargarDocumentoAdmin,
  resolverAprobacion,
  cambiarSuspension,
  listarServiciosAdmin,
  cancelarServicioAdmin,
  listarAccionesAdmin,
} from "../controllers/admin.controller.js";
import {
  listarReportesAdmin,
  resolverReporte,
  listarResenasAdmin,
  cambiarVisibilidadResena,
  eliminarResena,
} from "../controllers/moderacion.controller.js";

const router = express.Router();

// Todo el panel exige sesión y rol administrativo, verificado en el servidor
router.use(authMiddleware, adminMiddleware);

router.get("/resumen", resumenAdmin);

router.get("/usuarios", listarUsuariosAdmin);
router.get("/usuarios/:id", obtenerLegajoAdmin);
router.put("/usuarios/:id", actualizarUsuarioAdmin);
router.get("/usuarios/:id/documentos/:tipo", descargarDocumentoAdmin);
router.post("/usuarios/:id/aprobacion", resolverAprobacion);
router.post("/usuarios/:id/suspension", cambiarSuspension);

router.get("/servicios", listarServiciosAdmin);
router.post("/servicios/:id/cancelar", cancelarServicioAdmin);

// Moderación de reseñas y reportes de usuarios
router.get("/reportes", listarReportesAdmin);
router.patch("/reportes/:id", resolverReporte);
router.get("/resenas", listarResenasAdmin);
router.patch("/resenas/:id", cambiarVisibilidadResena);
router.delete("/resenas/:id", eliminarResena);

router.get("/acciones", listarAccionesAdmin);

export default router;
