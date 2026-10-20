import Pago from "../models/pago.model.js";
import Servicio from "../models/servicio.model.js";

const generarTransaccion = () => `PC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const esAdministrador = (user) => ["admin", "administrador"].includes(user.rol);

const obtenerServicioAutorizado = async (id, user) =>
    Servicio.findOne({
        where: esAdministrador(user)
            ? { id }
            : { id, ownerId: user.id }
    });

export const crearPago = async (req, res) => {
    if (req.user.rol === "prestador") {
        return res.status(403).json({ mensaje: "El prestador no puede crear pagos" });
    }

    const servicio = await obtenerServicioAutorizado(req.body.servicioId, req.user);
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
            ownerId: servicio.ownerId,
            monto: servicio.monto,
            metodo,
            ultimosDigitos
        }
    });

    return res.status(201).json({ pago });
};

export const confirmarPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
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
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });
    if (pago.estado !== "retenido") return res.status(409).json({ mensaje: "El pago no está retenido" });

    await pago.update({ estado: "liberado", liberadoEn: new Date() });
    return res.json({ pago });
};

export const obtenerPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });

    return res.json({ pago });
};
