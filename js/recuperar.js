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
