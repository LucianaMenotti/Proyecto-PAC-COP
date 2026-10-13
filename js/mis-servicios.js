const usuario = await window.PacCopAuth.requireSession(["dueño"]);

if (!usuario) {
    throw new Error("No se pudo obtener la sesión del dueño");
}

const mensajeCarga = document.getElementById("mensajeCarga");
const mensajeVacio = document.getElementById("mensajeVacio");
const mensajeError = document.getElementById("mensajeError");
const listaServicios = document.getElementById("listaServicios");

const obtenerEstado = (estado) => {
    switch (estado) {
        case "programado":
            return {
                texto: "Programado",
                clase: "bg-warning text-dark"
            };

        case "aceptado":
            return {
                texto: "Aceptado",
                clase: "bg-success"
            };

        case "en-curso":
            return {
                texto: "En curso",
                clase: "bg-primary"
            };

        case "finalizado":
            return {
                texto: "Finalizado",
                clase: "bg-secondary"
            };

        case "rechazado":
            return {
                texto: "Rechazado",
                clase: "bg-danger"
            };

        default:
            return {
                texto: estado || "Sin estado",
                clase: "bg-secondary"
            };
    }
};

const formatearFecha = (fecha) => {
    if (!fecha) {
        return "Sin fecha programada";
    }

    return new Date(fecha).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short"
    });
};

const cargarServicios = async () => {
    try {
        const response = await fetch("/api/servicios", {
            credentials: "include"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || "No se pudieron cargar los servicios");
        }

        const servicios = data.servicios || [];

        mensajeCarga.classList.add("d-none");

        if (servicios.length === 0) {
            mensajeVacio.classList.remove("d-none");
            return;
        }

        listaServicios.innerHTML = "";

        servicios.forEach((servicio) => {
            const estado = obtenerEstado(servicio.estado);

            const puedeAbrirChat =
                servicio.estado === "aceptado" ||
                servicio.estado === "en-curso";

            const tarjeta = document.createElement("div");

            tarjeta.className = "col-md-6 col-lg-4";

            tarjeta.innerHTML = `
                <div class="card h-100 shadow-sm border-0 rounded-4">
                    <div class="card-body p-4">

                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h2 class="h5 fw-bold mb-0">
                                ${servicio.tipo || "Servicio"}
                            </h2>

                            <span class="badge ${estado.clase}">
                                ${estado.texto}
                            </span>
                        </div>

                        <p class="mb-2">
                            <strong>Mascota:</strong>
                            ${servicio.mascota || "No especificada"}
                        </p>

                        <p class="mb-2">
                            <strong>Prestador:</strong>
                            ${servicio.prestador || "No especificado"}
                        </p>

                        <p class="mb-2">
                            <strong>Fecha:</strong>
                            ${formatearFecha(servicio.horaProgramada)}
                        </p>

                        <p class="mb-4">
                            <strong>Monto:</strong>
                            $${Number(servicio.monto || 0).toLocaleString("es-AR")}
                        </p>

                        ${
                            puedeAbrirChat
                                ? `
                                    <a
                                        href="../prestadordeServicio/chatApp.html?servicioId=${servicio.id}"
                                        class="btn btn-primary w-100"
                                    >
                                        Abrir chat
                                    </a>
                                `
                                : `
                                    <button
                                        class="btn btn-outline-secondary w-100"
                                        disabled
                                    >
                                        Chat no disponible
                                    </button>
                                `
                        }

                    </div>
                </div>
            `;

            listaServicios.appendChild(tarjeta);
        });
    } catch (error) {
        console.error("Error al cargar mis servicios:", error);

        mensajeCarga.classList.add("d-none");
        mensajeError.textContent =
            error.message || "No se pudieron cargar tus servicios.";

        mensajeError.classList.remove("d-none");
    }
};

cargarServicios();