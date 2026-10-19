(() => {
  const form = document.getElementById("formRestablecer");
  const mensaje = document.getElementById("mensaje");
  const token = new URLSearchParams(window.location.search).get("token") || "";

  if (!form) return;

  if (!token && mensaje) {
    mensaje.className = "alert alert-danger";
    mensaje.textContent = "El enlace no es válido o está incompleto.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmar").value;
    const boton = form.querySelector('button[type="submit"]');

    if (password !== confirmar) {
      mensaje.className = "alert alert-danger";
      mensaje.textContent = "Las contraseñas no coinciden.";
      return;
    }

    if (boton) boton.disabled = true;

    try {
      const respuesta = await fetch("/api/users/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo restablecer la contraseña");
      }

      mensaje.className = "alert alert-success";
      mensaje.textContent = `${datos.mensaje}. Ya podés iniciar sesión.`;
      form.reset();
    } catch (error) {
      mensaje.className = "alert alert-danger";
      mensaje.textContent = error.message;
      if (boton) boton.disabled = false;
    }
  });
})();
