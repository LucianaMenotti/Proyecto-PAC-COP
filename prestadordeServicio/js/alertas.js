document.addEventListener("DOMContentLoaded", function () {
  // 1. Cargar los datos de la mascota desde localStorage
  const datosGuardados = localStorage.getItem("datosMascota");

  if (datosGuardados) {
    const mascota = JSON.parse(datosGuardados);

    // Mostrar alerta del dueño
    const alertaText = document.getElementById("mostrar-alerta");
    const tarjetaAlerta = alertaText.closest(".card");

    if (mascota.alertaDueño && mascota.alertaDueño.trim() !== "") {
      alertaText.textContent = `"${mascota.alertaDueño}"`;
    } else {
      alertaText.textContent = "El dueño no reportó alertas adicionales.";
      tarjetaAlerta.classList.remove("card-alert-danger");
      tarjetaAlerta
        .querySelector(".card-header")
        .classList.remove("text-danger");
      tarjetaAlerta.querySelector(".card-header").classList.add("header-blue");
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

  // 2. Manejo de botones de acción directa
  const btnAceptar = document.getElementById("btn-aceptar");
  const btnRechazar = document.getElementById("btn-rechazar");
  const contenedorMotivo = document.getElementById("motivo-rechazo-container");
  const btnConfirmarRechazo = document.getElementById("btn-confirmar-rechazo");
  const btnCancelarRechazo = document.getElementById("btn-cancelar-rechazo");

  // Acción Aceptar
  btnAceptar.addEventListener("click", function () {
    alert("¡Has ACEPTADO el servicio! El dueño será notificado.");
    localStorage.removeItem("datosMascota");
    window.location.href = "fichasalud.html";
  });

  // Mostrar panel de rechazo
  btnRechazar.addEventListener("click", function () {
    contenedorMotivo.style.display = "block";
    contenedorMotivo.scrollIntoView({ behavior: "smooth" });
  });

  // Cancelar rechazo
  btnCancelarRechazo.addEventListener("click", function () {
    contenedorMotivo.style.display = "none";
    document.getElementById("motivo-rechazo").value = "";
  });

  // Confirmar Rechazo
  btnConfirmarRechazo.addEventListener("click", function () {
    const motivo = document.getElementById("motivo-rechazo").value.trim();
    if (motivo !== "") {
      alert(`Has RECHAZADO el servicio.\nMotivo registrado: ${motivo}`);
    } else {
      alert("Has RECHAZADO el servicio. No se especificó motivo.");
    }
    localStorage.removeItem("datosMascota");
    window.location.href = "fichasalud.html";
  });
});
