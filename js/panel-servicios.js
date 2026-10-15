// =========================================
// PAC-COP - SERVICIOS DEL PRESTADOR
// =========================================

const NOMBRE_SERVICIO = {
    paseo: "Paseo",
    guarderia: "Guarderia",
    traslado: "Traslado",
};

const PRECIOS = {
    Paseo: {
        nombre: "Paseo",
        nuevo: 4000,
        establecido: 5000,
        top: 7000,
    },

    Guarderia: {
        nombre: "Guardería",
        nuevo: 7000,
        establecido: 9000,
        top: 12000,
    },

    Traslado: {
        nombre: "Traslado",
        nuevo: 5000,
        establecido: 7000,
        top: 10000,
    },
};

function leerLista(valor) {
    if (Array.isArray(valor)) {
        return valor;
    }

    if (typeof valor === "string") {
        try {
            const resultado = JSON.parse(valor);
            return Array.isArray(resultado) ? resultado : [];
        } catch {
            return [];
        }
    }

    return [];
}

function leerPrecios(valor) {
    if (
        valor &&
        typeof valor === "object" &&
        !Array.isArray(valor)
    ) {
        return valor;
    }

    if (typeof valor === "string") {
        try {
            const resultado = JSON.parse(valor);

            return resultado &&
                typeof resultado === "object"
                ? resultado
                : {};
        } catch {
            return {};
        }
    }

    return {};
}

function obtenerPrecioMinimo(
    servicioSelect,
    nivelActual
) {
    const servicio =
        NOMBRE_SERVICIO[servicioSelect?.value];

    return PRECIOS[servicio]?.[nivelActual] ?? 0;
}

function renderizarServicios(
    misServicios,
    misPrecios
) {
    const contenedor =
        document.getElementById("serviciosPrestador");

    if (!contenedor) return;

    if (misServicios.length === 0) {
        contenedor.innerHTML = `
            <span class="text-secondary small">
                Todavía no publicaste servicios.
            </span>
        `;

        return;
    }

    contenedor.innerHTML = misServicios
        .map(
            (servicio) => `
                <span class="badge bg-light text-dark border me-1 mb-1">
                    ${servicio} · ${
                        misPrecios[servicio]
                            ? "$" + misPrecios[servicio]
                            : "sin precio"
                    }
                </span>
            `
        )
        .join("");
}

async function guardarServicios(
    estado,
    servicioSelect,
    precioInput,
    precioError
) {
    const respuesta = await fetch(
        "/api/users/me/servicios",
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                servicios: estado.misServicios,
                preciosServicios: estado.misPrecios,
            }),
        }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            resultado.mensaje || "No se pudo guardar"
        );
    }

    estado.misServicios =
        leerLista(resultado.usuario.servicios);

    estado.misPrecios =
        leerPrecios(
            resultado.usuario.preciosServicios
        );

    renderizarServicios(
        estado.misServicios,
        estado.misPrecios
    );
}

export function inicializarServicios(
    usuario,
    estado
) {
    estado.misServicios =
        leerLista(usuario.servicios);

    estado.misPrecios =
        leerPrecios(usuario.preciosServicios);

    const formulario =
        document.getElementById("publishForm");

    const servicioSelect =
        document.getElementById("servicioSelect");

    const precioInput =
        document.getElementById("precioInput");

    const precioError =
        document.getElementById("precioError");

    const useSuggested =
        document.getElementById("useSuggested");

    renderizarServicios(
        estado.misServicios,
        estado.misPrecios
    );

    const tabla =
        document.getElementById("tablaPrecios");

    if (tabla) {
        tabla.innerHTML = Object.values(PRECIOS)
            .map(
                (servicio) => `
                    <tr>
                        <td class="fw-semibold">
                            ${servicio.nombre}
                        </td>

                        <td>
                            $${servicio.nuevo}
                        </td>

                        <td class="fw-bold text-success">
                            $${servicio.establecido}
                        </td>

                        <td>
                            $${servicio.top}
                        </td>
                    </tr>
                `
            )
            .join("");
    }

    if (servicioSelect && precioInput) {
        precioInput.placeholder =
            obtenerPrecioMinimo(
                servicioSelect,
                estado.nivelActual
            );

        servicioSelect.addEventListener(
            "change",
            () => {
                precioInput.placeholder =
                    obtenerPrecioMinimo(
                        servicioSelect,
                        estado.nivelActual
                    );

                precioError?.classList.add(
                    "d-none"
                );
            }
        );
    }

    if (useSuggested) {
        useSuggested.addEventListener(
            "click",
            () => {
                precioInput.value =
                    obtenerPrecioMinimo(
                        servicioSelect,
                        estado.nivelActual
                    );

                precioError?.classList.add(
                    "d-none"
                );
            }
        );
    }

    if (formulario) {
        formulario.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const servicio =
                    NOMBRE_SERVICIO[
                        servicioSelect.value
                    ];

                const precio =
                    Number(precioInput.value);

                const precioMinimo =
                    obtenerPrecioMinimo(
                        servicioSelect,
                        estado.nivelActual
                    );

                if (
                    !precio ||
                    precio < precioMinimo
                ) {
                    precioError?.classList.remove(
                        "d-none"
                    );

                    return;
                }

                precioError?.classList.add(
                    "d-none"
                );

                if (
                    !estado.misServicios.includes(
                        servicio
                    )
                ) {
                    estado.misServicios.push(
                        servicio
                    );
                }

                estado.misPrecios[servicio] =
                    precio;

                try {
                    await guardarServicios(
                        estado,
                        servicioSelect,
                        precioInput,
                        precioError
                    );

                    formulario.reset();

                    precioInput.placeholder =
                        obtenerPrecioMinimo(
                            servicioSelect,
                            estado.nivelActual
                        );

                    alert(
                        "Servicio publicado correctamente."
                    );
                } catch (error) {
                    alert(error.message);
                }
            }
        );
    }
}

export function actualizarPrecioSegunNivel(
    estado
) {
    const servicioSelect =
        document.getElementById(
            "servicioSelect"
        );

    const precioInput =
        document.getElementById(
            "precioInput"
        );

    if (
        servicioSelect &&
        precioInput
    ) {
        precioInput.placeholder =
            obtenerPrecioMinimo(
                servicioSelect,
                estado.nivelActual
            );
    }
}