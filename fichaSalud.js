document.addEventListener("DOMContentLoaded", () => {
  const healthForm = document.getElementById("health-form");

  healthForm.addEventListener("submit", function (evento) {
    evento.preventDefault(); 

    const datosMascota = {
      raza: document.getElementById("raza").value,
      edad: document.getElementById("edad").value,
      condicion: document.getElementById("condicion").value,
      alergias: document.getElementById("alergias").value,
      vacunacion: document.getElementById("vacunacion").value,
      reactividad: document.getElementById("reactividad").value,
      alertaDueño: document.getElementById("alerta-general").value,
    };

    localStorage.setItem("datosMascota", JSON.stringify(datosMascota));

    alert("Ficha guardada con éxito. Redirigiendo a la vista del prestador...");
    window.location.href = "alertas.html";
  });
});