import { escapar, formatearFechaHora } from "./reclamos-comun.js";

const usuario = await window.PacCopAuth.requireSession();

if (!usuario) {
  throw new Error("No se pudo obtener la sesión del usuario");
}

const esAdministrador = ["admin", "administrador"].includes(usuario.rol);
const destinoReclamos = esAdministrador
  ? "admin-reclamos.html"
  : "mis-servicios.html";
const INTERVALO_ACTUALIZACION = 15000;

const mensajeCarga = document.getElementById("mensajeCarga");
const mensajeVacio = document.getElementById("mensajeVacio");
const mensajeError = document.getElementById("mensajeError");
const listaNotificaciones = document.getElementById("listaNotificaciones");
const btnLeerTodas = document.getElementById("btnLeerTodas");

const renderizar = (notificaciones) => {
  listaNotificaciones.innerHTML = "";
  mensajeVacio.classList.toggle("d-none", notificaciones.length > 0);
  btnLeerTodas.classList.toggle(
    "d-none",
    !notificaciones.some((notificacion) => !notificacion.leida),
  );

  notificaciones.forEach((notificacion) => {
    const tarjeta = document.createElement("div");

    tarjeta.className = `card shadow-sm rounded-4 mb-3 ${
      notificacion.leida ? "border-0" : "border border-primary"
    }`;

    tarjeta.innerHTML = `
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <h2 class="h6 fw-bold mb-0">${escapar(notificacion.titulo)}</h2>
                    ${
                      notificacion.leida
                        ? ""
                        : '<span class="badge bg-primary">Nueva</span>'
                    }
                </div>

                <p class="mb-2">${escapar(notificacion.mensaje)}</p>

                <small class="text-secondary d-block mb-3">
                    ${formatearFechaHora(notificacion.creadoEn)}
                </small>

                <div class="d-flex flex-wrap gap-2">
                    ${
                      notificacion.reclamoId
                        ? `<a href="${destinoReclamos}" class="btn btn-primary btn-sm">Ver reclamos</a>`
                        : ""
                    }
                    ${
                      notificacion.leida
                        ? ""
                        : `<button type="button" class="btn btn-outline-secondary btn-sm" data-leer="${notificacion.id}">Marcar como leída</button>`
                    }
                </div>
            </div>
        `;

    listaNotificaciones.appendChild(tarjeta);
  });
};

const cargarNotificaciones = async () => {
  try {
    const respuesta = await fetch("/api/notificaciones", {
      credentials: "include",
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || "No se pudieron cargar las notificaciones",
      );
    }

    mensajeCarga.classList.add("d-none");
    mensajeError.classList.add("d-none");

    renderizar(datos.notificaciones || []);
  } catch (error) {
    console.error("Error al cargar notificaciones:", error);

    mensajeCarga.classList.add("d-none");
    mensajeError.textContent = error.message;
    mensajeError.classList.remove("d-none");
  }
};

listaNotificaciones.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-leer]");

  if (!boton) {
    return;
  }

  await fetch(`/api/notificaciones/${boton.dataset.leer}/leer`, {
    method: "POST",
    credentials: "include",
  });

  await cargarNotificaciones();
});

btnLeerTodas.addEventListener("click", async () => {
  await fetch("/api/notificaciones/leer-todas", {
    method: "POST",
    credentials: "include",
  });

  await cargarNotificaciones();
});

await cargarNotificaciones();

setInterval(cargarNotificaciones, INTERVALO_ACTUALIZACION);
