import { cargarContadorNotificaciones } from "./notificaciones-badge.js";

const usuario = await window.PacCopAuth.requireSession();

const agregarTarjeta = ({
  href,
  icono,
  color,
  encabezado,
  texto,
  contador = false,
}) => {
  const acciones = document.getElementById("acciones");

  if (!acciones) {
    return;
  }

  const columna = document.createElement("div");

  columna.className = "col-md-6 col-lg-3";

  columna.innerHTML = `
        <a href="${href}" class="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark">
            <i class="bi ${icono} ${color} fs-1 mb-3"></i>
            <h3 class="h5 fw-bold">
                ${encabezado}
                ${
                  contador
                    ? '<span class="badge bg-danger rounded-pill d-none" data-contador-notificaciones>0</span>'
                    : ""
                }
            </h3>
            <p class="text-secondary small mb-0">${texto}</p>
        </a>
    `;

  acciones.appendChild(columna);
};

if (usuario) {
  const titulo = document.getElementById("titulo");
  const mensaje = document.getElementById("mensaje");
  const rolCuenta = document.getElementById("rolCuenta");
  const cerrarSesion = document.getElementById("cerrarSesion");

  const esAdministrador =
    usuario.rol === "admin" || usuario.rol === "administrador";

  titulo.textContent = `¡Bienvenido, ${usuario.nombre}!`;
  rolCuenta.textContent =
    usuario.rol === "prestador"
      ? "Cuenta de prestador"
      : esAdministrador
        ? "Cuenta de administrador"
        : "Cuenta de dueño";

  cerrarSesion.addEventListener("click", () => window.PacCopAuth.logout());

  if (usuario.rol === "prestador") {
    window.location.replace("panel-prestador.html");
  } else {
    if (esAdministrador) {
      mensaje.textContent = "Ingresaste como administrador.";

      agregarTarjeta({
        href: "admin-reclamos.html",
        icono: "bi-flag",
        color: "text-accent-pac",
        encabezado: "Gestionar reclamos",
        texto: "Revisá y resolvé los reclamos de los usuarios.",
      });
    } else {
      mensaje.textContent = "Ingresaste como dueño de mascota.";
    }

    agregarTarjeta({
      href: "notificaciones.html",
      icono: "bi-bell",
      color: "text-primary-pac",
      encabezado: "Notificaciones",
      texto: "Consultá avisos sobre tus servicios y reclamos.",
      contador: true,
    });

    await cargarContadorNotificaciones();
  }
}
