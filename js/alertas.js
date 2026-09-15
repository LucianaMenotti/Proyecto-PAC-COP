document.addEventListener("DOMContentLoaded", function () {
  // 1. Cargar los datos de la mascota
  const datosGuardados = localStorage.getItem("datosMascota");

  if (datosGuardados) {
    const mascota = JSON.parse(datosGuardados);

    // Mostrar alerta
    const alertaText = document.getElementById("mostrar-alerta");
    const tarjetaAlerta = alertaText.closest(".card");

    if (mascota.alertaDueño && mascota.alertaDueño.trim() !== "") {
      alertaText.textContent = `"${mascota.alertaDueño}"`;
    } else {
      alertaText.textContent = "El dueño no reportó alertas adicionales.";
      // Cambiar estilos visuales si no hay alertas
      tarjetaAlerta.classList.remove("card-alert-danger");
      tarjetaAlerta.querySelector(".card-header").style.backgroundColor =
        "#0f766e";
      alertaText.style.color = "#0f766e";
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

  // 2. Lógica para mostrar/ocultar el motivo de rechazo y alternar estilos del botón
  const radioAcepta = document.getElementById("acepta-si");
  const radioRechaza = document.getElementById("acepta-no");
  const contenedorMotivo = document.getElementById("motivo-rechazo-container");
  const btnSubmit = document.getElementById("btn-submit");

  radioAcepta.addEventListener("change", function () {
    if (this.checked) {
      contenedorMotivo.style.display = "none";
      btnSubmit.classList.remove("btn-danger-custom");
      btnSubmit.classList.add("btn-teal");
      btnSubmit.textContent = "Confirmar y Aceptar Servicio";
    }
  });

  radioRechaza.addEventListener("change", function () {
    if (this.checked) {
      contenedorMotivo.style.display = "block";
      btnSubmit.classList.remove("btn-teal");
      btnSubmit.classList.add("btn-danger-custom");
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
