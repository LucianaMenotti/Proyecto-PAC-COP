import Pago from "../models/pago.model.js";
import Servicio from "../models/servicio.model.js";

const generarTransaccion = () => `PC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

const obtenerServicioDelDueno = async (id, userId) =>
    Servicio.findOne({ where: { id, ownerId: userId } });

export const crearPago = async (req, res) => {
    const servicio = await obtenerServicioDelDueno(req.body.servicioId, req.user.id);
    if (!servicio) return res.status(404).json({ mensaje: "Servicio no encontrado" });

    const metodo = req.body.metodo === "billetera" ? "billetera" : "tarjeta";
    const ultimosDigitos = metodo === "tarjeta"
        ? String(req.body.ultimosDigitos || "").replace(/\D/g, "").slice(-4)
        : null;

    if (metodo === "tarjeta" && ultimosDigitos.length !== 4) {
        return res.status(400).json({ mensaje: "Se necesitan los últimos cuatro dígitos de la tarjeta" });
    }

    const [pago] = await Pago.findOrCreate({
        where: { servicioId: servicio.id },
        defaults: {
            ownerId: req.user.id,
            monto: servicio.monto,
            metodo,
            ultimosDigitos
        }
    });

    return res.status(201).json({ pago });
};

export const confirmarPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });
    if (pago.estado !== "pendiente") return res.status(409).json({ mensaje: "El pago ya fue procesado" });

    await pago.update({
        estado: "retenido",
        transaccionId: generarTransaccion(),
        confirmadoEn: new Date()
    });

    return res.json({ pago });
};

export const liberarPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });
    if (pago.estado !== "retenido") return res.status(409).json({ mensaje: "El pago no está retenido" });

    await pago.update({ estado: "liberado", liberadoEn: new Date() });
    return res.json({ pago });
};

export const obtenerPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });

    return res.json({ pago });
};
