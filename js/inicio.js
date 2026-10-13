const usuario = await window.PacCopAuth.requireSession();

if (usuario) {
    const titulo = document.getElementById("titulo");
    const mensaje = document.getElementById("mensaje");
    const rolCuenta = document.getElementById("rolCuenta");
    const cerrarSesion = document.getElementById("cerrarSesion");

    titulo.textContent = `¡Bienvenido, ${usuario.nombre}!`;
    rolCuenta.textContent = usuario.rol === "prestador"
        ? "Cuenta de prestador"
        : usuario.rol === "admin" || usuario.rol === "administrador"
            ? "Cuenta de administrador"
            : "Cuenta de dueño";

    cerrarSesion.addEventListener("click", () => window.PacCopAuth.logout());

    if (usuario.rol === "prestador") {
        window.location.replace("panel-prestador.html");
    } else if (usuario.rol === "admin" || usuario.rol === "administrador") {
        mensaje.textContent = "Ingresaste como administrador.";
    } else {
        mensaje.textContent = "Ingresaste como dueño de mascota.";
    }
}
