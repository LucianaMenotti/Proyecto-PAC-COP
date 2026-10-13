import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Servicio from "./servicio.model.js";
import User from "./user.model.js";

const Ubicacion = sequelize.define("Ubicacion", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    servicioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    latitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
    },
    longitud: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
    },
    registradoEn: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

Servicio.hasMany(Ubicacion, { foreignKey: "servicioId", as: "ubicaciones" });
Ubicacion.belongsTo(Servicio, { foreignKey: "servicioId" });
User.hasMany(Ubicacion, { foreignKey: "userId" });
Ubicacion.belongsTo(User, { foreignKey: "userId" });

export default Ubicacion;
