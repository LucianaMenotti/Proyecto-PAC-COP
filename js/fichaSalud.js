console.log("FICHA SALUD JS CARGADO");
document.addEventListener("DOMContentLoaded", async () => {

    const healthForm = document.getElementById("health-form");
    const mensaje = document.getElementById("mensaje");
    const nombreMascota = document.getElementById("nombreMascota");

    // ===============================
    // COMPROBAR USUARIO
    // ===============================

    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
        window.location.href = "login.html";
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardado);
    } catch (error) {
        console.error("Error al leer el usuario:", error);

        localStorage.removeItem("usuario");
        window.location.href = "login.html";
        return;
    }


    // ===============================
    // OBTENER ID DE LA MASCOTA
    // ===============================

    const parametros = new URLSearchParams(window.location.search);
    const mascotaId = parametros.get("id");

    if (!mascotaId) {
        mostrarMensaje("No se indicó qué mascota se quiere modificar.", "danger");
        healthForm.style.display = "none";
        return;
    }


    // ===============================
    // OBTENER MASCOTA
    // ===============================

    try {

        const respuesta = await fetch(`/api/mascotas/${mascotaId}`);

        const mascota = await respuesta.json();


        if (!respuesta.ok) {
            mostrarMensaje(
                mascota.mensaje || "No se pudo obtener la mascota.",
                "danger"
            );

            healthForm.style.display = "none";
            return;
        }


        // ===============================
        // COMPROBAR DUEÑO
        // ===============================

        if (Number(mascota.userId) !== Number(usuario.id)) {

            mostrarMensaje(
                "No tenés permiso para modificar esta mascota.",
                "danger"
            );

            healthForm.style.display = "none";
            return;
        }


        // ===============================
        // MOSTRAR NOMBRE
        // ===============================

        nombreMascota.textContent = mascota.nombre;


        // ===============================
        // CARGAR DATOS EXISTENTES
        // ===============================

        document.getElementById("condicion").value =
            mascota.condicion || "";

        document.getElementById("alergias").value =
            mascota.alergias || "";

        document.getElementById("vacunacion").value =
            mascota.vacunacion || "";

        document.getElementById("reactividad").value =
            mascota.reactividad || "";

        document.getElementById("alerta-general").value =
            mascota.alertaDueno || "";


    } catch (error) {

        console.error("Error al obtener la mascota:", error);

        mostrarMensaje(
            "No se pudo conectar con el servidor.",
            "danger"
        );

        healthForm.style.display = "none";

        return;
    }


    // ===============================
    // GUARDAR FICHA
    // ===============================

    healthForm.addEventListener("submit", async function (evento) {

        evento.preventDefault();

        limpiarMensaje();


        const datosFicha = {

            condicion: document
                .getElementById("condicion")
                .value
                .trim(),

            alergias: document
                .getElementById("alergias")
                .value
                .trim(),

            vacunacion: document
                .getElementById("vacunacion")
                .value,

            reactividad: document
                .getElementById("reactividad")
                .value,

            alertaDueno: document
                .getElementById("alerta-general")
                .value
                .trim()
        };


        // ===============================
        // VALIDACIÓN
        // ===============================

        if (
            !datosFicha.condicion ||
            !datosFicha.alergias ||
            !datosFicha.vacunacion ||
            !datosFicha.reactividad ||
            !datosFicha.alertaDueno
        ) {

            mostrarMensaje(
                "Completá todos los campos de la ficha de salud.",
                "danger"
            );

            return;
        }


        // ===============================
        // ACTUALIZAR MASCOTA
        // ===============================

        try {

            const respuesta = await fetch(
                `/api/mascotas/${mascotaId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(datosFicha)
                }
            );


            const resultado = await respuesta.json();


            if (!respuesta.ok) {

                mostrarMensaje(
                    resultado.mensaje ||
                    "No se pudo guardar la ficha de salud.",
                    "danger"
                );

                return;
            }


            // ===============================
            // ÉXITO
            // ===============================

            mostrarMensaje(
                "¡Ficha de salud guardada correctamente!",
                "success"
            );


            setTimeout(() => {
                window.location.href = "mis-mascotas.html";
            }, 1200);


        } catch (error) {

            console.error(
                "Error al guardar la ficha:",
                error
            );

            mostrarMensaje(
                "No se pudo conectar con el servidor.",
                "danger"
            );
        }

    });


    // ===============================
    // FUNCIONES AUXILIARES
    // ===============================

    function mostrarMensaje(texto, tipo) {

        mensaje.innerHTML = `
            <div class="alert alert-${tipo}">
                ${texto}
            </div>
        `;
    }


    function limpiarMensaje() {
        mensaje.innerHTML = "";
    }

});