const contenedor =
    document.getElementById("mascotas");

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

    } else {

        cargarMascotas(usuario.id);

    }
}


async function cargarMascotas(userId) {

    try {

        const respuesta =
            await fetch(
                `/api/mascotas/usuario/${userId}`
            );


        if (!respuesta.ok) {

            throw new Error(
                "No se pudieron obtener las mascotas"
            );

        }


        const mascotas =
            await respuesta.json();


        if (mascotas.length === 0) {

            mensaje.innerHTML = `
                <div class="alert alert-info">
                    Todavía no tenés mascotas registradas.
                    Podés agregar una usando el botón de abajo.
                </div>
            `;

            return;
        }


        mascotas.forEach(function (mascota) {

            contenedor.innerHTML += `

                <div class="col-md-6 col-lg-4">

                    <div class="card h-100 border-0 shadow-sm">

                        <div class="card-body">

                            <h4 class="fw-bold">
                                ${mascota.nombre}
                            </h4>

                            <p>
                                <strong>Especie:</strong>
                                ${mascota.especie}
                            </p>

                            <p>
                                <strong>Raza:</strong>
                                ${mascota.raza || "No especificada"}
                            </p>

                            <p>
                                <strong>Edad:</strong>
                                ${mascota.edad || "No especificada"}
                            </p>

                            ${
                                mascota.descripcion
                                ?
                                `
                                <p class="text-secondary">
                                    ${mascota.descripcion}
                                </p>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>

                </div>

            `;

        });


    } catch (error) {

        console.error(
            "Error al cargar mascotas:",
            error
        );

        mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudieron cargar las mascotas.
            </div>
        `;
    }

}