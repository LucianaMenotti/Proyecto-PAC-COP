const formulario = document.getElementById("formPrestador");
const mensaje = document.getElementById("mensaje");


formulario.addEventListener("submit", function(event) {

    event.preventDefault();


    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;
    const zona = document.getElementById("zona").value;


    const servicios = [];

    document
        .querySelectorAll(
            'input[type="checkbox"]:checked'
        )
        .forEach(function(checkbox) {

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


    const prestador = {

        nombre: nombre,
        apellido: apellido,
        email: email,
        password: password,
        telefono: telefono,
        zona: zona,
        servicios: servicios,
        verificado: false,
        calificacion: 0,
        reseñas: 0

    };


    localStorage.setItem(
        "prestador",
        JSON.stringify(prestador)
    );


    mensaje.innerHTML = `
        <div class="alert alert-success">
            ¡Cuenta creada correctamente! Hora de laburar.
        </div>
    `;


    formulario.reset();

});