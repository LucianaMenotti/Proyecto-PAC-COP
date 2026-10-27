import express from "express";
import cors from "cors";
import { DataTypes } from "sequelize";
import "dotenv/config";

import sequelize from "./config/database.js";

import Reserva from "./models/reserva.model.js";

import Mensaje from "./models/mensaje.model.js";
import User from "./models/user.model.js";
import Mascota from "./models/mascota.model.js";
import Servicio from "./models/servicio.model.js";
import Ubicacion from "./models/ubicacion.model.js";
import Pago from "./models/pago.model.js";
import Reclamo from "./models/reclamo.model.js";
import Notificacion from "./models/notificacion.model.js";

import userRoutes from "./routes/user.routes.js";
import mascotaRoutes from "./routes/mascota.routes.js";
import reservaRoutes from "./routes/reserva.routes.js";
import servicioRoutes from "./routes/servicio.routes.js";

import mensajeRoutes from "./routes/mensaje.routes.js";

import pagoRoutes from "./routes/pago.routes.js";

import reclamoRoutes from "./routes/reclamo.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";

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
app.use("/uploads/reclamos", express.static(CARPETA_EVIDENCIAS));

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
    try {
        await sequelize.authenticate();

        console.log(
            "Conexión con MySQL establecida correctamente"
        );

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
            console.error("No se pudo iniciar la aplicación:");
            console.error(error);
            process.exitCode = 1;
        }
};

iniciarServidor();
