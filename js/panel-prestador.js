
// =========================================
// PAC-COP - PANEL DEL PRESTADOR
// =========================================


// -----------------------------------------
// USUARIO LOGUEADO
// -----------------------------------------

const usuarioGuardado = localStorage.getItem("usuario");

let usuario = null;

if (!usuarioGuardado) {

    window.location.href = "login.html";

} else {

    usuario = JSON.parse(usuarioGuardado);

    // Solo prestadores pueden entrar
    if (usuario.rol !== "prestador") {

        window.location.href = "inicio.html";

    }
}


// -----------------------------------------
// DATOS DEL USUARIO
// -----------------------------------------

if (usuario) {

    // Avatar
    const avatar =
        document.getElementById("avatarUsuario");

    if (avatar && usuario.nombre) {

        avatar.textContent =
            usuario.nombre.charAt(0).toUpperCase();

    }


    // Nombre del prestador
    const nombrePrestador =
        document.getElementById("nombrePrestador");

    if (nombrePrestador) {

        nombrePrestador.textContent =
            `${usuario.nombre} ${usuario.apellido}`;

    }


    // Zona
    const zonaPrestador =
        document.getElementById("zonaPrestador");

    if (zonaPrestador) {

        zonaPrestador.textContent =
            usuario.zona || "Zona no especificada";

    }


    // Calificación
    const calificacion =
        document.getElementById("calificacionPrestador");

    if (calificacion) {

        calificacion.textContent =
            usuario.calificacion || "0";

    }


    // Reseñas
    const resenas =
        document.getElementById("resenasPrestador");

    if (resenas) {

        resenas.textContent =
            usuario.resenas || "0";

    }


    // -------------------------------------
    // SERVICIOS DEL PRESTADOR
    // -------------------------------------

    const serviciosPrestador =
        document.getElementById("serviciosPrestador");

    if (serviciosPrestador && usuario.servicios) {

        try {

            const servicios =
                typeof usuario.servicios === "string"
                    ? JSON.parse(usuario.servicios)
                    : usuario.servicios;


            if (Array.isArray(servicios)) {

                serviciosPrestador.innerHTML =
                    servicios
                        .map(function (servicio) {

                            return `
                                <span class="badge bg-light text-dark border">
                                    ${servicio}
                                </span>
                            `;

                        })
                        .join("");

            }

        } catch (error) {

            console.error(
                "No se pudieron cargar los servicios:",
                error
            );

        }

    }


    // -------------------------------------
    // AVATAR → PERFIL
    // -------------------------------------

    if (avatar) {

        avatar.style.cursor = "pointer";

        avatar.addEventListener(
            "click",
            function () {

                window.location.href =
                    "perfil-prestador.html";

            }
        );

    }

}


// -----------------------------------------
// PRECIOS MÍNIMOS
// -----------------------------------------

const precios = {

    paseo: {
        nombre: "Paseo",
        nuevo: 4000,
        establecido: 5000,
        top: 7000
    },

    guarderia: {
        nombre: "Guardería",
        nuevo: 7000,
        establecido: 9000,
        top: 12000
    },

    traslado: {
        nombre: "Traslado",
        nuevo: 5000,
        establecido: 7000,
        top: 10000
    }

};


const tabla =
    document.getElementById("tablaPrecios");


if (tabla) {

    tabla.innerHTML = "";

    Object.values(precios).forEach(function (servicio) {

        tabla.innerHTML += `

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

        `;

    });

}


// -----------------------------------------
// FORMULARIO DE PUBLICACIÓN
// -----------------------------------------

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


function obtenerPrecioMinimo() {

    const servicio =
        servicioSelect.value;

    return precios[servicio].establecido;

}


// -----------------------------------------
// CAMBIO DE SERVICIO
// -----------------------------------------

if (servicioSelect) {

    servicioSelect.addEventListener(
        "change",
        function () {

            const minimo =
                obtenerPrecioMinimo();

            precioInput.placeholder =
                minimo;

            precioError.classList.add("d-none");

        }
    );

}


// -----------------------------------------
// USAR PRECIO SUGERIDO
// -----------------------------------------

if (useSuggested) {

    useSuggested.addEventListener(
        "click",
        function () {

            const minimo =
                obtenerPrecioMinimo();

            precioInput.value =
                minimo;

            precioError.classList.add("d-none");

        }
    );

}


// -----------------------------------------
// PUBLICAR
// -----------------------------------------

if (formulario) {

    formulario.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const precio =
                Number(precioInput.value);

            const minimo =
                obtenerPrecioMinimo();


            if (!precio || precio < minimo) {

                precioError.classList.remove("d-none");

                return;

            }


            precioError.classList.add("d-none");


            alert(
                "Servicio publicado correctamente."
            );


            formulario.reset();

        }
    );

}

