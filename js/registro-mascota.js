const formulario =
    document.getElementById("formMascota");

const mensaje =
    document.getElementById("mensaje");


const usuarioGuardado =
    localStorage.getItem("usuario");


if (!usuarioGuardado) {

    window.location.href =
        "login.html";

} else {

    const usuario =
        JSON.parse(usuarioGuardado);


    if (usuario.rol !== "dueño") {

        window.location.href =
            "inicio.html";

    }


    formulario.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const datos = {

                nombre:
                    document.getElementById(
                        "nombreMascota"
                    ).value,

                especie:
                    document.getElementById(
                        "especie"
                    ).value,

                raza:
                    document.getElementById(
                        "raza"
                    ).value,

                edad:
                    Number(
                        document.getElementById(
                            "edad"
                        ).value
                    ),

                descripcion:
                    document.getElementById(
                        "descripcion"
                    ).value,

                userId:
                    usuario.id
            };


            try {

                const respuesta =
                    await fetch("/api/mascotas", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(datos)

                    });


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mensaje.innerHTML = `
                        <div class="alert alert-danger">
                            ${resultado.mensaje}
                        </div>
                    `;

                    return;
                }


                mensaje.innerHTML = `
                    <div class="alert alert-success">
                        ¡Mascota registrada correctamente!
                    </div>
                `;


                formulario.reset();


                setTimeout(function () {

                    window.location.href =
                        "mis-mascotas.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Error al registrar mascota:",
                    error
                );

                mensaje.innerHTML = `
                    <div class="alert alert-danger">
                        No se pudo conectar con el servidor.
                    </div>
                `;

            }

        }
    );

}