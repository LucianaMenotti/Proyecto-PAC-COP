const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

// Roles
const dueno = document.getElementById("dueno");
const prestador = document.getElementById("prestador");

const seccionDueno = document.getElementById("seccionDueno");
const seccionPrestador = document.getElementById("seccionPrestador");

// Mascota
const mascotaAhora = document.getElementById("mascotaAhora");
const mascotaDespues = document.getElementById("mascotaDespues");
const datosMascota = document.getElementById("datosMascota");

// Ficha de salud
const fichaAhora = document.getElementById("fichaAhora");
const fichaDespues = document.getElementById("fichaDespues");
const datosSalud = document.getElementById("datosSalud");

// Traslado y vehículo
const traslado = document.getElementById("traslado");
const seccionVehiculo = document.getElementById("seccionVehiculo");


function mostrarMensaje(texto, tipo = "danger") {
    mensaje.innerHTML = `
        <div class="alert alert-${tipo}">
            ${texto}
        </div>
    `;
}


function limpiarMensaje() {
    mensaje.innerHTML = "";
}


// ===============================
// CAMBIO DE ROL
// ===============================

function actualizarRol() {
    limpiarMensaje();

    if (dueno.checked) {
        seccionDueno.classList.remove("d-none");
        seccionPrestador.classList.add("d-none");

        seccionVehiculo.classList.add("d-none");

        document.querySelectorAll(".servicio").forEach((checkbox) => {
            checkbox.checked = false;
        });

        document.querySelectorAll('input[name="vehiculo"]').forEach((radio) => {
            radio.checked = false;
        });
    }

    if (prestador.checked) {
        seccionPrestador.classList.remove("d-none");
        seccionDueno.classList.add("d-none");

        datosMascota.classList.add("d-none");
        datosSalud.classList.add("d-none");

        mascotaDespues.checked = true;
        fichaDespues.checked = true;
    }
}


// ===============================
// REGISTRO DE MASCOTA
// ===============================

function actualizarMascota() {
    if (mascotaAhora.checked) {
        datosMascota.classList.remove("d-none");
    } else {
        datosMascota.classList.add("d-none");

        fichaDespues.checked = true;
        datosSalud.classList.add("d-none");
    }
}


// ===============================
// FICHA DE SALUD
// ===============================

function actualizarFicha() {
    if (fichaAhora.checked) {
        datosSalud.classList.remove("d-none");
    } else {
        datosSalud.classList.add("d-none");
    }
}


// ===============================
// VEHÍCULO
// ===============================

function actualizarVehiculo() {
    if (traslado.checked) {
        seccionVehiculo.classList.remove("d-none");
    } else {
        seccionVehiculo.classList.add("d-none");

        document.querySelectorAll('input[name="vehiculo"]').forEach((radio) => {
            radio.checked = false;
        });
    }
}


// Eventos
dueno.addEventListener("change", actualizarRol);
prestador.addEventListener("change", actualizarRol);

mascotaAhora.addEventListener("change", actualizarMascota);
mascotaDespues.addEventListener("change", actualizarMascota);

fichaAhora.addEventListener("change", actualizarFicha);
fichaDespues.addEventListener("change", actualizarFicha);

traslado.addEventListener("change", actualizarVehiculo);


// ===============================
// ENVIAR FORMULARIO
// ===============================

formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    limpiarMensaje();

    const rolSeleccionado = document.querySelector(
        'input[name="rol"]:checked'
    );

    if (!rolSeleccionado) {
        mostrarMensaje("Seleccioná si sos dueño o prestador.");
        return;
    }

    const rol = rolSeleccionado.value;


    // ===============================
    // DATOS DEL USUARIO
    // ===============================

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const dni = document.getElementById("dni").value.trim();
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const telefono = document.getElementById("telefono").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;


    if (
        !nombre ||
        !apellido ||
        !dni ||
        !fechaNacimiento ||
        !telefono ||
        !email ||
        !password
    ) {
        mostrarMensaje("Completá todos los datos obligatorios.");
        return;
    }


    // ===============================
    // DATOS DEL PRESTADOR
    // ===============================

    let zona = null;
    let servicios = null;
    let vehiculo = null;

    if (rol === "prestador") {

        zona = document.getElementById("zona").value.trim();

        servicios = [];

        document.querySelectorAll(".servicio:checked").forEach((checkbox) => {
            servicios.push(checkbox.value);
        });

        if (!zona) {
            mostrarMensaje("Ingresá la zona donde trabajás.");
            return;
        }

        if (servicios.length === 0) {
            mostrarMensaje("Seleccioná al menos un servicio.");
            return;
        }

        if (servicios.includes("Traslado")) {

            const vehiculoSeleccionado = document.querySelector(
                'input[name="vehiculo"]:checked'
            );

            if (!vehiculoSeleccionado) {
                mostrarMensaje(
                    "Seleccioná el vehículo que utilizás para realizar traslados."
                );
                return;
            }

            vehiculo = vehiculoSeleccionado.value;
        }
    }


    // ===============================
    // DATOS DE LA MASCOTA
    // ===============================

    let datosMascotaRegistro = null;

    if (rol === "dueño" && mascotaAhora.checked) {

        const nombreMascota = document
            .getElementById("nombreMascota")
            .value
            .trim();

        const especie = document.getElementById("especie").value;

        const raza = document
            .getElementById("raza")
            .value
            .trim();

        // CORREGIDO: el HTML usa edadMascota
        const edadValor = document.getElementById("edadMascota").value;

        const edad = edadValor !== ""
            ? Number(edadValor)
            : null;


        if (!nombreMascota || !especie) {
            mostrarMensaje(
                "Completá el nombre y la especie de la mascota."
            );
            return;
        }


        // ===============================
        // FICHA DE SALUD
        // ===============================

        let condicion = null;
        let alergias = null;
        let vacunacion = null;
        let reactividad = null;
        let alertaDueno = null;

        if (fichaAhora.checked) {

            condicion = document
                .getElementById("condicion")
                .value
                .trim();

            alergias = document
                .getElementById("alergias")
                .value
                .trim();

            vacunacion = document
                .getElementById("vacunacion")
                .value;

            reactividad = document
                .getElementById("reactividad")
                .value;

            // CORREGIDO: el HTML usa alertaGeneral
            alertaDueno = document
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
                    "Completá todos los datos de la ficha de salud o elegí completarla más adelante."
                );
                return;
            }
        }


        datosMascotaRegistro = {
            nombre: nombreMascota,
            especie: especie,
            raza: raza || null,
            edad: edad,
            descripcion: null,
            condicion: condicion,
            alergias: alergias,
            vacunacion: vacunacion,
            reactividad: reactividad,
            alertaDueno: alertaDueno
        };
    }


    // ===============================
    // CREAR USUARIO
    // ===============================

    const datosUsuario = {
        nombre,
        apellido,
        dni,
        fechaNacimiento,
        telefono,
        email,
        password,
        rol,
        zona,
        servicios,
        vehiculo
    };


    try {

        const respuestaUsuario = await fetch("/api/users", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datosUsuario)
        });


        const resultadoUsuario = await respuestaUsuario.json();


        if (!respuestaUsuario.ok) {
            mostrarMensaje(
                resultadoUsuario.mensaje ||
                "No se pudo registrar el usuario."
            );
            return;
        }


        const usuarioCreado = resultadoUsuario.usuario;


        // ===============================
        // CREAR MASCOTA
        // ===============================

        if (datosMascotaRegistro) {

            const datosMascota = {
                ...datosMascotaRegistro,
                userId: usuarioCreado.id
            };


            const respuestaMascota = await fetch("/api/mascotas", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(datosMascota)
            });


            const resultadoMascota = await respuestaMascota.json();


            if (!respuestaMascota.ok) {
                mostrarMensaje(
                    "La cuenta se creó, pero no se pudo registrar la mascota. Podés agregarla después desde 'Mis mascotas'.",
                    "warning"
                );
                return;
            }
        }


        // ===============================
        // REGISTRO COMPLETADO
        // ===============================

        mostrarMensaje(
            "¡Registro completado correctamente! Redirigiendo al inicio de sesión...",
            "success"
        );


        formulario.reset();

        seccionDueno.classList.add("d-none");
        seccionPrestador.classList.add("d-none");
        datosMascota.classList.add("d-none");
        datosSalud.classList.add("d-none");
        seccionVehiculo.classList.add("d-none");


        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);


    } catch (error) {

        console.error("Error durante el registro:", error);

        mostrarMensaje(
            "No se pudo conectar con el servidor. Verificá que el backend esté ejecutándose."
        );
    }
});