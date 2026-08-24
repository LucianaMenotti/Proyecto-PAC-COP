const formulario = document.getElementById("formMascota");
const mensaje = document.getElementById("mensaje");


formulario.addEventListener("submit", function(event) {

    event.preventDefault();


    const mascota = {

        nombre: document.getElementById("nombreMascota").value,

        especie: document.getElementById("especie").value,

        raza: document.getElementById("raza").value,

        edad: document.getElementById("edad").value,

        descripcion:
            document.getElementById("descripcion").value

    };


    localStorage.setItem(
        "mascota",
        JSON.stringify(mascota)
    );


    mensaje.innerHTML = `
        <div class="alert alert-success">
            Mascota registrada correctamente.
        </div>
    `;


    formulario.reset();

});