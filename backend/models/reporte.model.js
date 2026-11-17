import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./user.model.js";
import Calificacion from "./calificacion.model.js";

// Reporte de un usuario o de una reseña hecho por otro usuario.
// Lo revisa la administración desde la sección de moderación.
const Reporte = sequelize.define("Reporte", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  reportanteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Usuario señalado (en una reseña, su autor)
  reportadoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  calificacionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  motivo: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  detalle: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "pendiente",
  },
  resolucion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resueltoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  resueltoEn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

User.hasMany(Reporte, { foreignKey: "reportanteId", as: "reportesEmitidos" });
Reporte.belongsTo(User, { foreignKey: "reportanteId", as: "reportante" });
User.hasMany(Reporte, { foreignKey: "reportadoId", as: "reportesRecibidos" });
Reporte.belongsTo(User, { foreignKey: "reportadoId", as: "reportado" });
// Sin restricción de clave foránea: el reporte se conserva aunque se elimine la reseña
Calificacion.hasMany(Reporte, { foreignKey: "calificacionId", as: "reportes", constraints: false });
Reporte.belongsTo(Calificacion, { foreignKey: "calificacionId", as: "calificacion", constraints: false });

export default Reporte;
