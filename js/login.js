
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    try {

        const respuesta = await fetch("/api/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {

            mensaje.innerHTML = `
                <div class="alert alert-danger">
                    ${resultado.mensaje || "Correo o contraseña incorrectos."}
                </div>
            `;

            return;
        }

        const usuario = resultado.usuario;


        // Guardar usuario que inició sesión
        localStorage.setItem(
            "usuario",
            JSON.stringify(usuario)
        );


        mensaje.innerHTML = `
            <div class="alert alert-success">
                Inicio de sesión correcto.
            </div>
        `;


                setTimeout(function () {

            if (usuario.rol === "prestador") {

                window.location.replace(
                    "panel-prestador.html"
                );

            } else {

                window.location.replace(
                    "inicio.html"
                );

            }

        }, 500);


    } catch (error) {

        console.error(
            "Error al iniciar sesión:",
            error
        );

        mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudo conectar con el servidor.
            </div>
        `;
    }

});
