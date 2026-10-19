import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { suscribirEventos } from "../helpers/realtime.helper.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
    });

    res.status(200);
    res.flushHeaders?.();
    res.write("retry: 5000\n\n");
    res.write(
        `event: conectado\ndata: ${JSON.stringify({ usuarioId: req.user.id })}\n\n`
    );

    const desuscribir = suscribirEventos((evento) => {
        if (Number(evento.usuarioId) !== Number(req.user.id)) return;

        res.write(`event: ${evento.tipo}\ndata: ${JSON.stringify(evento.datos)}\n\n`);
    });

    const latido = setInterval(() => res.write(": ping\n\n"), 25000);

    req.on("close", () => {
        clearInterval(latido);
        desuscribir();
        res.end();
    });
});

export default router;
