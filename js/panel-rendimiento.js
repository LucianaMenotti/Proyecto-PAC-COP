// =========================================
// PAC-COP - RENDIMIENTO DEL PRESTADOR
// =========================================

import {
    actualizarPrecioSegunNivel,
} from "./panel-servicios.js";

export async function cargarRendimiento(
    usuario,
    estado
) {
    let completados = 0;

    try {
        const respuesta = await fetch(
            "/api/servicios",
            {
                credentials: "include",
            }
        );

        const resultado =
            await respuesta.json();

        const servicios =
            resultado.servicios || [];

        completados =
            servicios.filter(
                (servicio) =>
                    servicio.estado ===
                    "finalizado"
            ).length;
    } catch {
        completados = 0;
    }

    estado.nivelActual =
        completados >= 50
            ? "top"
            : completados >= 10
                ? "establecido"
                : "nuevo";

    actualizarPrecioSegunNivel(estado);

    const barra =
        document.getElementById(
            "barraProgresoNivel"
        );

    if (barra) {
        barra.style.width =
            `${Math.min(
                100,
                Math.round(
                    (completados / 50) * 100
                )
            )}%`;
    }

    [
        "nuevo",
        "establecido",
        "top",
    ].forEach((nivel) => {
        document
            .getElementById(
                `col-nivel-${nivel}`
            )
            ?.classList.toggle(
                "nivel-actual",
                nivel === estado.nivelActual
            );
    });

    const resumen =
        document.getElementById(
            "textoResumenNivel"
        );

    if (resumen) {
        const faltan =
            Math.max(
                0,
                50 - completados
            );

        resumen.innerHTML =
            `Llevás <strong>${completados} servicios</strong> ` +
            `con <strong>${usuario.calificacion ?? 0}★</strong> de promedio.` +
            (
                faltan > 0
                    ? ` Te faltan <strong>${faltan} servicios</strong> para alcanzar Top.`
                    : " Ya estás en el nivel Top."
            );
    }
}