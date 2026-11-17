import express from "express";

import {
    crearUsuario,
    iniciarSesion,
    cerrarSesion,
    obtenerSesion,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarMisServicios,
    actualizarDisponibilidad,
    actualizarRestricciones,
    actualizarVehiculo,
    actualizarCuentaCobro,
    solicitarRecuperacion,
    restablecerPassword
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateUser, validateActualizarServicios } from "../middlewares/validation.middleware.js";
import { crearLimitador } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

const limitadorRegistro = crearLimitador({ maximo: 30, ventanaMs: 15 * 60 * 1000 });
const limitadorLogin = crearLimitador({ maximo: 60, ventanaMs: 15 * 60 * 1000 });
const limitadorRecuperacion = crearLimitador({ maximo: 10, ventanaMs: 15 * 60 * 1000 });

router.post("/", limitadorRegistro, validateUser, crearUsuario);

router.post("/login", limitadorLogin, iniciarSesion);

router.post("/recuperar", limitadorRecuperacion, solicitarRecuperacion);

router.post("/restablecer", limitadorRecuperacion, restablecerPassword);

router.post("/logout", cerrarSesion);

router.get("/me", authMiddleware, obtenerSesion);

router.get("/", obtenerUsuarios);

router.get("/:id", authMiddleware, obtenerUsuarioPorId);

router.put("/me/servicios", authMiddleware, validateActualizarServicios, actualizarMisServicios);

router.put("/me/disponibilidad", authMiddleware, actualizarDisponibilidad);

router.put("/me/restricciones", authMiddleware, actualizarRestricciones);

router.put("/me/vehiculo", authMiddleware, actualizarVehiculo);

router.put("/me/cuenta-cobro", authMiddleware, actualizarCuentaCobro);

export default router;
