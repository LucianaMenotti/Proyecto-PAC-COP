(() => {
  const form = document.getElementById("formRecuperar");
  const mensaje = document.getElementById("mensaje");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const boton = form.querySelector('button[type="submit"]');

    if (boton) boton.disabled = true;

    try {
      const respuesta = await fetch("/api/users/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const datos = await respuesta.json();

      if (mensaje) {
        mensaje.className = `alert ${respuesta.ok ? "alert-success" : "alert-danger"}`;
        mensaje.textContent =
          datos.mensaje || "No se pudo procesar la solicitud.";

        // En desarrollo, si no hay SMTP configurado, el backend devuelve el
        // enlace para poder probar el flujo sin correo real.
        if (respuesta.ok && datos.enlace) {
          const bloque = document.createElement("span");
          bloque.className = "d-block small mt-2";

          const salto = document.createElement("br");
          const etiqueta = document.createElement("span");
          etiqueta.textContent = "Enlace de prueba: ";

          const enlace = document.createElement("a");
          enlace.href = datos.enlace;
          enlace.textContent = datos.enlace;

          bloque.append(salto, etiqueta, enlace);
          mensaje.appendChild(bloque);
        }
      }

      if (respuesta.ok) form.reset();
    } catch {
      if (mensaje) {
        mensaje.className = "alert alert-danger";
        mensaje.textContent = "No se pudo procesar la solicitud.";
      }
    } finally {
      if (boton) boton.disabled = false;
    }
  });
})();
