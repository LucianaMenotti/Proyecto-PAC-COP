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
/* Cuenta de cobro y liquidaciones                             */
/* ---------------------------------------------------------- */

const paneCuenta = crearTab("cuenta", "08", "Cuenta de cobro");
paneCuenta.innerHTML = `
  <div class="row g-4">
    <div class="col-lg-6">
      <div class="card panel-card">
        <div class="card-body p-4">
          <h5 class="fw-bold mb-1">¿Dónde cobramos?</h5>
          <p class="text-secondary small mb-3">Los pagos liberados se transfieren a esta cuenta.</p>

          <form id="formCuentaCobro" class="d-grid gap-3">
            <div>
              <label class="form-label" for="cuentaTipo">Tipo de cuenta</label>
              <select id="cuentaTipo" class="form-select">
                <option value="banco">Cuenta bancaria</option>
                <option value="billetera">Billetera virtual</option>
              </select>
            </div>
            <div>
              <label class="form-label" for="cuentaTitular">Titular</label>
              <input type="text" id="cuentaTitular" class="form-control" autocomplete="off">
            </div>
            <div>
              <label class="form-label" for="cuentaCbu">CBU</label>
              <input type="text" id="cuentaCbu" class="form-control" autocomplete="off" placeholder="22 dígitos">
            </div>
            <div>
              <label class="form-label" for="cuentaAlias">Alias (opcional)</label>
              <input type="text" id="cuentaAlias" class="form-control" autocomplete="off">
            </div>
            <div class="d-flex align-items-center gap-3">
              <button type="button" class="btn btn-pac" id="guardarCuenta">Guardar cuenta</button>
              <span class="text-success small d-none" id="okCuenta">Cuenta guardada.</span>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="card panel-card">
        <div class="card-body p-4">
          <h5 class="fw-bold mb-1">Tus liquidaciones</h5>
          <p class="text-secondary small mb-3">Pagos liberados al finalizar cada servicio.</p>
          <p class="fw-bold fs-3 text-success mb-1" id="totalLiquidado">$0</p>
          <div id="listaLiquidaciones" class="d-grid gap-2 mt-3"></div>
        </div>
      </div>
    </div>
  </div>`;

const cuentaTipo = paneCuenta.querySelector("#cuentaTipo");
const cuentaTitular = paneCuenta.querySelector("#cuentaTitular");
const cuentaCbu = paneCuenta.querySelector("#cuentaCbu");
const cuentaAlias = paneCuenta.querySelector("#cuentaAlias");

function mostrarCuenta() {
  const cuenta = sesion.cuentaCobro;
  if (!cuenta) return;
  cuentaTipo.value = cuenta.tipo || "banco";
  cuentaTitular.value = cuenta.titular || "";
  cuentaCbu.value = cuenta.cbu || "";
  cuentaAlias.value = cuenta.alias || "";
}

async function guardarCuenta() {
  const ok = paneCuenta.querySelector("#okCuenta");
  ok.classList.add("d-none");

  try {
    const respuesta = await fetch("/api/users/me/cuenta-cobro", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: cuentaTipo.value,
        titular: cuentaTitular.value.trim(),
        cbu: cuentaCbu.value.trim(),
        alias: cuentaAlias.value.trim(),
      }),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo guardar");
    sesion.cuentaCobro = resultado.cuentaCobro;
    ok.classList.remove("d-none");
  } catch (error) {
    alert(error.message);
  }
}

