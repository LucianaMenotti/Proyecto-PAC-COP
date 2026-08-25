document.addEventListener("DOMContentLoaded", function () {
  // 1. Cargar los datos de la mascota
  const datosGuardados = localStorage.getItem("datosMascota");

  if (datosGuardados) {
    const mascota = JSON.parse(datosGuardados);

    // Mostrar alerta
    const alertaText = document.getElementById("mostrar-alerta");
    if (mascota.alertaDueño && mascota.alertaDueño.trim() !== "") {
      alertaText.textContent = `"${mascota.alertaDueño}"`;
    } else {
      alertaText.textContent = "El dueño no reportó alertas adicionales.";
      alertaText.classList.replace("text-danger", "text-success");
      // Cambiar el color de fondo de la tarjeta si no hay alertas
      alertaText.parentElement.classList.replace("bg-danger", "bg-success");
    }

    // Mostrar datos clínicos
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
    alert("No se encontraron datos. Volviendo al formulario del dueño.");
    window.location.href = "fichasalud.html";
  }

  // 2. Lógica para mostrar/ocultar el motivo de rechazo
  const radioAcepta = document.getElementById("acepta-si");
  const radioRechaza = document.getElementById("acepta-no");
  const contenedorMotivo = document.getElementById("motivo-rechazo-container");
  const btnSubmit = document.getElementById("btn-submit");

  radioAcepta.addEventListener("change", function () {
    if (this.checked) {
      contenedorMotivo.style.display = "none";
      btnSubmit.classList.replace("btn-danger", "btn-dark");
      btnSubmit.textContent = "Confirmar y Aceptar Servicio";
    }
  });

  radioRechaza.addEventListener("change", function () {
    if (this.checked) {
      contenedorMotivo.style.display = "block";
      btnSubmit.classList.replace("btn-dark", "btn-danger");
      btnSubmit.textContent = "Confirmar y Rechazar Servicio";
    }
  });

  // 3. Manejo del envío del formulario final
  document
    .getElementById("prestador-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      if (radioAcepta.checked) {
        alert("¡Has ACEPTADO el servicio! El dueño será notificado.");
      } else if (radioRechaza.checked) {
        const motivo = document.getElementById("motivo-rechazo").value;
        if (motivo.trim() !== "") {
          alert(`Has RECHAZADO el servicio.\nMotivo registrado: ${motivo}`);
        } else {
          alert("Has RECHAZADO el servicio. No se especificó motivo.");
        }
      }

      // Limpiar datos y reiniciar
      localStorage.removeItem("datosMascota");
      window.location.href = "fichasalud.html";
    });
});
