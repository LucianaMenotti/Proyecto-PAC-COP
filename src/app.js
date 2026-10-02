import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import sequelize from "./config/database.js";
import { DataTypes } from "sequelize";

import Reserva from "./models/reserva.model.js";
import User from "./models/user.model.js";
import Mascota from "./models/mascota.model.js";
import Servicio from "./models/servicio.model.js";
import Ubicacion from "./models/ubicacion.model.js";
import Pago from "./models/pago.model.js";

import userRoutes from "./routes/user.routes.js";
import mascotaRoutes from "./routes/mascota.routes.js";
import reservaRoutes from "./routes/reserva.routes.js";
import servicioRoutes from "./routes/servicio.routes.js";
import pagoRoutes from "./routes/pago.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const rutaPrincipal = path.join(__dirname, "..");
app.use(express.static(rutaPrincipal));

app.use("/api/users", userRoutes);
app.use("/api/mascotas", mascotaRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/pagos", pagoRoutes);

const PORT = process.env.PORT || 3000;

const esProduccion = process.env.NODE_ENV === "production";

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
        console.error("ERROR COMPLETO DE BASE DE DATOS:");
        console.error(error);
        process.exitCode = 1;
    }
};

iniciarServidor();