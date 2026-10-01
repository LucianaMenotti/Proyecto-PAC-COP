import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Servicio from "./servicio.model.js";
import User from "./user.model.js";

const Calificacion = sequelize.define(
  "Calificacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    servicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    providerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    puntuacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["servicioId", "ownerId"],
      },
    ],
  },
);

Servicio.hasOne(Calificacion, {
  foreignKey: "servicioId",
  as: "calificacion",
});

Calificacion.belongsTo(Servicio, {
  foreignKey: "servicioId",
});

User.hasMany(Calificacion, {
  foreignKey: "ownerId",
  as: "calificacionesComoDueno",
});

Calificacion.belongsTo(User, {
  foreignKey: "ownerId",
  as: "dueno",
});

User.hasMany(Calificacion, {
  foreignKey: "providerId",
  as: "calificacionesComoPrestador",
});

Calificacion.belongsTo(User, {
  foreignKey: "providerId",
  as: "prestador",
});

export default Calificacion;
