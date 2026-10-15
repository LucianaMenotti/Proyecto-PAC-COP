import { cargarContadorNotificaciones } from "./notificaciones-badge.js";
import {
  escapar,
  formatearFechaHora,
  obtenerEstadoReclamo,
} from "./reclamos-comun.js";

const usuario = await window.PacCopAuth.requireSession([
  "admin",
  "administrador",
]);

if (!usuario) {
  throw new Error("No se pudo obtener la sesión del administrador");
}

const INTERVALO_ACTUALIZACION = 20000;

const mensajeCarga = document.getElementById("mensajeCarga");
const mensajeVacio = document.getElementById("mensajeVacio");
const mensajeError = document.getElementById("mensajeError");
const listaReclamos = document.getElementById("listaReclamos");
const filtroEstado = document.getElementById("filtroEstado");
const btnActualizar = document.getElementById("btnActualizar");

let reclamos = [];

const crearAcciones = (reclamo) => {
  if (reclamo.estado === "pendiente") {
    return `
            <button type="button" class="btn btn-primary btn-sm" data-estado="en-revision" data-id="${reclamo.id}">
                Marcar en revisión
            </button>
            <button type="button" class="btn btn-outline-success btn-sm" data-estado="finalizado" data-id="${reclamo.id}">
                Finalizar
            </button>
        `;
  }

  if (reclamo.estado === "en-revision") {
    return `
            <button type="button" class="btn btn-success btn-sm" data-estado="finalizado" data-id="${reclamo.id}">
                Marcar finalizado
            </button>
        `;
  }

  return '<span class="text-secondary small">Reclamo cerrado.</span>';
};

const crearEvidencias = (evidencias) => {
  if (evidencias.length === 0) {
    return '<p class="text-secondary small mb-0">Sin evidencias adjuntas.</p>';
  }

  return `
        <div class="d-flex flex-wrap gap-2">
            ${evidencias
              .map(
                (ruta) => `
                        <a href="${ruta}" target="_blank" rel="noopener">
                            <img
                                src="${ruta}"
                                alt="Evidencia del reclamo"
                                class="rounded border"
                                style="width: 96px; height: 96px; object-fit: cover"
                            />
                        </a>
                    `,
              )
              .join("")}
        </div>
    `;
};

const renderizar = () => {
  const filtro = filtroEstado.value;

  const visibles = reclamos.filter(
    (reclamo) => filtro === "" || reclamo.estado === filtro,
  );

  listaReclamos.innerHTML = "";
  mensajeVacio.classList.toggle("d-none", visibles.length > 0);

  visibles.forEach((reclamo) => {
    const estado = obtenerEstadoReclamo(reclamo.estado);
    const servicio = reclamo.servicio;

    const tarjeta = document.createElement("div");

    tarjeta.className = "col-12 col-lg-6";

    tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0 rounded-4">
                <div class="card-body p-4">

                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h2 class="h5 fw-bold mb-0">Reclamo #${reclamo.id}</h2>
                        <span class="badge ${estado.clase}">${estado.texto}</span>
                    </div>

                    <p class="text-secondary small mb-3">
                        Servicio #${reclamo.servicioId}
                        ${
                          servicio
                            ? `- ${escapar(servicio.tipo)} - ${escapar(servicio.mascota)}`
                            : ""
                        }
                    </p>

                    <p class="mb-1">
                        <strong>Reclamante:</strong>
                        ${escapar(reclamo.reclamante?.nombre)} (${escapar(reclamo.reclamante?.rol)})
                    </p>

                    <p class="mb-1">
                        <strong>Reclamado:</strong>
                        ${escapar(reclamo.reclamado?.nombre)} (${escapar(reclamo.reclamado?.rol)})
                    </p>

                    <p class="mb-3">
                        <strong>Fecha:</strong>
                        ${formatearFechaHora(reclamo.creadoEn)}
                    </p>

                    <p class="fw-semibold mb-1">Descripción</p>
                    <p class="mb-3" style="white-space: pre-wrap">${escapar(reclamo.descripcion)}</p>

                    <p class="fw-semibold mb-1">Evidencias</p>
                    <div class="mb-4">${crearEvidencias(reclamo.evidencias)}</div>

                    <div class="d-flex flex-wrap gap-2">
                        ${crearAcciones(reclamo)}
                    </div>

                </div>
            </div>
        `;

    listaReclamos.appendChild(tarjeta);
  });
};

const cargarReclamos = async () => {
  try {
    const respuesta = await fetch("/api/reclamos", {
      credentials: "include",
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "No se pudieron cargar los reclamos");
    }

    reclamos = datos.reclamos || [];

    mensajeCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");

    renderizar();
  } catch (error) {
    console.error("Error al cargar reclamos:", error);

    mensajeCarga.classList.add("d-none");
    mensajeError.textContent = error.message;
    mensajeError.classList.remove("d-none");
  }
};

listaReclamos.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-estado]");

  if (!boton) {
    return;
  }

  const estado = boton.dataset.estado;
  const textoEstado = obtenerEstadoReclamo(estado).texto;

  if (
    !confirm(`¿Cambiar el reclamo #${boton.dataset.id} a "${textoEstado}"?`)
  ) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/reclamos/${boton.dataset.id}/estado`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo actualizar el reclamo");
    }

    await cargarReclamos();
  } catch (error) {
    alert(error.message);
  }
});

filtroEstado.addEventListener("change", renderizar);
btnActualizar.addEventListener("click", cargarReclamos);

await cargarReclamos();
await cargarContadorNotificaciones();

setInterval(async () => {
  await cargarReclamos();
  await cargarContadorNotificaciones();
}, INTERVALO_ACTUALIZACION);
