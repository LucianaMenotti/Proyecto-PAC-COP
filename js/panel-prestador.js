
// =========================================
// PAC-COP - PANEL DEL PRESTADOR
// =========================================


// -----------------------------------------
// USUARIO LOGUEADO
// -----------------------------------------

const usuarioGuardado = localStorage.getItem("usuario");

if (!usuarioGuardado) {

    window.location.href = "login.html";

} else {

    const usuario = JSON.parse(usuarioGuardado);

    // Solo prestadores pueden entrar
    if (usuario.rol !== "prestador") {

        window.location.href = "inicio.html";

    } else {

        // Mostrar inicial del usuario
        const avatar = document.getElementById("avatarUsuario");

        if (avatar && usuario.nombre) {

            avatar.textContent =
                usuario.nombre.charAt(0).toUpperCase();

        }

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


// -----------------------------------------
// USAR PRECIO SUGERIDO
// -----------------------------------------

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


// -----------------------------------------
// PUBLICAR
// -----------------------------------------

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
