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

app.use(cors());
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

        await sequelize.sync({
            alter: true
        });

        console.log(
            "Tablas sincronizadas correctamente"
        );

    } catch (error) {

        console.warn(
            "Aviso base de datos:",
            error.message
        );

    }

    app.listen(PORT, () => {

        console.log(
            `Servidor Pac-Cop ejecutándose en http://localhost:${PORT}`
        );

    });
};

iniciarServidor();