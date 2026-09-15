import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

const Mascota = sequelize.define("Mascota", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    especie: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    raza: {
        type: DataTypes.STRING(100),
        allowNull: true
    },

    edad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

User.hasMany(Mascota, {
    foreignKey: "userId"
});

Mascota.belongsTo(User, {
    foreignKey: "userId"
});

export default Mascota;