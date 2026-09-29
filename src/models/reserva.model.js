import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Mascota from "./mascota.model.js";

const Reserva = sequelize.define("Reserva", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    mascotaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    prestadorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    servicio: {
        type: DataTypes.STRING(50),
        allowNull: false
    },

    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },

    estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "pendiente"
    }

});

User.hasMany(Reserva, {
    foreignKey: "userId"
});

Reserva.belongsTo(User, {
    foreignKey: "userId"
});

User.hasMany(Reserva, {
    foreignKey: "prestadorId",
    as: "reservasPrestador"
});

Reserva.belongsTo(User, {
    foreignKey: "prestadorId",
    as: "prestador"
});

Mascota.hasMany(Reserva, {
    foreignKey: "mascotaId"
});

Reserva.belongsTo(Mascota, {
    foreignKey: "mascotaId"
});

export default Reserva;