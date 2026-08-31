document.addEventListener("DOMContentLoaded", () => {
  const btnEmergency = document.getElementById("btn-emergency");
  const modal = document.getElementById("emergency-modal");
  const btnClose = document.getElementById("btn-close");
  const locationDisplay = document.getElementById("location-display");
  const btnNotify = document.getElementById("btn-notify");
  const statusMsg = document.getElementById("notification-status");

  // Abrir Modal y obtener ubicación
  btnEmergency.addEventListener("click", () => {
    modal.classList.remove("hidden");
    statusMsg.textContent = ""; // Limpiar mensajes anteriores
    
    // Reiniciar el estado del botón de notificación por si se había usado antes
    btnNotify.disabled = false;
    btnNotify.textContent = "⚠️ Enviar Alerta Prioritaria al Dueño";
    
    getLocation();
  });

  // Cerrar Modal
  btnClose.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Cerrar modal si se hace clic fuera del contenido (en el overlay oscuro)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  // Obtener ubicación en tiempo real
  function getLocation() {
    if (navigator.geolocation) {
      locationDisplay.textContent = "Obteniendo coordenadas GPS...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Muestra las coordenadas y genera un link a Google Maps usando el color primary del CSS
          locationDisplay.innerHTML = `
            Lat: ${lat.toFixed(5)} <br>
            Lon: ${lon.toFixed(5)} <br><br>
            <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">📍 Ver en Google Maps</a>
          `;
        },
        (error) => {
          locationDisplay.textContent =
            "Error al obtener la ubicación. Verifique los permisos del navegador.";
          locationDisplay.style.color = "var(--alert-main)";
        },
        { enableHighAccuracy: true } // Solicita la mejor precisión posible
      );
    } else {
      locationDisplay.textContent =
        "La geolocalización no es soportada por este navegador.";
    }
  }

  // Simular envío de SMS y notificación prioritaria
  btnNotify.addEventListener("click", () => {
    // Simulación de carga
    btnNotify.disabled = true;
    btnNotify.textContent = "Enviando alerta...";
    statusMsg.textContent = "";

    setTimeout(() => {
      btnNotify.textContent = "✔️ Alerta Enviada";
      statusMsg.textContent = "Se ha notificado al dueño exitosamente.";
      statusMsg.style.color = "var(--success-text)"; // Usa el verde definido en CSS
    }, 1500); // Simula 1.5 segundos de retraso de red
  });
});