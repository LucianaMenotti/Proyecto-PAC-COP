import { Op } from "sequelize";
import Pago from "../models/pago.model.js";
import Servicio from "../models/servicio.model.js";
import { crearNotificacion } from "./notificacion.controller.js";

const generarTransaccion = () => `PC-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const esAdministrador = (user) => ["admin", "administrador"].includes(user.rol);
const MINUTOS_VIGENCIA_PAGO = 15;

const pagoVencido = (pago) =>
    pago.estado === "pendiente" &&
    Date.now() - new Date(pago.createdAt).getTime() >
        MINUTOS_VIGENCIA_PAGO * 60 * 1000;

export const expirarPagosVencidos = async () => {
    const limite = new Date(Date.now() - MINUTOS_VIGENCIA_PAGO * 60 * 1000);

    const [afectados] = await Pago.update(
        { estado: "expirado", expiradoEn: new Date() },
        { where: { estado: "pendiente", createdAt: { [Op.lt]: limite } } },
    );

    return afectados;
};

export const liberarPagoDelServicio = async (servicioId) => {
    const pago = await Pago.findOne({
        where: { servicioId, estado: "retenido" }
    });
    if (!pago) return null;

    await pago.update({ estado: "liberado", liberadoEn: new Date() });
    return pago;
};

export const reembolsarPagoDelServicio = async (servicioId) => {
    const pago = await Pago.findOne({
        where: { servicioId, estado: { [Op.in]: ["pendiente", "retenido"] } }
    });
    if (!pago) return null;

    await pago.update({ estado: "reembolsado", reembolsadoEn: new Date() });
    return pago;
};

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

    if (["cancelado", "rechazado", "finalizado"].includes(servicio.estado)) {
        return res.status(409).json({ mensaje: "Esta reserva ya no admite pagos" });
    }

    const metodo = req.body.metodo === "billetera" ? "billetera" : "tarjeta";
    const ultimosDigitos = metodo === "tarjeta"
        ? String(req.body.ultimosDigitos || "").replace(/\D/g, "").slice(-4)
        : null;

    if (metodo === "tarjeta" && ultimosDigitos.length !== 4) {
        return res.status(400).json({ mensaje: "Se necesitan los últimos cuatro dígitos de la tarjeta" });
    }

    const [pago, creado] = await Pago.findOrCreate({
        where: { servicioId: servicio.id },
        defaults: {
            ownerId: servicio.ownerId,
            providerId: servicio.providerId,
            monto: servicio.monto,
            metodo,
            ultimosDigitos
        }
    });

    if (!creado && ["retenido", "liberado"].includes(pago.estado)) {
        return res.status(409).json({
            mensaje: "Esta reserva ya tiene un pago confirmado",
            estado: pago.estado,
            pago
        });
    }

    if (!creado && ["expirado", "fallido", "reembolsado"].includes(pago.estado)) {
        await pago.update({
            estado: "pendiente",
            metodo,
            ultimosDigitos,
            monto: servicio.monto,
            providerId: servicio.providerId,
            motivoFallo: null,
            expiradoEn: null,
            transaccionId: null,
            confirmadoEn: null,
            liberadoEn: null,
            reembolsadoEn: null
        });
    }

    return res.status(creado ? 201 : 200).json({ pago });
};

export const confirmarPago = async (req, res) => {
    await expirarPagosVencidos();

    const pago = await Pago.findOne({
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });

    if (pago.estado === "expirado") {
        return res.status(409).json({
            mensaje: "El pago expiró por falta de confirmación. Volvé a iniciar el pago.",
            estado: "expirado",
            pago
        });
    }

    if (pago.estado === "fallido") {
        return res.status(409).json({
            mensaje: pago.motivoFallo || "El pago fue rechazado. Probá con otro medio.",
            estado: "fallido",
            pago
        });
    }

    if (pago.estado !== "pendiente") return res.status(409).json({ mensaje: "El pago ya fue procesado", estado: pago.estado, pago });

    if (pago.metodo === "tarjeta" && pago.ultimosDigitos === "0000") {
        await pago.update({
            estado: "fallido",
            motivoFallo: "Tarjeta rechazada por el banco"
        });

        await crearNotificacion({
            usuarioId: pago.ownerId,
            tipo: "pago-fallido",
            titulo: "Pago rechazado",
            mensaje: `No se pudo procesar el pago del servicio #${pago.servicioId}. Podés reintentar con otro medio.`,
            servicioId: pago.servicioId
        });

        return res.status(402).json({
            mensaje: "El pago fue rechazado por el banco.",
            estado: "fallido",
            pago
        });
    }

    await pago.update({
        estado: "retenido",
        transaccionId: generarTransaccion(),
        confirmadoEn: new Date()
    });

    await crearNotificacion({
        usuarioId: pago.providerId,
        tipo: "pago-confirmado",
        titulo: "Pago confirmado",
        mensaje: `El dueño confirmó el pago del servicio #${pago.servicioId}.`,
        servicioId: pago.servicioId
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

    await crearNotificacion({
        usuarioId: pago.providerId,
        tipo: "pago-liberado",
        titulo: "Pago liberado",
        mensaje: `Se liberó el pago del servicio #${pago.servicioId} a tu favor.`,
        servicioId: pago.servicioId
    });

    return res.json({ pago });
};

export const listarLiquidaciones = async (req, res) => {
    if (req.user.rol !== "prestador") {
        return res.status(403).json({ mensaje: "Solo los prestadores ven liquidaciones" });
    }

    try {
        const limitePedido = Number(req.query.limite);
        const paginaPedida = Number(req.query.pagina);
        const limite =
            Number.isInteger(limitePedido) && limitePedido > 0
                ? Math.min(limitePedido, 200)
                : 200;
        const pagina =
            Number.isInteger(paginaPedida) && paginaPedida > 0 ? paginaPedida : 1;

        const { count, rows } = await Pago.findAndCountAll({
            where: { providerId: req.user.id, estado: "liberado" },
            order: [["liberadoEn", "DESC"]],
            limit: limite,
            offset: (pagina - 1) * limite,
        });

        const totales = await Pago.findAll({
            where: { providerId: req.user.id, estado: "liberado" },
            attributes: ["monto"],
        });

        const total = totales.reduce(
            (acumulador, pago) => acumulador + Number(pago.monto),
            0,
        );

        return res.json({
            pagos: rows.map((pago) => ({
                id: pago.id,
                servicioId: pago.servicioId,
                monto: Number(pago.monto),
                transaccionId: pago.transaccionId,
                liberadoEn: pago.liberadoEn,
            })),
            total,
            cantidad: count,
            pagina,
            limite,
            totalPaginas: Math.ceil(count / limite),
            cuenta: req.user.cuentaCobro || null,
        });
    } catch (error) {
        console.error("Error al listar liquidaciones:", error);
        return res.status(500).json({ mensaje: "No se pudieron cargar las liquidaciones" });
    }
};

export const obtenerPago = async (req, res) => {
    const pago = await Pago.findOne({
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });

    if (pagoVencido(pago)) {
        await pago.update({ estado: "expirado", expiradoEn: new Date() });
    }

    return res.json({ pago });
};

export const obtenerPagoPorServicio = async (req, res) => {
    const servicio = await obtenerServicioAutorizado(
        req.params.servicioId,
        req.user
    );
    if (!servicio) {
        return res.status(404).json({ mensaje: "Servicio no encontrado" });
    }

    const pago = await Pago.findOne({ where: { servicioId: servicio.id } });
    if (!pago) {
        return res
            .status(404)
            .json({ mensaje: "Todavía no hay un pago para esta reserva" });
    }

    if (pagoVencido(pago)) {
        await pago.update({ estado: "expirado", expiradoEn: new Date() });
    }

    return res.json({ pago });
};

export const marcarPagoFallido = async (req, res) => {
    const pago = await Pago.findOne({
        where: esAdministrador(req.user)
            ? { id: req.params.id }
            : { id: req.params.id, ownerId: req.user.id }
    });
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });

    if (pago.estado !== "pendiente") {
        return res.status(409).json({
            mensaje: "Solo se pueden rechazar pagos pendientes",
            estado: pago.estado,
            pago
        });
    }

    const motivo =
        String(req.body.motivo || "").trim() ||
        "El pago fue rechazado por el banco";

    await pago.update({ estado: "fallido", motivoFallo: motivo });

    return res.json({ pago });
};
