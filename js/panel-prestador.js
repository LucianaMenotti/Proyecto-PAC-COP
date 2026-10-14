import { inicializarServicios } from "./panel-servicios.js";

import { cargarRendimiento } from "./panel-rendimiento.js";

import { cargarSolicitudes } from "./panel-solicitudes.js";

import { cargarServiciosActivos } from "./panel-activos.js";

import { cargarContadorNotificaciones } from "./notificaciones-badge.js";

const usuario = await window.PacCopAuth.requireSession(["prestador"]);

if (!usuario) {
  throw new Error("No se pudo obtener la sesión del prestador");
}

const estado = {
  nivelActual: "nuevo",
  misServicios: [],
  misPrecios: {},
};

function escribir(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

const zonaAcciones = document.querySelector(".navbar .d-flex");

if (zonaAcciones) {
  zonaAcciones.insertAdjacentHTML(
    "afterbegin",
    `
            <a href="mis-servicios.html" class="btn btn-outline-primary btn-sm">
                Mis servicios
            </a>
            <a href="notificaciones.html" class="btn btn-outline-primary btn-sm">
                Notificaciones
                <span
                    class="badge bg-danger rounded-pill d-none"
                    data-contador-notificaciones
                >0</span>
            </a>
        `,
  );
}

const avatar = document.getElementById("avatarUsuario");

if (avatar) {
  avatar.textContent = (usuario.nombre || "P").charAt(0).toUpperCase();

  avatar.style.cursor = "pointer";

  avatar.addEventListener("click", () => {
    window.location.href = "perfil-prestador.html";
  });
}

escribir("nombrePrestador", `${usuario.nombre} ${usuario.apellido}`);

escribir("zonaPrestador", usuario.zona || "Zona no especificada");

escribir("calificacionPrestador", usuario.calificacion || "0");

escribir("resenasPrestador", usuario.resenas || "0");

inicializarServicios(usuario, estado);

await cargarRendimiento(usuario, estado);

await cargarSolicitudes();

await cargarServiciosActivos();

await cargarContadorNotificaciones();

setInterval(cargarContadorNotificaciones, 15000);

window.addEventListener("servicioActualizado", async () => {
  await cargarServiciosActivos();
});
