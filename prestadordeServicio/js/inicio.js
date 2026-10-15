const usuarioGuardado =
    localStorage.getItem("usuario");

if (!usuarioGuardado) {

    window.location.href =
        "login.html";

} else {

    const usuario =
        JSON.parse(usuarioGuardado);

    const titulo =
        document.getElementById("titulo");

    const mensaje =
        document.getElementById("mensaje");

    const acciones =
        document.getElementById("acciones");


    titulo.textContent =
        `¡Bienvenido, ${usuario.nombre}!`;


    if (usuario.rol === "prestador") {

        mensaje.textContent =
            "Ingresaste como prestador de servicios.";

        acciones.innerHTML = `

            <div class="alert alert-info">
                La página de gestión de prestadores
                estará disponible próximamente.
            </div>

        `;

    } else {

        mensaje.textContent =
            "Ingresaste como dueño de mascota.";

        acciones.innerHTML = `

            <a
                href="buscar-prestadores.html"
                class="btn btn-primary me-2"
            >
                Buscar prestadores
            </a>

            <a
                href="mis-mascotas.html"
                class="btn btn-outline-primary"
            >
                Mis mascotas
            </a>

        `;
    }
}