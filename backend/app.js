import express from "express";
import cors from "cors";
import { DataTypes } from "sequelize";
import "dotenv/config";

import sequelize from "./config/database.js";

import User from "./models/user.model.js";
import Mascota from "./models/mascota.model.js";
import Servicio from "./models/servicio.model.js";
import Ubicacion from "./models/ubicacion.model.js";
import Pago from "./models/pago.model.js";
import Calificacion from "./models/calificacion.model.js";
import Mensaje from "./models/mensaje.model.js";
import Notificacion from "./models/notificacion.model.js";
import Reserva from "./models/reserva.model.js";
import Reclamo from "./models/reclamo.model.js";

import userRoutes from "./routes/user.routes.js";
import mascotaRoutes from "./routes/mascota.routes.js";
import reservaRoutes from "./routes/reserva.routes.js";
import servicioRoutes from "./routes/servicio.routes.js";
import pagoRoutes from "./routes/pago.routes.js";
import mensajeRoutes from "./routes/mensaje.routes.js";
import reclamoRoutes from "./routes/reclamo.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";
import eventoRoutes from "./routes/evento.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { CARPETA_EVIDENCIAS } from "./middlewares/upload.middleware.js";

const app = express();

const esProduccion = process.env.NODE_ENV === "production";
const origenConfigurado = process.env.FRONTEND_ORIGIN;

const origenesPermitidos = new Set([
    origenConfigurado,
    ...(esProduccion
        ? []
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5500"
        ])
].filter(Boolean));

app.use(cors({
    origin: (origen, callback) => {
        if (!origen || origenesPermitidos.has(origen)) {
            callback(null, true);
            return;
        }

        callback(new Error(`Origen no permitido: ${origen}`));
    },
    credentials: true
}));

// El límite alto permite enviar fotos del chat como data URL
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/mascotas", mascotaRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/reclamos", reclamoRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads/reclamos", express.static(CARPETA_EVIDENCIAS));

// Cualquier ruta /api sin coincidencia responde JSON (nunca HTML)
app.use("/api", (req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Errores no controlados (CORS, JSON inválido, cuerpo demasiado grande, etc.)
app.use((error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error?.type === "entity.too.large") {
        res.status(413).json({ mensaje: "El contenido enviado es demasiado grande" });
        return;
    }

    if (error?.type === "entity.parse.failed") {
        res.status(400).json({ mensaje: "El cuerpo de la petición no es un JSON válido" });
        return;
    }

    if (String(error?.message || "").startsWith("Origen no permitido")) {
        res.status(403).json({ mensaje: error.message });
        return;
    }

    console.error("Error no controlado:", error);
    res.status(error?.status || 500).json({ mensaje: "Error interno del servidor" });
});

const PORT = process.env.PORT || 3000;

const MODELOS = [
    User,
    Mascota,
    Servicio,
    Ubicacion,
    Pago,
    Calificacion,
    Mensaje,
    Notificacion,
    Reserva,
    Reclamo
];

// Migración idempotente: agrega las columnas nuevas que existan en el modelo
// pero todavía no en la tabla (como opcionales) antes de sincronizar.
const asegurarColumnasFaltantes = async (modelo) => {
    const queryInterface = sequelize.getQueryInterface();
    const tabla = modelo.getTableName();
    let existentes;

    try {
        existentes = await queryInterface.describeTable(tabla);
    } catch {
        return;
    }

    for (const [nombre, definicion] of Object.entries(modelo.getAttributes())) {
        if (existentes[nombre]) continue;
        if (definicion.primaryKey) continue;
        if (nombre === "createdAt" || nombre === "updatedAt") continue;

        await queryInterface.addColumn(tabla, nombre, {
            type: definicion.type,
            allowNull: true
        });

        console.log(`Columna agregada: ${tabla}.${nombre}`);
    }
};

// Completa los datos de filas creadas antes de las columnas de verificación y cuenta.
// Un prestador ya verificado queda aprobado; el resto espera la revisión del administrador.
const normalizarDatosHeredados = async () => {
    await User.update(
        { estadoAprobacion: "aprobado" },
        { where: { rol: "prestador", estadoAprobacion: null, verificado: true } }
    );
    await User.update(
        { estadoAprobacion: "pendiente" },
        { where: { rol: "prestador", estadoAprobacion: null } }
    );
    await User.update({ estadoCuenta: "activa" }, { where: { estadoCuenta: null } });
};

const iniciarServidor = async () => {
    try {
        await sequelize.authenticate();

        console.log(
            "Conexión con MySQL establecida correctamente"
        );

        for (const modelo of MODELOS) {
            await asegurarColumnasFaltantes(modelo);
        }

        const actualizarEstructura =
            !esProduccion && process.env.DB_SYNC_ALTER !== "false";

        await sequelize.sync(
            actualizarEstructura ? { alter: true } : {}
        );

        if (actualizarEstructura) {
            await sequelize.getQueryInterface().changeColumn(
                User.getTableName(),
                "password",
                {
                    type: DataTypes.STRING(255),
                    allowNull: false
                }
            );
        }

        await normalizarDatosHeredados();

        console.log(
            actualizarEstructura
                ? "Tablas creadas o actualizadas correctamente; password admite hashes completos"
                : "Tablas sincronizadas correctamente"
        );

        app.listen(PORT, () => {
            console.log(
                `Servidor Pac-Cop ejecutándose en http://localhost:${PORT}`
            );
        });
    } catch (error) {
        const detalle =
            error?.message || error?.original?.message || error?.parent?.message;
        const codigo =
            error?.original?.code || error?.parent?.code || error?.code;

        console.error("No se pudo iniciar la aplicación:");
        console.error(`Tipo de error: ${error?.name || "Error desconocido"}`);
        if (codigo) console.error(`Código: ${codigo}`);
        console.error(
            `Detalle: ${detalle || "El controlador no proporcionó un mensaje."}`
        );

        if (
            error?.name === "SequelizeConnectionError" ||
            String(codigo || "").startsWith("ECONN")
        ) {
            console.error(
                "Comprueba que MySQL esté iniciado y que DB_HOST, DB_PORT, DB_USER y DB_PASSWORD en .env sean correctos."
            );
        }

        process.exitCode = 1;
    }
};

iniciarServidor();
