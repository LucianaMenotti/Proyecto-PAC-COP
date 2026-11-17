import express from "express";

import {
    crearReserva
} from "../controllers/reserva.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, crearReserva);

export default router;
