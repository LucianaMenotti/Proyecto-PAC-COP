import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

const Notificacion = sequelize.define("Notificacion", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    tipo: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    titulo: {
        type: DataTypes.STRING(150),
        allowNull: false
    },

    mensaje: {
        type: DataTypes.STRING(500),
        allowNull: true
    },

    servicioId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    leida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    creadoEn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

User.hasMany(Notificacion, {
    foreignKey: "usuarioId",
    as: "notificaciones"
});

Notificacion.belongsTo(User, {
    foreignKey: "usuarioId"
});

export default Notificacion;
