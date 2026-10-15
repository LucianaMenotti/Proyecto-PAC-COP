import express from "express";

import {
    crearMascota,
    obtenerMascotasPorUsuario
} from "../controllers/mascota.controller.js";

const router = express.Router();

router.post("/", crearMascota);

router.get("/usuario/:userId", obtenerMascotasPorUsuario);

export default router;