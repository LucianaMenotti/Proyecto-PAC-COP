
const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    try {

        const respuesta = await fetch("/api/users");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los usuarios");
        }

        const usuarios = await respuesta.json();

        const usuario = usuarios.find(function (item) {

            return (
                item.email === email &&
                item.password === password
            );

        });


        if (!usuario) {

            mensaje.innerHTML = `
                <div class="alert alert-danger">
                    Correo o contraseña incorrectos.
                </div>
            `;

            return;
        }


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


        // Redirigir según el tipo de usuario
        setTimeout(function () {

            if (usuario.rol === "prestador") {

                window.location.href =
                    "panel-prestador.html";

            } else {

                window.location.href =
                    "inicio.html";

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
