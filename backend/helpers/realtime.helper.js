import { EventEmitter } from "node:events";

const bus = new EventEmitter();
bus.setMaxListeners(0);

export const publicarEvento = (usuarioId, tipo, datos = null) => {
    if (!usuarioId || !tipo) return;

    bus.emit("evento", {
        usuarioId: Number(usuarioId),
        tipo,
        datos,
        momento: new Date().toISOString()
    });
};

export const suscribirEventos = (manejador) => {
    bus.on("evento", manejador);

    return () => bus.off("evento", manejador);
};
