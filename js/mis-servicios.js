const ESTADOS = {
  programado: { texto: "Pendiente de confirmación", clase: "text-bg-warning", icono: "bi-hourglass-split" },
  aceptado: { texto: "Aceptada", clase: "text-bg-info", icono: "bi-check2-circle" },
  "en-curso": { texto: "En curso", clase: "text-bg-primary", icono: "bi-truck" },
  finalizado: { texto: "Finalizada", clase: "text-bg-success", icono: "bi-flag-fill" },
  cancelado: { texto: "Cancelada", clase: "text-bg-secondary", icono: "bi-x-circle" },
  rechazado: { texto: "Rechazada por el prestador", clase: "text-bg-danger", icono: "bi-slash-circle" },
};

const contenedor = document.getElementById("reservas");
const filtroEstado = document.getElementById("filtroEstado");
const alerta = document.getElementById("alerta");
const cerrarSesion = document.getElementById("cerrarSesion");

const usuario = await window.PacCopAuth.requireSession();

let reservas = [];
let reservaACancelar = null;
let modalCancelar = null;
let reservaACalificar = null;
let modalCalificar = null;

const escapar = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatearFecha = (valor) =>
  valor
    ? new Date(valor).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
    : "Sin definir";

const formatearMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

function mostrarAlerta(mensaje, tipo = "success") {
  alerta.className = `alert alert-${tipo}`;
  alerta.textContent = mensaje;
  alerta.classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function accionesDe(reserva) {
  const botones = [];

  if (reserva.estado === "programado") {
    botones.push(`
      <a class="btn btn-primary btn-sm rounded-pill"
         href="../pagos/pago.html?servicio=${reserva.id}">
        <i class="bi bi-credit-card me-1"></i> Pagar
      </a>`);
  }

  if (["programado", "aceptado"].includes(reserva.estado)) {
    botones.push(`
      <button type="button" class="btn btn-outline-danger btn-sm rounded-pill"
              data-cancelar="${reserva.id}">
        <i class="bi bi-x-circle me-1"></i> Cancelar
      </button>`);
  }

  if (["aceptado", "en-curso"].includes(reserva.estado)) {
    botones.push(`
      <a class="btn btn-outline-success btn-sm rounded-pill"
         href="../prestadordeServicio/chatApp.html?servicioId=${reserva.id}">
        <i class="bi bi-chat-dots me-1"></i> Chat
      </a>`);
  }

  if (reserva.estado === "en-curso") {
    botones.push(`
      <a class="btn btn-outline-primary btn-sm rounded-pill"
         href="../seguimiento gps en tiempo real/seguimiento.html?servicio=${reserva.id}">
        <i class="bi bi-geo-alt me-1"></i> Ver seguimiento
      </a>`);
  }

  if (reserva.estado === "finalizado") {
    botones.push(`
      <button type="button" class="btn btn-primary btn-sm rounded-pill"
              data-calificar="${reserva.id}">
        <i class="bi bi-star me-1"></i> Calificar
      </button>`);
  }

  return botones.join(" ");
}

function tarjetaDe(reserva) {
  const estado = ESTADOS[reserva.estado] || {
    texto: reserva.estado,
    clase: "text-bg-secondary",
    icono: "bi-circle",
  };

  const reembolso =
    reserva.estado === "cancelado" && reserva.reembolso !== null
      ? `<span class="badge ${reserva.reembolso ? "text-bg-success" : "text-bg-secondary"} ms-1">
           ${reserva.reembolso ? "Con reembolso" : "Sin reembolso"}
         </span>`
      : "";

  const motivo = reserva.motivoCancelacion
    ? `<p class="text-secondary small mb-0"><strong>Motivo:</strong> ${escapar(reserva.motivoCancelacion)}</p>`
    : "";

  return `
    <div class="col-md-6 col-lg-4">
      <div class="card reserva-card h-100 shadow-sm rounded-4">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="badge ${estado.clase}">
              <i class="bi ${estado.icono} me-1"></i>${estado.texto}
            </span>
            <span class="text-secondary small">#${reserva.id}</span>
          </div>

          <h2 class="h5 fw-bold mb-1">${escapar(reserva.tipo)}</h2>
          <p class="text-secondary small mb-2">
            <i class="bi bi-person-badge me-1"></i>${escapar(reserva.prestador || "Prestador a asignar")}
          </p>

          <ul class="list-unstyled small mb-3">
            <li class="mb-1"><i class="bi bi-heart-fill text-accent me-1"></i>${escapar(reserva.mascota)}</li>
            <li class="mb-1"><i class="bi bi-calendar-event me-1"></i>${formatearFecha(reserva.horaProgramada)}</li>
            ${reserva.origen ? `<li class="mb-1"><i class="bi bi-geo me-1"></i>${escapar(reserva.origen)} → ${escapar(reserva.destino)}</li>` : ""}
            ${reserva.servicioVueltaId ? `<li class="mb-1"><i class="bi bi-arrow-repeat me-1"></i>${reserva.motivoTraslado === "vuelta" ? "Vuelta de la reserva" : "Incluye la vuelta"} #${reserva.servicioVueltaId}</li>` : ""}
            <li class="mb-1"><i class="bi bi-cash-coin me-1"></i>${formatearMonto(reserva.monto)}</li>
          </ul>

          ${motivo}

          <div class="mt-auto d-flex flex-wrap gap-2 pt-2">
            ${accionesDe(reserva)}
          </div>
        </div>
      </div>
    </div>`;
}

function renderizar() {
  const estado = filtroEstado.value;
  const lista = estado ? reservas.filter((r) => r.estado === estado) : reservas;

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="col-12 text-center text-secondary py-5">
        <i class="bi bi-calendar-x fs-1 d-block mb-3"></i>
        No hay reservas para mostrar.
      </div>`;
    return;
  }

  contenedor.innerHTML = lista.map(tarjetaDe).join("");
}

