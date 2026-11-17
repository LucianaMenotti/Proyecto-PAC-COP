import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

// Registro de cada decisión tomada desde el panel de administración
// (aprobaciones, suspensiones, cancelaciones, moderación y reclamos).
const AccionAdmin = sequelize.define(
  "AccionAdmin",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accion: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    entidad: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    entidadId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    detalle: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "AccionesAdmin",
  },
);

User.hasMany(AccionAdmin, { foreignKey: "adminId", as: "accionesAdmin" });
AccionAdmin.belongsTo(User, { foreignKey: "adminId", as: "admin" });

export default AccionAdmin;
