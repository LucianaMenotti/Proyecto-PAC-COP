const formulario = document.getElementById("formPrestador");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;
    const zona = document.getElementById("zona").value;

    const servicios = [];

    document
        .querySelectorAll('input[type="checkbox"]:checked')
        .forEach(function (checkbox) {
            servicios.push(checkbox.value);
        });

    if (servicios.length === 0) {
        mensaje.innerHTML = `
            <div class="alert alert-warning">
                Seleccioná al menos un servicio.
            </div>
        `;
        return;
    }

    const datos = {
        nombre,
        apellido,
        email,
        password,
        telefono,
        zona,
        rol: "prestador",
        servicios
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
                ¡Cuenta creada correctamente! Hora de laburar.
            </div>
        `;

        formulario.reset();

        console.log("Usuario creado:", resultado.usuario);

    } catch (error) {

        console.error("Error:", error);

        mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudo conectar con el servidor.
            </div>
        `;
    }
});