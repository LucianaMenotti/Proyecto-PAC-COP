
// =========================================
// PAC-COP - REGISTRAR MASCOTA
// =========================================


// -----------------------------------------
// ELEMENTOS
// -----------------------------------------

const formulario =
    document.getElementById("formMascota");

const mensaje =
    document.getElementById("mensaje");

const fichaAhora =
    document.getElementById("fichaAhora");

const fichaDespues =
    document.getElementById("fichaDespues");

const datosSalud =
    document.getElementById("datosSalud");


// -----------------------------------------
// USUARIO LOGUEADO
// -----------------------------------------

const usuarioGuardado =
    localStorage.getItem("usuario");


if (!usuarioGuardado) {

    window.location.href = "login.html";

} else {

    try {

        const usuario =
            JSON.parse(usuarioGuardado);


        // Solo los dueños pueden registrar mascotas
        if (usuario.rol !== "dueño") {

            window.location.href = "inicio.html";

        } else {

            inicializarFormulario(usuario);

        }

    } catch (error) {

        console.error(
            "Error al leer el usuario:",
            error
        );

        localStorage.removeItem("usuario");

        window.location.href = "login.html";
    }
}


// -----------------------------------------
// MOSTRAR / OCULTAR FICHA
// -----------------------------------------

fichaAhora.addEventListener(
    "change",
    function () {

        if (fichaAhora.checked) {

            datosSalud.classList.remove("d-none");

        }

    }
);


fichaDespues.addEventListener(
    "change",
    function () {

        if (fichaDespues.checked) {

            datosSalud.classList.add("d-none");

        }

    }
);


// -----------------------------------------
// FORMULARIO
// -----------------------------------------

function inicializarFormulario(usuario) {

    formulario.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();


            mensaje.innerHTML = "";


            // =============================
            // DATOS DE LA MASCOTA
            // =============================

            const nombre =
                document
                    .getElementById("nombreMascota")
                    .value
                    .trim();


            const especie =
                document
                    .getElementById("especie")
                    .value;


            const raza =
                document
                    .getElementById("raza")
                    .value
                    .trim();


            const edadValor =
                document
                    .getElementById("edad")
                    .value;


            const edad =
                edadValor !== ""
                    ? Number(edadValor)
                    : null;


            const descripcion =
                document
                    .getElementById("descripcion")
                    .value
                    .trim();


            if (!nombre || !especie) {

                mostrarMensaje(
                    "Completá el nombre y la especie de la mascota.",
                    "danger"
                );

                return;
            }


            // =============================
            // FICHA DE SALUD
            // =============================

            let condicion = null;
            let alergias = null;
            let vacunacion = null;
            let reactividad = null;
            let alertaDueno = null;


            if (fichaAhora.checked) {

                condicion =
                    document
                        .getElementById("condicion")
                        .value
                        .trim();


                alergias =
                    document
                        .getElementById("alergias")
                        .value
                        .trim();


                vacunacion =
                    document
                        .getElementById("vacunacion")
                        .value;


                reactividad =
                    document
                        .getElementById("reactividad")
                        .value;


                alertaDueno =
                    document
                        .getElementById("alertaGeneral")
                        .value
                        .trim();


                if (
                    !condicion ||
                    !alergias ||
                    !vacunacion ||
                    !reactividad ||
                    !alertaDueno
                ) {

                    mostrarMensaje(
                        "Completá todos los datos de la ficha de salud o elegí completarla más adelante.",
                        "danger"
                    );

                    return;
                }

            }


            // =============================
            // DATOS A ENVIAR
            // =============================

            const datos = {

                nombre,
                especie,
                raza: raza || null,
                edad,
                descripcion: descripcion || null,

                condicion,
                alergias,
                vacunacion,
                reactividad,
                alertaDueno,

                userId: usuario.id
            };


            // =============================
            // GUARDAR MASCOTA
            // =============================

            try {

                const respuesta =
                    await fetch(
                        "/api/mascotas",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(datos)
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarMensaje(
                        resultado.mensaje ||
                        "No se pudo registrar la mascota.",
                        "danger"
                    );

                    return;
                }


                // =========================
                // ÉXITO
                // =========================

                mostrarMensaje(
                    fichaAhora.checked
                        ? "¡Mascota y ficha de salud registradas correctamente!"
                        : "¡Mascota registrada correctamente! Podés completar la ficha de salud más adelante.",
                    "success"
                );


                formulario.reset();

                datosSalud.classList.add("d-none");

                fichaDespues.checked = true;


                setTimeout(
                    function () {

                        window.location.href =
                            "mis-mascotas.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "Error al registrar mascota:",
                    error
                );


                mostrarMensaje(
                    "No se pudo conectar con el servidor. Verificá que el backend esté ejecutándose.",
                    "danger"
                );

            }

        }
    );

}


// -----------------------------------------
// MENSAJES
// -----------------------------------------

function mostrarMensaje(
    texto,
    tipo
) {

    mensaje.innerHTML = `
        <div class="alert alert-${tipo}">
            ${texto}
        </div>
    `;

}
