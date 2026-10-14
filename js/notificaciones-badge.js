export async function cargarContadorNotificaciones() {
  const contadores = document.querySelectorAll(
    "[data-contador-notificaciones]",
  );

  if (contadores.length === 0) {
    return;
  }

  try {
    const respuesta = await fetch("/api/notificaciones", {
      credentials: "include",
    });

    if (!respuesta.ok) {
      return;
    }

    const { noLeidas } = await respuesta.json();

    contadores.forEach((contador) => {
      contador.textContent = noLeidas;
      contador.classList.toggle("d-none", noLeidas === 0);
    });
  } catch (error) {
    console.error("Error al cargar el contador de notificaciones:", error);
  }
}
