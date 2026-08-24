const formulario =
    document.getElementById("formLogin");

const mensaje =
    document.getElementById("mensaje");


formulario.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;


        const datos =
            localStorage.getItem("prestador");


        if (!datos) {

            mensaje.innerHTML = `

                <div class="alert alert-warning">

                    No existe ninguna cuenta registrada.

                </div>

            `;

            return;

        }


        const prestador =
            JSON.parse(datos);


        if (
            email === prestador.email &&
            password === prestador.password
        ) {

            mensaje.innerHTML = `

                <div class="alert alert-success">

                    Inicio de sesión correcto.

                </div>

            `;

        } else {

            mensaje.innerHTML = `

                <div class="alert alert-danger">

                    Correo o contraseña incorrectos.

                </div>

            `;

        }

    }
);