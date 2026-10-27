import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Servicio from "./servicio.model.js";
import User from "./user.model.js";

const Pago = sequelize.define("Pago", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    servicioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    metodo: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    ultimosDigitos: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "pendiente"
    },
    transaccionId: {
        type: DataTypes.STRING(30),
        allowNull: true,
        unique: true
    },
    confirmadoEn: {
        type: DataTypes.DATE,
        allowNull: true
    },
    liberadoEn: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

Servicio.hasOne(Pago, { foreignKey: "servicioId", as: "pago" });
Pago.belongsTo(Servicio, { foreignKey: "servicioId" });
User.hasMany(Pago, { foreignKey: "ownerId", as: "pagos" });
Pago.belongsTo(User, { foreignKey: "ownerId", as: "dueno" });

export default Pago;
