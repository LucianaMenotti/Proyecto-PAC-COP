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

    dni: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },

    fechaNacimiento: {
        type: DataTypes.DATEONLY,
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
        allowNull: true
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

    vehiculo: {
        type: DataTypes.STRING(30),
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