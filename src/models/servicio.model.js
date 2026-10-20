import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Mascota from "./mascota.model.js";

const Servicio = sequelize.define("Servicio", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    providerId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    mascotaId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    prestadorNombre: {
        type: DataTypes.STRING(120),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    mascotaNombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "programado"
    },
    horaProgramada: {
        type: DataTypes.DATE,
        allowNull: false
    },
    iniciadoEn: {
        type: DataTypes.DATE,
        allowNull: true
    },
    finalizadoEn: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

User.hasMany(Servicio, { foreignKey: "ownerId", as: "serviciosComoDueno" });
Servicio.belongsTo(User, { foreignKey: "ownerId", as: "dueno" });
User.hasMany(Servicio, { foreignKey: "providerId", as: "serviciosComoPrestador" });
Servicio.belongsTo(User, { foreignKey: "providerId", as: "prestador" });
Mascota.hasMany(Servicio, { foreignKey: "mascotaId" });
Servicio.belongsTo(Mascota, { foreignKey: "mascotaId" });

export default Servicio;
