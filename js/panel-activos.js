// =========================================
// PAC-COP - SERVICIOS ACTIVOS
// =========================================

export async function cargarServiciosActivos() {
    try {
        const respuesta = await fetch(
            "/api/servicios",
            {
                credentials: "include",
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron cargar los servicios activos"
            );
        }

        const resultado =
            await respuesta.json();

        const servicios =
            resultado.servicios || [];

        const activos =
            servicios.filter(
                (servicio) =>
                    servicio.estado ===
                        "aceptado" ||
                    servicio.estado ===
                        "en-curso"
            );

        mostrarServiciosActivos(
            activos
        );
    } catch (error) {
        console.error(
            "Error al cargar servicios activos:",
            error
        );
    }
}

function mostrarServiciosActivos(
    servicios
) {
    let contenedor =
        document.getElementById(
            "serviciosActivosPrestador"
        );

    if (!contenedor) {
        const solicitudes =
            document.getElementById(
                "solicitudesPrestador"
            );

        if (!solicitudes) return;

        contenedor =
            document.createElement("div");

        contenedor.id =
            "serviciosActivosPrestador";

        solicitudes.after(
            contenedor
        );
    }

    contenedor.innerHTML = `
        <div class="container mb-4">
            <div class="card border-0 shadow-sm">

                <div class="card-body p-4">

                    <div class="mb-3">
                        <h4 class="fw-bold mb-1">
                            Mis servicios activos
                        </h4>

                        <small class="text-secondary">
                            Reservas aceptadas y servicios en curso
                        </small>
                    </div>

                    ${
                        servicios.length === 0
                            ? `
                                <div class="text-center py-3 text-secondary">
                                    No tenés servicios activos en este momento.
                                </div>
                            `
                            : servicios
                                  .map(
                                      (servicio) => `
                                        <div class="border rounded p-3 mb-3">

                                            <div class="row g-3 align-items-center">

                                                <div class="col-md-8">

                                                    <h5 class="fw-bold mb-2">
                                                        ${servicio.tipo}
                                                    </h5>

                                                    <p class="mb-1">
                                                        <strong>Mascota:</strong>
                                                        ${
                                                            servicio.mascota ||
                                                            servicio.mascotaNombre ||
                                                            "Sin nombre"
                                                        }
                                                    </p>

                                                    <p class="mb-1">
                                                        <strong>Estado:</strong>
                                                        ${
                                                            servicio.estado ===
                                                            "en-curso"
                                                                ? "En curso"
                                                                : "Aceptado"
                                                        }
                                                    </p>

                                                    <p class="mb-0 text-secondary">
                                                        ${formatearFecha(
                                                            servicio.horaProgramada
                                                        )}
                                                    </p>

                                                </div>

                                                <div class="col-md-4 text-md-end">

                                                    <button
                                                        type="button"
                                                        class="btn btn-primary"
                                                        data-abrir-chat="${servicio.id}"
                                                    >
                                                        Abrir chat
                                                    </button>

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
    `;

    contenedor
        .querySelectorAll(
            "[data-abrir-chat]"
        )
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                () => {
                    const servicioId =
                        boton.dataset.abrirChat;

                    window.location.href =
                        `../prestadordeServicio/chatApp.html?servicioId=${servicioId}`;
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