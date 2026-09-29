import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },

    password: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    telefono: {
        type: DataTypes.STRING(30),
        allowNull: false
    },

    zona: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    rol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "dueño"
    },

    servicios: {
        type: DataTypes.JSON,
        allowNull: true
    },

    verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    calificacion: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    resenas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

export default User;