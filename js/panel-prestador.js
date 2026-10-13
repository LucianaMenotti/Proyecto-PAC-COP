// =========================================
// PAC-COP - PANEL DEL PRESTADOR
// =========================================

import {
    inicializarServicios,
} from "./panel-servicios.js";

import {
    cargarRendimiento,
} from "./panel-rendimiento.js";

import {
    cargarSolicitudes,
} from "./panel-solicitudes.js";

import {
    cargarServiciosActivos,
} from "./panel-activos.js";

// -----------------------------------------
// SESIÓN
// -----------------------------------------

const usuario =
    await window.PacCopAuth.requireSession([
        "prestador",
    ]);

if (!usuario) {
    throw new Error(
        "No se pudo obtener la sesión del prestador"
    );
}

// -----------------------------------------
// ESTADO COMPARTIDO
// -----------------------------------------

const estado = {
    nivelActual: "nuevo",
    misServicios: [],
    misPrecios: {},
};

// -----------------------------------------
// PERFIL
// -----------------------------------------

function escribir(id, texto) {
    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

const avatar =
    document.getElementById(
        "avatarUsuario"
    );

if (avatar) {
    avatar.textContent =
        (
            usuario.nombre ||
            "P"
        )
            .charAt(0)
            .toUpperCase();

    avatar.style.cursor =
        "pointer";

    avatar.addEventListener(
        "click",
        () => {
            window.location.href =
                "perfil-prestador.html";
        }
    );
}

escribir(
    "nombrePrestador",
    `${usuario.nombre} ${usuario.apellido}`
);

escribir(
    "zonaPrestador",
    usuario.zona ||
        "Zona no especificada"
);

escribir(
    "calificacionPrestador",
    usuario.calificacion || "0"
);

escribir(
    "resenasPrestador",
    usuario.resenas || "0"
);

// -----------------------------------------
// INICIALIZAR MÓDULOS
// -----------------------------------------

inicializarServicios(
    usuario,
    estado
);

await cargarRendimiento(
    usuario,
    estado
);

await cargarSolicitudes();

await cargarServiciosActivos();

// -----------------------------------------
// ACTUALIZAR SERVICIOS ACTIVOS
// -----------------------------------------

window.addEventListener(
    "servicioActualizado",
    async () => {
        await cargarServiciosActivos();
    }
);