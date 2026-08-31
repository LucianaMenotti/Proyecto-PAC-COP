const formulario = document.getElementById("formDueno");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;
    const zona = document.getElementById("zona").value;

    const datos = {

        nombre,
        apellido,
        email,
        password,
        telefono,
        zona,
        rol: "dueño"

    };

    try {

        const respuesta = await fetch("/api/users", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });

        const resultado = await respuesta.json();

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
                Cuenta creada correctamente.
                Ahora podés iniciar sesión.
            </div>
        `;

        formulario.reset();

    } catch (error) {

        console.error("Error:", error);

        mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudo conectar con el servidor.
            </div>
        `;
    }

});