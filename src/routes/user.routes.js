import express from "express";

import {
    crearUsuario,
    iniciarSesion,
    cerrarSesion,
    obtenerSesion,
    obtenerUsuarios,
    obtenerUsuarioPorId
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateUser } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/", validateUser, crearUsuario);

router.post("/login", iniciarSesion);

router.post("/logout", cerrarSesion);

router.get("/me", authMiddleware, obtenerSesion);

router.get("/", obtenerUsuarios);

router.get("/:id", obtenerUsuarioPorId);

export default router;
