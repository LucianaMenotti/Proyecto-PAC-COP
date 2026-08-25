document.addEventListener("DOMContentLoaded", function () {
  // 1. Obtener los datos del localStorage que guardó el dueño
  const datosGuardados = localStorage.getItem("datosMascota");

  if (datosGuardados) {
    const mascota = JSON.parse(datosGuardados);

    // 2. Mostrar la alerta principal
    const alertaText = document.getElementById("mostrar-alerta");
    if (mascota.alertaDueño.trim() !== "") {
      alertaText.textContent = `"${mascota.alertaDueño}"`;
    } else {
      alertaText.textContent = "El dueño no reportó alertas.";
      alertaText.classList.replace("text-danger", "text-success");
    }

    // 3. Llenar los datos clínicos en la lista
    const listaDatos = document.getElementById("mostrar-datos");
    listaDatos.innerHTML = `
      <li class="list-group-item"><strong>Raza:</strong> ${mascota.raza}</li>
      <li class="list-group-item"><strong>Edad:</strong> ${mascota.edad} años</li>
      <li class="list-group-item"><strong>Condición Médica:</strong> ${mascota.condicion}</li>
      <li class="list-group-item"><strong>Alergias:</strong> ${mascota.alergias}</li>
      <li class="list-group-item"><strong>Vacunación:</strong> ${mascota.vacunacion}</li>
      <li class="list-group-item"><strong>Reactividad:</strong> ${mascota.reactividad}</li>
    `;
  } else {
    // Si entran directo sin pasar por el formulario
    alert("No se encontraron datos. Volviendo al formulario del dueño.");
    window.location.href = "fichasalud.html";
  }
});

// Manejo del formulario del prestador
document
  .getElementById("prestador-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    alert(
      "El servicio ha sido registrado correctamente con su evaluación de riesgo. Se limpiarán los datos.",
    );
    localStorage.removeItem("datosMascota");
    window.location.href = "fichasalud.html"; // Reinicia el ciclo
  });
