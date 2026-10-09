const DIAS = [
  { clave: "lunes", etiqueta: "Lunes" },
  { clave: "martes", etiqueta: "Martes" },
  { clave: "miercoles", etiqueta: "Miércoles" },
  { clave: "jueves", etiqueta: "Jueves" },
  { clave: "viernes", etiqueta: "Viernes" },
  { clave: "sabado", etiqueta: "Sábado" },
  { clave: "domingo", etiqueta: "Domingo" },
];

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
    : "Sin fecha";

function crearTab(id, numero, titulo) {
  const panelTabs = document.getElementById("panelTabs");
  const item = document.createElement("li");
  item.className = "nav-item";
  item.setAttribute("role", "presentation");
  item.innerHTML = `
    <button class="nav-link" id="tab-${id}" data-bs-toggle="tab"
            data-bs-target="#${id}" type="button" role="tab">
      <span>${numero}</span> ${titulo}
    </button>`;
  panelTabs.appendChild(item);

  const pane = document.createElement("section");
  pane.className = "tab-pane fade";
  pane.id = id;
  pane.setAttribute("role", "tabpanel");
  pane.setAttribute("aria-labelledby", `tab-${id}`);
  document.querySelector(".tab-content").appendChild(pane);

  return pane;
}

/* ---------------------------------------------------------- */
/* Solicitudes                                                 */
/* ---------------------------------------------------------- */

const paneSolicitudes = crearTab("solicitudes", "05", "Solicitudes");
paneSolicitudes.innerHTML = `
  <div class="panel-section-header mb-4">
    <h2 class="fw-bold">Reservas por confirmar</h2>
    <p class="text-secondary mb-0">Aceptá o rechazá las reservas que te llegaron.</p>
  </div>
  <div id="listaSolicitudes" class="d-grid gap-3"></div>`;

const listaSolicitudes = paneSolicitudes.querySelector("#listaSolicitudes");

async function cargarSolicitudes() {
  listaSolicitudes.innerHTML = `<p class="text-secondary">Cargando solicitudes...</p>`;

  try {
    const respuesta = await fetch("/api/servicios", { credentials: "include" });
    if (!respuesta.ok) throw new Error("No se pudieron cargar las solicitudes");

    const { servicios } = await respuesta.json();
    const pendientes = (servicios || []).filter((s) => s.estado === "programado");

    if (pendientes.length === 0) {
      listaSolicitudes.innerHTML = `
        <div class="alert alert-info mb-0">No tenés solicitudes pendientes.</div>`;
      return;
    }

    listaSolicitudes.innerHTML = pendientes
      .map(
        (s) => `
      <div class="card panel-card">
        <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 class="h6 fw-bold mb-1">${escapar(s.tipo)} · ${escapar(s.mascota)}</h3>
            <p class="text-secondary small mb-0">
              <i class="bi bi-calendar-event me-1"></i>${formatearFecha(s.horaProgramada)}
              · <i class="bi bi-cash-coin me-1"></i>$${Number(s.monto).toLocaleString("es-AR")}
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-pac btn-sm" data-accion="aceptar" data-id="${s.id}">Aceptar</button>
            <button class="btn btn-outline-danger btn-sm" data-accion="rechazar" data-id="${s.id}">Rechazar</button>
          </div>
        </div>
      </div>`,
      )
      .join("");
  } catch (error) {
    listaSolicitudes.innerHTML = `<div class="alert alert-danger mb-0">${escapar(error.message)}</div>`;
  }
}

listaSolicitudes.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-accion]");
  if (!boton) return;

  boton.disabled = true;

  try {
    const respuesta = await fetch(`/api/servicios/${boton.dataset.id}/${boton.dataset.accion}`, {
      method: "POST",
      credentials: "include",
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo completar la acción");
    await cargarSolicitudes();
  } catch (error) {
    alert(error.message);
    boton.disabled = false;
  }
});

/* ---------------------------------------------------------- */
/* Disponibilidad                                              */
/* ---------------------------------------------------------- */

const paneDisponibilidad = crearTab("disponibilidad", "06", "Disponibilidad");
paneDisponibilidad.innerHTML = `
  <div class="panel-section-header mb-4">
    <h2 class="fw-bold">Tu disponibilidad semanal</h2>
    <p class="text-secondary mb-0">
      Definí los días y horarios en que aceptás reservas. Si no cargás nada, se aceptan todas.
    </p>
  </div>
  <div class="card panel-card">
    <div class="card-body p-4">
      <div id="formDisponibilidad" class="d-grid gap-3"></div>
      <div class="d-flex align-items-center gap-3 mt-4">
        <button class="btn btn-pac" id="guardarDisponibilidad">Guardar disponibilidad</button>
        <span class="text-success small d-none" id="okDisponibilidad">Disponibilidad guardada.</span>
      </div>
    </div>
  </div>`;

const formDisponibilidad = paneDisponibilidad.querySelector("#formDisponibilidad");
let disponibilidadActual = {};

