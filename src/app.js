import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import "dotenv/config";

import sequelize from "./config/database.js";

import User from "./models/user.model.js";
import Mascota from "./models/mascota.model.js";

import userRoutes from "./routes/user.routes.js";
import mascotaRoutes from "./routes/mascota.routes.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaPrincipal = path.join(__dirname, "..");

app.use(express.static(rutaPrincipal));

app.use("/api/users", userRoutes);
app.use("/api/mascotas", mascotaRoutes);

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {

    try {

        await sequelize.authenticate();

        console.log(
            "Conexión con MySQL establecida correctamente"
        );

        const esProduccion = process.env.NODE_ENV === "production";
        const actualizarEstructura =
            !esProduccion && process.env.DB_SYNC_ALTER !== "false";

        await sequelize.sync(actualizarEstructura ? { alter: true } : {});

        console.log(
            actualizarEstructura
                ? "Tablas creadas o actualizadas correctamente"
                : "Tablas sincronizadas correctamente"
        );

        app.listen(PORT, () => {
            console.log(
                `Servidor Pac-Cop ejecutándose en http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("No se pudo iniciar la aplicación:", error.message);
        process.exitCode = 1;
    }
};

iniciarServidor();
