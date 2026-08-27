const formulario = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const respuesta = await fetch("/api/users/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })
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

        sessionStorage.setItem(
            "usuario",
            JSON.stringify(resultado.usuario)
        );

        mensaje.innerHTML = `
            <div class="alert alert-success">
                ${resultado.mensaje}
            </div>
        `;

        console.log("Usuario:", resultado.usuario);

    } catch (error) {

        console.error(error);

        mensaje.innerHTML = `
            <div class="alert alert-danger">
                No se pudo conectar con el servidor.
            </div>
        `;
    }
});