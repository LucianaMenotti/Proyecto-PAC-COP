document.addEventListener("DOMContentLoaded", () => {
  const healthForm = document.getElementById("health-form");
  const vistaDueno = document.getElementById("vista-dueno");
  const resumenPantalla = document.getElementById("resumen-pantalla");
  const resumenContenido = document.getElementById("resumen-contenido");

  const btnFinalizar = document.getElementById("btn-finalizar");
  const btnEditar = document.getElementById("btn-editar");
  const btnSubmitForm = document.getElementById("btn-submit-form");
  const tituloResumen = document.getElementById("titulo-resumen");
  const subtituloResumen = document.getElementById("subtitulo-resumen");

  let modoEdicion = false;

  // Función para mostrar la pantalla de resumen dependiendo de si ya finalizó o no
  const mostrarResumen = (datos, estado) => {
    resumenContenido.innerHTML = `
      <p><span class="label-resumen">Nombre:</span> ${datos.raza}</p>
      <p><span class="label-resumen">Edad:</span> ${datos.edad} años</p>
      <p><span class="label-resumen">Condición Médica:</span> ${datos.condicion}</p>
      <p><span class="label-resumen">Alergias:</span> ${datos.alergias}</p>
      <p><span class="label-resumen">Vacunación:</span> ${datos.vacunacion}</p>
      <p><span class="label-resumen">Comportamiento:</span> ${datos.reactividad}</p>
      <p><span class="label-resumen">Alerta prestador:</span> ${datos.alertaDueño}</p>
    `;

    vistaDueno.classList.add("hidden");
    resumenPantalla.classList.remove("hidden");

    if (estado === "finalizada") {
      // Si la ficha está finalizada, mostramos solo "Editar"
      btnFinalizar.classList.add("hidden");
      btnEditar.classList.remove("hidden");
      tituloResumen.textContent = "Ficha Finalizada";
      subtituloResumen.textContent = "Los datos de tu mascota están guardados.";
    } else {
      // Si está en revisión, mostramos solo "Aceptar y Finalizar"
      btnFinalizar.classList.remove("hidden");
      btnEditar.classList.add("hidden");
      tituloResumen.textContent = "Revisión de Ficha";
      subtituloResumen.textContent =
        "Revisa que todo esté correcto antes de finalizar.";
    }
  };

  // Verificamos el estado al cargar la página (por si el dueño vuelve a entrar)
  const estadoFicha = localStorage.getItem("estadoFicha");
  const datosGuardados = JSON.parse(localStorage.getItem("datosMascota"));

  if (datosGuardados && estadoFicha === "finalizada") {
    mostrarResumen(datosGuardados, "finalizada");
  }

  // Evento al enviar el formulario (Click en "Guardar Ficha" o "Edición finalizada")
  healthForm.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const tipoVacunacion = document.getElementById("vacunacion").value;
    const detalleVacunacion = document.querySelector(
      'textarea[name="vacunacion-detalle"]',
    ).value;
    const vacunacionFinal = detalleVacunacion
      ? `${tipoVacunacion} - ${detalleVacunacion}`
      : tipoVacunacion;

    const alertaIngresada = document.getElementById("alerta-general").value;
    const alertaFinal =
      alertaIngresada.trim() === ""
        ? "Ninguna indicación particular."
        : alertaIngresada;

    const datosMascota = {
      raza: document.getElementById("raza").value,
      edad: document.getElementById("edad").value,
      condicion: document.getElementById("condicion").value,
      alergias: document.getElementById("alergias").value,
      vacunacion: vacunacionFinal,
      reactividad: document.getElementById("reactividad").value,
      alertaDueño: alertaFinal,
    };

    localStorage.setItem("datosMascota", JSON.stringify(datosMascota));

    if (modoEdicion) {
      // Si venía de editar, se finaliza automáticamente
      localStorage.setItem("estadoFicha", "finalizada");
      mostrarResumen(datosMascota, "finalizada");
      modoEdicion = false; // reseteamos la variable
    } else {
      // Si es la primera vez, se pone en estado de revisión
      localStorage.setItem("estadoFicha", "revision");
      mostrarResumen(datosMascota, "revision");
    }
  });

  // Evento "Aceptar y Finalizar" (ocurre la primera vez)
  btnFinalizar.addEventListener("click", () => {
    localStorage.setItem("estadoFicha", "finalizada");

    // Oculta el de finalizar y muestra el de editar
    btnFinalizar.classList.add("hidden");
    btnEditar.classList.remove("hidden");

    tituloResumen.textContent = "¡Ficha Finalizada con éxito!";
    subtituloResumen.textContent = "Ya puedes salir de esta pantalla.";
  });

  // Evento "Editar Ficha" (ocurre cuando la ficha ya estaba finalizada)
  btnEditar.addEventListener("click", () => {
    modoEdicion = true;
    const datosActuales = JSON.parse(localStorage.getItem("datosMascota"));

    if (datosActuales) {
      document.getElementById("raza").value = datosActuales.raza;
      document.getElementById("edad").value = datosActuales.edad;
      document.getElementById("condicion").value = datosActuales.condicion;
      document.getElementById("alergias").value = datosActuales.alergias;

      if (datosActuales.vacunacion.includes(" - ")) {
        const partes = datosActuales.vacunacion.split(" - ");
        document.getElementById("vacunacion").value = partes[0];
        document.querySelector('textarea[name="vacunacion-detalle"]').value =
          partes[1];
      } else {
        document.getElementById("vacunacion").value = datosActuales.vacunacion;
        document.querySelector('textarea[name="vacunacion-detalle"]').value =
          "";
      }

      document.getElementById("reactividad").value = datosActuales.reactividad;

      if (datosActuales.alertaDueño !== "Ninguna indicación particular.") {
        document.getElementById("alerta-general").value =
          datosActuales.alertaDueño;
      } else {
        document.getElementById("alerta-general").value = "";
      }
    }

    // Cambiamos el texto del botón al modo de edición como pediste
    btnSubmitForm.textContent = "Edición finalizada";

    // Ocultamos el resumen y mostramos el formulario
    resumenPantalla.classList.add("hidden");
    vistaDueno.classList.remove("hidden");
  });
});
