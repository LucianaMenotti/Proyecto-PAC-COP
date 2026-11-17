import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define("User", {

    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },

    dni: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },

    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },

    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

    telefono: {
        type: DataTypes.STRING(30),
        allowNull: false
    },

    zona: {
        type: DataTypes.STRING(100),
        allowNull: true
    },

    rol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "dueño"
    },

    servicios: {
        type: DataTypes.JSON,
        allowNull: true
    },

    preciosServicios: {
        type: DataTypes.JSON,
        allowNull: true
    },

    vehiculo: {
        type: DataTypes.STRING(30),
        allowNull: true
    },

    verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    calificacion: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    resenas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    disponibilidad: {
        type: DataTypes.JSON,
        allowNull: true
    },

    tamanosAceptados: {
        type: DataTypes.JSON,
        allowNull: true
    },

    restricciones: {
        type: DataTypes.JSON,
        allowNull: true
    },

    cuentaCobro: {
        type: DataTypes.JSON,
        allowNull: true
    },

    resetTokenHash: {
        type: DataTypes.STRING(64),
        allowNull: true
    },

    resetExpira: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Verificación del prestador: pendiente, aprobado o rechazado (null para otros roles)
    estadoAprobacion: {
        type: DataTypes.STRING(20),
        allowNull: true
    },

    motivoRechazo: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    aprobacionRevisadaEn: {
        type: DataTypes.DATE,
        allowNull: true
    },

    // Nombres de archivo en uploads/documentos: { documento, selfie, cv }
    documentos: {
        type: DataTypes.JSON,
        allowNull: true
    },

    experiencia: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Cuenta activa o suspendida por la administración. Admite null para no fallar
    // al migrar tablas con datos; app.js completa las filas anteriores con "activa".
    estadoCuenta: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: "activa"
    },

    motivoSuspension: {
        type: DataTypes.STRING(255),
        allowNull: true
    },

    suspendidoEn: {
        type: DataTypes.DATE,
        allowNull: true
    }

});

export default User;
