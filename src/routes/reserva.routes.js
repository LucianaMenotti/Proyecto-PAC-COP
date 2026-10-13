import express from "express";

import {
    crearReserva
} from "../controllers/reserva.controller.js";

const router = express.Router();

router.post("/", crearReserva);

export default router;