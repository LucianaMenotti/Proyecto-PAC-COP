import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Servicio from "./servicio.model.js";

const Mensaje = sequelize.define("Mensaje", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    servicioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    remitenteId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    texto: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
    },

    imagenArchivo: {
        type: DataTypes.STRING(120),
        allowNull: true
    },

    latitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
    },

    longitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
    },

    creadoEn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

Servicio.hasMany(Mensaje, {
    foreignKey: "servicioId",
    as: "mensajes"
});

Mensaje.belongsTo(Servicio, {
    foreignKey: "servicioId"
});

User.hasMany(Mensaje, {
    foreignKey: "remitenteId",
    as: "mensajesEnviados"
});

Mensaje.belongsTo(User, {
    foreignKey: "remitenteId",
    as: "remitente"
});

export default Mensaje;
