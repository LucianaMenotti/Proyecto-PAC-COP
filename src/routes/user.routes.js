import express from "express";

import {
    crearUsuario,
    iniciarSesion,
    obtenerUsuarios,
    obtenerUsuarioPorId
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", crearUsuario);

router.post("/login", iniciarSesion);

router.get("/", obtenerUsuarios);

router.get("/:id", obtenerUsuarioPorId);

export default router;