async function cargarReservas() {
  try {
    const respuesta = await fetch("/api/servicios", { credentials: "include" });
    if (!respuesta.ok) throw new Error("No se pudieron cargar las reservas");

    const datos = await respuesta.json();
    reservas = datos.servicios || [];
    renderizar();
  } catch (error) {
    contenedor.innerHTML = `
      <div class="col-12"><div class="alert alert-danger">${escapar(error.message)}</div></div>`;
  }
}

function abrirCancelar(id) {
  reservaACancelar = reservas.find((r) => r.id === id) || null;
  document.getElementById("motivoCancelacion").value = "";
  document.getElementById("errorCancelar").classList.add("d-none");

  if (!modalCancelar) {
    modalCancelar = new bootstrap.Modal(document.getElementById("modalCancelar"));
  }
  modalCancelar.show();
}

async function confirmarCancelar() {
  if (!reservaACancelar) return;

  const error = document.getElementById("errorCancelar");
  const boton = document.getElementById("confirmarCancelar");
  boton.disabled = true;

  try {
    const respuesta = await fetch(`/api/servicios/${reservaACancelar.id}/cancelar`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        motivo: document.getElementById("motivoCancelacion").value.trim(),
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      error.textContent = resultado.mensaje || "No se pudo cancelar la reserva";
      error.classList.remove("d-none");
      return;
    }

    modalCancelar.hide();
    await cargarReservas();
    mostrarAlerta(resultado.mensaje || "Reserva cancelada", "warning");
  } catch (err) {
    error.textContent = "No se pudo cancelar la reserva";
    error.classList.remove("d-none");
  } finally {
    boton.disabled = false;
  }
}

function abrirCalificar(id) {
  reservaACalificar = reservas.find((r) => r.id === id) || null;
  document.getElementById("puntuacion").value = "5";
  document.getElementById("comentarioResena").value = "";
  document.getElementById("errorCalificar").classList.add("d-none");

  if (!modalCalificar) {
    modalCalificar = new bootstrap.Modal(document.getElementById("modalCalificar"));
  }
  modalCalificar.show();
}

async function confirmarCalificar() {
  if (!reservaACalificar) return;

  const error = document.getElementById("errorCalificar");
  const boton = document.getElementById("confirmarCalificar");
  boton.disabled = true;

  try {
    const respuesta = await fetch(`/api/servicios/${reservaACalificar.id}/calificacion`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puntuacion: Number(document.getElementById("puntuacion").value),
        comentario: document.getElementById("comentarioResena").value.trim(),
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      error.textContent = resultado.mensaje || "No se pudo enviar la reseña";
      error.classList.remove("d-none");
      return;
    }

    modalCalificar.hide();
    mostrarAlerta("¡Gracias por tu reseña!", "success");
  } catch (err) {
    error.textContent = "No se pudo enviar la reseña";
    error.classList.remove("d-none");
  } finally {
    boton.disabled = false;
  }
}

contenedor.addEventListener("click", (event) => {
  const cancelar = event.target.closest("[data-cancelar]");
  if (cancelar) abrirCancelar(Number(cancelar.dataset.cancelar));

  const calificar = event.target.closest("[data-calificar]");
  if (calificar) abrirCalificar(Number(calificar.dataset.calificar));
});

filtroEstado.addEventListener("change", renderizar);
document.getElementById("confirmarCancelar").addEventListener("click", confirmarCancelar);
document.getElementById("confirmarCalificar").addEventListener("click", confirmarCalificar);
cerrarSesion.addEventListener("click", () => window.PacCopAuth.logout());

if (usuario) await cargarReservas();
