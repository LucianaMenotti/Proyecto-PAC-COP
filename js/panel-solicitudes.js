// =========================================
// PAC-COP - SOLICITUDES DEL PRESTADOR
// =========================================

export async function cargarSolicitudes() {
    try {
        const respuesta = await fetch(
            "/api/servicios",
            {
                credentials: "include",
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar las solicitudes"
            );
        }

        const resultado =
            await respuesta.json();

        const servicios =
            resultado.servicios || [];

        const solicitudes =
            servicios.filter(
                (servicio) =>
                    servicio.estado ===
                        "programado" &&
                    servicio.puedeGestionar === true
            );

        mostrarSolicitudes(
            solicitudes
        );
    } catch (error) {
        console.error(
            "Error al cargar solicitudes:",
            error
        );
    }
}

function mostrarSolicitudes(
    solicitudes
) {
    let contenedor =
        document.getElementById(
            "solicitudesPrestador"
        );

    if (!contenedor) {
        const main =
            document.querySelector("main");

        if (!main) return;

        contenedor =
            document.createElement("div");

        contenedor.id =
            "solicitudesPrestador";

        main.prepend(contenedor);
    }

    contenedor.innerHTML = `
        <div class="container mb-4">
            <div class="card border-0 shadow-sm">

                <button
                    type="button"
                    class="btn btn-light w-100 text-start border-0 p-4"
                    data-bs-toggle="collapse"
                    data-bs-target="#listaSolicitudes"
                    aria-expanded="false"
                    aria-controls="listaSolicitudes"
                >
                    <div class="d-flex justify-content-between align-items-center">

                        <div>
                            <h4 class="fw-bold mb-1">
                                Solicitudes (${solicitudes.length})
                            </h4>

                            <small class="text-secondary">
                                Reservas pendientes para aceptar o rechazar
                            </small>
                        </div>

                        <span class="fs-4">
                            ▾
                        </span>

                    </div>
                </button>

                <div id="listaSolicitudes" class="collapse">
                    <div class="card-body pt-0">

                        ${
                            solicitudes.length === 0
                                ? `
                                    <div class="text-center py-4 text-secondary">
                                        <p class="mb-0">
                                            No hay solicitudes pendientes.
                                        </p>
                                    </div>
                                `
                                : solicitudes
                                      .map(
                                          (servicio) => `
                                            <div
                                                class="border rounded p-3 mb-3"
                                                data-solicitud="${servicio.id}"
                                            >
                                                <div class="row g-3 align-items-center">

                                                    <div class="col-md-8">

                                                        <h5 class="fw-bold mb-2">
                                                            Nueva reserva
                                                        </h5>

                                                        <p class="mb-1">
                                                            <strong>${servicio.tipo}</strong>
                                                            para ${servicio.mascota}
                                                        </p>

                                                        <p class="mb-1 text-secondary">
                                                            ${servicio.prestador}
                                                        </p>

                                                        <p class="mb-1">
                                                            <strong>Precio:</strong>
                                                            $${servicio.monto}
                                                        </p>

                                                        <p class="mb-0 text-secondary">
                                                            ${formatearFecha(
                                                                servicio.horaProgramada
                                                            )}
                                                        </p>

                                                    </div>

                                                    <div class="col-md-4">
                                                        <div class="d-flex gap-2 justify-content-md-end">

                                                            <button
                                                                type="button"
                                                                class="btn btn-outline-danger"
                                                                data-rechazar="${servicio.id}"
                                                            >
                                                                Rechazar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                class="btn btn-success"
                                                                data-aceptar="${servicio.id}"
                                                            >
                                                                Aceptar
                                                            </button>

                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                          `
                                      )
                                      .join("")
                        }

                    </div>
                </div>

            </div>
        </div>
    `;

    contenedor
        .querySelectorAll(
            "[data-aceptar]"
        )
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                () => {
                    gestionarSolicitud(
                        boton.dataset.aceptar,
                        "aceptar"
                    );
                }
            );
        });

    contenedor
        .querySelectorAll(
            "[data-rechazar]"
        )
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                () => {
                    gestionarSolicitud(
                        boton.dataset.rechazar,
                        "rechazar"
                    );
                }
            );
        });
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Fecha no disponible";
    }

    return new Date(fecha).toLocaleString(
        "es-AR",
        {
            dateStyle: "short",
            timeStyle: "short",
        }
    );
}

async function gestionarSolicitud(
    id,
    accion
) {
    const accionTexto =
        accion === "aceptar"
            ? "aceptar"
            : "rechazar";

    const confirmar = confirm(
        `¿Seguro que querés ${accionTexto} esta reserva?`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `/api/servicios/${id}/${accion}`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                "No se pudo gestionar la reserva"
            );
        }

        alert(resultado.mensaje);

        await cargarSolicitudes();

        const evento =
            new CustomEvent(
                "servicioActualizado"
            );

        window.dispatchEvent(evento);
    } catch (error) {
        alert(error.message);
    }
}