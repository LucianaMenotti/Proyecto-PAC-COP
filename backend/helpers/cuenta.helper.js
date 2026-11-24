import { Op } from "sequelize";

// Estados de verificación del prestador y de la cuenta de cualquier usuario.
export const ESTADOS_APROBACION = ["pendiente", "aprobado", "rechazado"];
export const ESTADOS_CUENTA = ["activa", "suspendida"];

export const estaSuspendido = (usuario) => usuario?.estadoCuenta === "suspendida";

// Las filas anteriores a la columna pueden tener estadoCuenta en null: cuentan como activas.
export const condicionCuentaActiva = () => ({
    [Op.or]: [
        { estadoCuenta: null },
        { estadoCuenta: { [Op.ne]: "suspendida" } }
    ]
});

// Prestador que puede aparecer en el buscador y recibir reservas.
export const condicionPrestadorVisible = (extra = {}) => ({
    [Op.and]: [
        { rol: "prestador" },
        condicionCuentaActiva(),
        extra
    ]
});

export const prestadorHabilitado = (usuario) =>
    usuario?.rol === "prestador" &&
    !estaSuspendido(usuario);

// Columna JSON que el driver puede devolver como texto
export const leerDocumentos = (valor) => {
    if (valor && typeof valor === "object") return valor;

    if (typeof valor === "string") {
        try {
            const resultado = JSON.parse(valor);
            return resultado && typeof resultado === "object" ? resultado : {};
        } catch {
            return {};
        }
    }

    return {};
};

// Indica qué documentos cargó el usuario sin exponer los nombres de archivo
export const resumenDocumentacion = (valor) => {
    const documentos = leerDocumentos(valor);

    return {
        documento: Boolean(documentos.documento),
        selfie: Boolean(documentos.selfie),
        cv: Boolean(documentos.cv)
    };
};
