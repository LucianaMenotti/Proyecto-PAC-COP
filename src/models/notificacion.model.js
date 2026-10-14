import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";

const Notificacion = sequelize.define(
  "Notificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reclamoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    servicioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    leida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "Notificaciones",
  },
);

User.hasMany(Notificacion, { foreignKey: "userId", as: "notificaciones" });
Notificacion.belongsTo(User, { foreignKey: "userId", as: "destinatario" });

export default Notificacion;
