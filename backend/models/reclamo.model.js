import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Servicio from "./servicio.model.js";

const Reclamo = sequelize.define("Reclamo", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reclamanteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reclamadoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  evidencias: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "pendiente",
  },
});

Servicio.hasMany(Reclamo, { foreignKey: "servicioId", as: "reclamos" });
Reclamo.belongsTo(Servicio, { foreignKey: "servicioId", as: "servicio" });
User.hasMany(Reclamo, { foreignKey: "reclamanteId", as: "reclamosEmitidos" });
Reclamo.belongsTo(User, { foreignKey: "reclamanteId", as: "reclamante" });
User.hasMany(Reclamo, { foreignKey: "reclamadoId", as: "reclamosRecibidos" });
Reclamo.belongsTo(User, { foreignKey: "reclamadoId", as: "reclamado" });

export default Reclamo;