function renderizarDisponibilidad() {
  formDisponibilidad.innerHTML = DIAS.map(({ clave, etiqueta }) => {
    const regla = disponibilidadActual[clave] || { activo: false, desde: "09:00", hasta: "18:00" };
    return `
      <div class="row align-items-center g-2 border-bottom pb-2">
        <div class="col-12 col-md-4">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="activo-${clave}"
                   data-dia="${clave}" ${regla.activo ? "checked" : ""}>
            <label class="form-check-label fw-semibold" for="activo-${clave}">${etiqueta}</label>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label small mb-0" for="desde-${clave}">Desde</label>
          <input type="time" class="form-control" id="desde-${clave}" value="${regla.desde}">
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label small mb-0" for="hasta-${clave}">Hasta</label>
          <input type="time" class="form-control" id="hasta-${clave}" value="${regla.hasta}">
        </div>
      </div>`;
  }).join("");
}

async function guardarDisponibilidad() {
  const ok = paneDisponibilidad.querySelector("#okDisponibilidad");
  ok.classList.add("d-none");

  const disponibilidad = {};

  DIAS.forEach(({ clave }) => {
    disponibilidad[clave] = {
      activo: paneDisponibilidad.querySelector(`#activo-${clave}`).checked,
      desde: paneDisponibilidad.querySelector(`#desde-${clave}`).value,
      hasta: paneDisponibilidad.querySelector(`#hasta-${clave}`).value,
    };
  });

  try {
    const respuesta = await fetch("/api/users/me/disponibilidad", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponibilidad }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo guardar");
    disponibilidadActual = resultado.disponibilidad || disponibilidad;
    ok.classList.remove("d-none");
  } catch (error) {
    alert(error.message);
  }
}

paneDisponibilidad.querySelector("#guardarDisponibilidad").addEventListener("click", guardarDisponibilidad);

/* ---------------------------------------------------------- */
/* Restricciones                                               */
/* ---------------------------------------------------------- */

const TAMANOS_MASCOTA = ["pequeño", "mediano", "grande"];

const paneRestricciones = crearTab("restricciones", "07", "Restricciones");
paneRestricciones.innerHTML = `
  <div class="panel-section-header mb-4">
    <h2 class="fw-bold">Qué mascotas aceptás</h2>
    <p class="text-secondary mb-0">
      Si no marcás tamaños, aceptás mascotas de cualquier tamaño.
    </p>
  </div>
  <div class="card panel-card">
    <div class="card-body p-4">
      <h5 class="fw-bold mb-3">Tamaños aceptados</h5>
      <div class="d-flex flex-wrap gap-3 mb-4" id="tamanosChecks"></div>

      <div class="mb-3">
        <label class="form-label fw-semibold" for="razasExcluidas">Razas que NO aceptás</label>
        <input type="text" class="form-control" id="razasExcluidas"
               placeholder="Ej: pitbull, rottweiler" autocomplete="off">
        <div class="form-text">Separalas con comas. Se comparan en minúsculas.</div>
      </div>

      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-pac" id="guardarRestricciones">Guardar restricciones</button>
        <span class="text-success small d-none" id="okRestricciones">Restricciones guardadas.</span>
      </div>
    </div>
  </div>`;

const chequeosTamanos = paneRestricciones.querySelector("#tamanosChecks");
const razasExcluidas = paneRestricciones.querySelector("#razasExcluidas");

function renderizarRestricciones() {
  const aceptados = Array.isArray(sesion.tamanosAceptados)
    ? sesion.tamanosAceptados
    : [];

  chequeosTamanos.innerHTML = TAMANOS_MASCOTA.map(
    (tamano) => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${tamano}"
               id="tamano-${tamano}" ${aceptados.includes(tamano) ? "checked" : ""}>
        <label class="form-check-label" for="tamano-${tamano}">
          ${tamano.charAt(0).toUpperCase()}${tamano.slice(1)}
        </label>
      </div>`,
  ).join("");

  razasExcluidas.value = Array.isArray(sesion.restricciones)
    ? sesion.restricciones.join(", ")
    : "";
}

async function guardarRestricciones() {
  const ok = paneRestricciones.querySelector("#okRestricciones");
  ok.classList.add("d-none");

  const tamanosAceptados = TAMANOS_MASCOTA.filter(
    (tamano) => paneRestricciones.querySelector(`#tamano-${tamano}`).checked,
  );
  const restricciones = razasExcluidas.value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  try {
    const respuesta = await fetch("/api/users/me/restricciones", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tamanosAceptados, restricciones }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo guardar");
    sesion.tamanosAceptados = tamanosAceptados;
    sesion.restricciones = restricciones;
    ok.classList.remove("d-none");
  } catch (error) {
    alert(error.message);
  }
}

paneRestricciones.querySelector("#guardarRestricciones").addEventListener("click", guardarRestricciones);

/* ---------------------------------------------------------- */
/* Inicialización                                              */
/* ---------------------------------------------------------- */

const sesion = await window.PacCopAuth.getCurrentSession();

if (sesion) {
  disponibilidadActual =
    sesion.disponibilidad && typeof sesion.disponibilidad === "object"
      ? sesion.disponibilidad
      : {};
  renderizarDisponibilidad();
  renderizarRestricciones();
}

cargarSolicitudes();
