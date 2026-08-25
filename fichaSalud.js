document
  .getElementById("health-form")
  .addEventListener("submit", function (evento) {
    evento.preventDefault(); // Evitamos que la página se recargue

    // Capturamos los datos del dueño
    const datosMascota = {
      raza: document.getElementById("raza").value,
      edad: document.getElementById("edad").value,
      condicion: document.getElementById("condicion").value,
      alergias: document.getElementById("alergias").value,
      vacunacion: document.getElementById("vacunacion").value,
      reactividad: document.getElementById("reactividad").value,
      alertaDueño: document.getElementById("alerta-general").value,
    };

    // Guardamos en localStorage para que el prestador pueda leerlo en la otra página
    localStorage.setItem("datosMascota", JSON.stringify(datosMascota));

    // Simulamos el envío y redirigimos a la vista del prestador
    alert("Ficha guardada con éxito. Redirigiendo a la vista del prestador...");
    window.location.href = "alertas.html";
  });
