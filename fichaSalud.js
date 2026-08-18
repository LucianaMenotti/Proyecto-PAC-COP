document
  .getElementById("health-form")
  .addEventListener("submit", function (evento) {
    // Evitamos que la página se recargue
    evento.preventDefault();

    // Capturamos los elementos del DOM
    const alertasSeleccionadas = document.querySelectorAll(
      'input[name="alertas"]:checked',
    );
    const headerAlertas = document.getElementById("header-alertas");
    const listaAlertas = document.getElementById("lista-alertas");
    const resumenDatos = document.getElementById("resumen-datos");

    // Limpiamos los datos previos
    listaAlertas.innerHTML = "";
    resumenDatos.innerHTML = "";

    // Lógica Condicional para las Alertas
    if (alertasSeleccionadas.length > 0) {
      headerAlertas.style.display = "flex";

      alertasSeleccionadas.forEach(function (checkbox) {
        const li = document.createElement("li");
        li.textContent = checkbox.value;
        listaAlertas.appendChild(li);
      });
    } else {
      headerAlertas.style.display = "none";
      document.getElementById("vista-prestador").style.paddingTop = "20px";
    }

    // Trasladar los datos del formulario al resumen
    resumenDatos.innerHTML = `
        <li><strong>Raza:</strong> ${document.getElementById("raza").value}</li>
        <li><strong>Edad:</strong> ${document.getElementById("edad").value} años</li>
        <li><strong>Condición Médica:</strong> ${document.getElementById("condicion").value}</li>
        <li><strong>Alergias:</strong> ${document.getElementById("alergias").value}</li>
        <li><strong>Vacunación:</strong> ${document.getElementById("vacunacion").value}</li>
        <li><strong>Reactividad:</strong> ${document.getElementById("reactividad").value}</li>
    `;

    // Cambiar de vista
    document.getElementById("vista-dueno").style.display = "none";
    document.getElementById("vista-prestador").style.display = "block";

    // Volver arriba
    window.scrollTo(0, 0);
  });