async function cargarLiquidaciones() {
  const contenedor = paneCuenta.querySelector("#listaLiquidaciones");
  const totalEl = paneCuenta.querySelector("#totalLiquidado");
  contenedor.innerHTML = `<p class="text-secondary mb-0">Cargando liquidaciones...</p>`;

  try {
    const respuesta = await fetch("/api/pagos/liquidaciones", { credentials: "include" });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudieron cargar");

    totalEl.textContent = `$${Number(datos.total || 0).toLocaleString("es-AR")}`;

    const pagos = datos.pagos || [];

    if (pagos.length === 0) {
      contenedor.innerHTML = `<p class="text-secondary mb-0">Todavía no hay pagos liberados.</p>`;
      return;
    }

    contenedor.innerHTML = pagos
      .map(
        (pago) => `
      <div class="border-bottom pb-2">
        <div class="d-flex justify-content-between">
          <span>Reserva #${pago.servicioId}</span>
          <strong>$${Number(pago.monto).toLocaleString("es-AR")}</strong>
        </div>
        <small class="text-secondary">${new Date(pago.liberadoEn).toLocaleString("es-AR")}</small>
      </div>`,
      )
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="text-danger mb-0">${escapar(error.message)}</p>`;
  }
}

paneCuenta.querySelector("#guardarCuenta").addEventListener("click", guardarCuenta);

/* ---------------------------------------------------------- */
/* Guardería: check-in y check-out                             */
/* ---------------------------------------------------------- */

const paneGuarderia = crearTab("guarderia", "09", "Guardería");
paneGuarderia.innerHTML = `
  <div class="panel-section-header mb-4">
    <h2 class="fw-bold">Check-in y check-out</h2>
    <p class="text-secondary mb-0">Registrá el ingreso y el egreso de cada mascota.</p>
  </div>
  <div id="listaGuarderia" class="d-grid gap-3"></div>`;

const listaGuarderia = paneGuarderia.querySelector("#listaGuarderia");

async function cargarGuarderia() {
  listaGuarderia.innerHTML = `<p class="text-secondary">Cargando guarderías...</p>`;

  try {
    const respuesta = await fetch("/api/servicios", { credentials: "include" });
    const { servicios } = await respuesta.json();
    const activas = (servicios || []).filter(
      (s) => s.tipo === "Guarderia" && ["aceptado", "en-curso"].includes(s.estado),
    );

    if (activas.length === 0) {
      listaGuarderia.innerHTML = `<div class="alert alert-info mb-0">No tenés guarderías activas.</div>`;
      return;
    }

    listaGuarderia.innerHTML = activas
      .map((s) => {
        const puedeCheckIn = !s.checkIn;
        const puedeCheckOut = s.checkIn && !s.checkOut;

        return `
      <div class="card panel-card">
        <div class="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h3 class="h6 fw-bold mb-1">${escapar(s.mascota)}</h3>
            <p class="text-secondary small mb-2">Programado · ${formatearFecha(s.horaProgramada)}</p>
            ${s.checkIn ? `<span class="badge text-bg-success me-1"><i class="bi bi-box-arrow-in-down"></i> Ingreso ${formatearFecha(s.checkIn)}</span>` : ""}
            ${s.checkOut ? `<span class="badge text-bg-secondary"><i class="bi bi-box-arrow-up"></i> Egreso ${formatearFecha(s.checkOut)}</span>` : ""}
          </div>
          <div class="d-flex gap-2">
            ${puedeCheckIn ? `<button class="btn btn-pac btn-sm" data-guarderia="check-in" data-id="${s.id}">Registrar ingreso</button>` : ""}
            ${puedeCheckOut ? `<button class="btn btn-outline-primary btn-sm" data-guarderia="check-out" data-id="${s.id}">Registrar egreso</button>` : ""}
            ${!puedeCheckIn && !puedeCheckOut ? `<span class="text-secondary small">Completo</span>` : ""}
          </div>
        </div>
      </div>`;
      })
      .join("");
  } catch (error) {
    listaGuarderia.innerHTML = `<div class="alert alert-danger mb-0">${escapar(error.message)}</div>`;
  }
}

listaGuarderia.addEventListener("click", async (event) => {
  const boton = event.target.closest("[data-guarderia]");
  if (!boton) return;

  boton.disabled = true;

  try {
    const respuesta = await fetch(`/api/servicios/${boton.dataset.id}/${boton.dataset.guarderia}`, {
      method: "POST",
      credentials: "include",
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo registrar");
    await cargarGuarderia();
  } catch (error) {
    alert(error.message);
    boton.disabled = false;
  }
});

/* ---------------------------------------------------------- */
/* Ruta de hoy                                                 */
/* ---------------------------------------------------------- */

async function cargarRutaHoy() {
  const contenedor = document.getElementById("listaRuta");
  if (!contenedor) return;

  try {
    const respuesta = await fetch("/api/servicios/prestador/ruta", { credentials: "include" });
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudo calcular la ruta");

    const recorridos = datos.recorridos || [];

    if (recorridos.length === 0) {
      contenedor.innerHTML = `<p class="text-secondary mb-0">No tenés servicios para hoy.</p>`;
      return;
    }

    const ahora = new Date();

    contenedor.innerHTML = recorridos
      .map((ruta, indice) => {
        const salida = new Date(ruta.salidaSugerida);
        const urgente = salida.getTime() - ahora.getTime() < 30 * 60 * 1000;

        return `
        <div class="route-card ${urgente ? "route-alert" : ""}">
          <span class="route-number">${indice + 1}</span>
          <div>
            <strong>${escapar(ruta.mascota)} · ${escapar(ruta.tipo)}</strong>
            <p class="text-secondary mb-1">${
              ruta.origen
                ? `${escapar(ruta.origen)} → ${escapar(ruta.destino)}`
                : "Domicilio a confirmar"
            }</p>
            <small>
              Salida sugerida:
              <strong>${salida.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</strong>
              — Servicio ${formatearFecha(ruta.horaProgramada)}
            </small>
            ${urgente ? `<p class="text-danger small fw-semibold mb-0 mt-2">Salí ya para llegar a tiempo.</p>` : ""}
          </div>
        </div>`;
      })
      .join("");
  } catch (error) {
    contenedor.innerHTML = `<p class="text-danger mb-0">${escapar(error.message)}</p>`;
  }
}

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
  mostrarCuenta();
}

cargarLiquidaciones();
cargarGuarderia();
cargarRutaHoy();

cargarSolicitudes();
