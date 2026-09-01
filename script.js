// ============================================================
// WoofPal — Panel del prestador
// Datos mock: en el proyecto real esto vendría del backend
// (endpoints de precios por zona/nivel y de estadísticas del prestador)
// ============================================================

// ---------- Datos mock: piso base por servicio (unidad de referencia) ----------
const SERVICES = {
  paseo: {
    label: "Paseo", base: 4000,
    unit: "minutos", unitRef: 60, defaultDuration: 30, // base = precio por 60 min; 30 min se muestra como valor inicial
    allowsPets: true, maxPets: 5, extraPetMult: 0.5, // +50% del precio por cada mascota adicional
  },
  guarderia: {
    label: "Guardería", base: 9000,
    unit: "horas", unitRef: 8, defaultDuration: 8, // base = precio por 8 hs de cuidado; escala proporcional a las horas cargadas
  },
  traslado: {
    label: "Traslado (veterinaria, peluquería, etc.)",
    // Sin precio de referencia: el costo depende de la distancia y se
    // coordina con cada familia, así que no mostramos precio ni mínimo.
    variablePricing: true,
  },
};

// Multiplicadores de piso mínimo por nivel (sobre el precio base)
const LEVEL_FLOOR_MULT = { nuevo: 1.0, establecido: 1.15, top: 1.4 };
// Rango sugerido (no piso) para el panel de publicación
const LEVEL_SUGGESTED_RANGE = {
  nuevo:       { min: 1.0,  avg: 1.08, max: 1.2 },
  establecido: { min: 1.15, avg: 1.3,  max: 1.5 },
  top:         { min: 1.4,  avg: 1.6,  max: 1.9 },
};

// Nivel actual del prestador (vendría de sus estadísticas reales)
const currentLevel = "establecido";

function money(n){
  return "$" + Math.round(n).toLocaleString("es-AR");
}

// ---------- Tabs (manejadas por Bootstrap; solo enganchamos el mapa) ----------
// El mapa de Leaflet necesita el contenedor visible para calcular su tamaño,
// así que lo iniciamos (o le recalculamos el tamaño) recién al abrir esta pestaña.
document.getElementById("tab-ruta").addEventListener("shown.bs.tab", initRouteMap);

// ---------- Panel 1: tabla de pisos por nivel (unidad de referencia) ----------
const floorTableBody = document.querySelector("#floorTable tbody");

// Convierte SERVICES en una lista plana de filas para la tabla. Los
// servicios con precio variable (traslado) no tienen un mínimo calculable.
function getFloorRows(){
  return Object.entries(SERVICES).map(([key, service]) => ({
    label: service.label,
    base: service.variablePricing ? null : service.base,
  }));
}

function renderFloorTable(){
  floorTableBody.innerHTML = "";

  getFloorRows().forEach(({ label, base }) => {
    const row = document.createElement("tr");
    const cells = ["nuevo", "establecido", "top"].map(level => {
      if (base === null) return `<td class="text-secondary fst-italic">A convenir</td>`;
      const value = base * LEVEL_FLOOR_MULT[level];
      const isCurrent = level === currentLevel;
      return `<td class="${isCurrent ? "table-primary fw-bold" : ""}">${money(value)}</td>`;
    }).join("");
    row.innerHTML = `<th scope="row">${label}</th>${cells}`;
    floorTableBody.appendChild(row);
  });
}
renderFloorTable();

// ---------- Panel 2: publicar varios servicios a la vez ----------
// El prestador puede tildar cualquier combinación de servicios (no son
// excluyentes) y cada uno se publica con su propio precio. El precio nunca
// bloquea la publicación: si está por debajo del promedio sugerido para su
// nivel, se muestra una advertencia informativa, pero el botón sigue activo.
const servicePickerEl = document.getElementById("servicePicker");
const serviceCardsEl = document.getElementById("serviceCards");
const serviceCardsEmptyEl = document.getElementById("serviceCardsEmpty");
const publishBtn = document.getElementById("publishBtn");
const publishForm = document.getElementById("publishForm");

// Servicios que el prestador ya tiene activos (vendría del backend).
// Se usa para poblar el panel de perfil desde el arranque.
let publishedServices = [
  { service: "paseo", price: 4500, duracion: 30, mascotas: 1 },
];

// Construye los chips (checkbox con look de botón, patrón btn-check de
// Bootstrap) a partir de SERVICES, para no repetir la lista a mano
Object.entries(SERVICES).forEach(([key, service]) => {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <input type="checkbox" class="btn-check js-service-checkbox" id="chip-${key}" value="${key}" autocomplete="off">
    <label class="btn btn-outline-primary rounded-pill" for="chip-${key}">${service.label}</label>
  `;
  servicePickerEl.append(...wrap.children);
});

servicePickerEl.addEventListener("change", (e) => {
  if (!e.target.matches(".js-service-checkbox")) return;
  if (e.target.checked) addServiceCard(e.target.value);
  else removeServiceCard(e.target.value);
  updatePublishBtnState();
});

function updatePublishBtnState(){
  const anyChecked = serviceCardsEl.children.length > 0;
  publishBtn.disabled = !anyChecked;
  serviceCardsEmptyEl.classList.toggle("d-none", anyChecked);
}

// Crea la tarjeta de un servicio tildado, con los campos que le correspondan
// (duración, mascotas) y su propio rango sugerido + advertencia de precio bajo.
// Los servicios de precio variable (traslado) muestran solo una nota, sin campos.
function addServiceCard(key){
  const service = SERVICES[key];
  const card = document.createElement("div");
  card.className = "card p-3";
  card.dataset.service = key;

  if (service.variablePricing){
    card.innerHTML = `
      <p class="fw-bold fw-display mb-2">${service.label}</p>
      <p class="text-secondary small mb-0">
        Vas a ofrecer este servicio, pero no tiene un precio publicado: como
        depende de la distancia y el destino, el costo se coordina
        directamente con cada familia al momento de la reserva.
      </p>
    `;
    serviceCardsEl.appendChild(card);
    return;
  }

  let fieldsHtml = "";
  if (service.unit){
    fieldsHtml += `
      <div class="col">
        <label for="duracion-${key}" class="form-label small text-secondary">Duración estimada (${service.unit})</label>
        <input type="number" id="duracion-${key}" class="form-control js-duracion"
          min="${service.unit === "minutos" ? 10 : 1}" step="1"
          value="${service.defaultDuration ?? service.unitRef}">
      </div>`;
  }
  if (service.allowsPets){
    fieldsHtml += `
      <div class="col">
        <label for="mascotas-${key}" class="form-label small text-secondary">Cantidad de mascotas (hasta ${service.maxPets}, si son dóciles)</label>
        <input type="number" id="mascotas-${key}" class="form-control js-mascotas"
          min="1" max="${service.maxPets}" step="1" value="1">
      </div>`;
  }
  fieldsHtml += `
    <div class="col">
      <label for="precio-${key}" class="form-label small text-secondary">Tu precio</label>
      <div class="input-group">
        <span class="input-group-text">$</span>
        <input type="number" id="precio-${key}" class="form-control js-precio" step="100">
      </div>
    </div>`;

  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <p class="fw-bold fw-display mb-0">${service.label}</p>
      <button type="button" class="btn btn-sm btn-light text-primary service-card__suggest">Usar precio sugerido</button>
    </div>
    <div class="row g-3 mb-3">${fieldsHtml}</div>
    <div class="rounded-3 p-3 mb-3" style="background: var(--brand-mint)">
      <div class="range-track">
        <div class="progress" style="height: 10px"><div class="progress-bar" style="width: 100%"></div></div>
        <div class="range-marker range-marker--min"><span>Mínimo</span></div>
        <div class="range-marker range-marker--avg"><span>Promedio zona</span></div>
        <div class="range-marker range-marker--max"><span>Máximo visto</span></div>
      </div>
      <div class="row row-cols-3 text-center g-2 mb-0 range-values"></div>
    </div>
    <div class="alert alert-warning py-2 px-3 small mb-0 d-none service-card__warning" role="alert">
      Este precio está por debajo del promedio sugerido para tu nivel. Podés
      publicarlo igual — no es obligatorio igualar el promedio — pero tené en
      cuenta que puede afectar cómo te perciben las familias.
    </div>
  `;
  serviceCardsEl.appendChild(card);

  const duracionInput = card.querySelector(".js-duracion");
  const mascotasInput = card.querySelector(".js-mascotas");
  const precioInput = card.querySelector(".js-precio");
  const suggestBtn = card.querySelector(".service-card__suggest");

  const renderThisCard = () => renderCardRange(key, card);

  if (duracionInput) duracionInput.addEventListener("input", renderThisCard);
  if (mascotasInput) mascotasInput.addEventListener("input", renderThisCard);
  precioInput.addEventListener("input", () => updateCardWarning(key, card));
  suggestBtn.addEventListener("click", () => {
    const { avg } = getServiceRange(key, card);
    precioInput.value = Math.round(avg);
    updateCardWarning(key, card);
  });

  renderThisCard();
}

function removeServiceCard(key){
  const card = serviceCardsEl.querySelector(`.card[data-service="${key}"]`);
  if (card) card.remove();
}

// Misma lógica de cálculo de rango que antes, pero tomando los valores de
// los inputs de UNA tarjeta puntual en vez de los campos globales.
function getServiceRange(key, card){
  const service = SERVICES[key];
  const range = LEVEL_SUGGESTED_RANGE[currentLevel];

  let durationFactor = 1;
  if (service.unit){
    const duracionInput = card.querySelector(".js-duracion");
    const duracion = Number(duracionInput?.value) || service.unitRef;
    durationFactor = duracion / service.unitRef;
  }

  let petsFactor = 1;
  if (service.allowsPets){
    const mascotasInput = card.querySelector(".js-mascotas");
    const cantidad = Math.min(Number(mascotasInput?.value) || 1, service.maxPets);
    petsFactor = 1 + (cantidad - 1) * service.extraPetMult;
  }

  const adjustedBase = service.base * durationFactor * petsFactor;
  return {
    min: adjustedBase * range.min,
    avg: adjustedBase * range.avg,
    max: adjustedBase * range.max,
  };
}

function renderCardRange(key, card){
  const { min, avg, max } = getServiceRange(key, card);
  const span = max - min || 1;
  const avgPos = ((avg - min) / span) * 100;

  card.querySelector(".range-marker--min").style.left = "0%";
  card.querySelector(".range-marker--avg").style.left = avgPos + "%";
  card.querySelector(".range-marker--max").style.left = "100%";
  card.querySelector(".range-values").innerHTML = `
    <div class="col"><p class="small text-secondary mb-0">Mínimo</p><p class="fw-bold fw-display mb-0">${money(min)}</p></div>
    <div class="col"><p class="small text-secondary mb-0">Promedio zona</p><p class="fw-bold fw-display mb-0">${money(avg)}</p></div>
    <div class="col"><p class="small text-secondary mb-0">Máximo visto</p><p class="fw-bold fw-display mb-0">${money(max)}</p></div>
  `;

  updateCardWarning(key, card);
}

// A diferencia de la versión anterior, esto NUNCA bloquea el envío del
// formulario: solo muestra una advertencia informativa (color ámbar).
function updateCardWarning(key, card){
  const { min } = getServiceRange(key, card);
  const precioInput = card.querySelector(".js-precio");
  const warning = card.querySelector(".service-card__warning");
  const value = Number(precioInput.value);
  const belowMin = precioInput.value !== "" && value < min;
  warning.classList.toggle("d-none", !belowMin);
  precioInput.classList.toggle("border-warning", belowMin);
}

publishForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const cards = serviceCardsEl.querySelectorAll(".card");
  if (!cards.length) return;

  cards.forEach(card => {
    const key = card.dataset.service;
    const service = SERVICES[key];
    let entry;

    if (service.variablePricing){
      entry = { service: key, price: null };
    } else {
      const precioInput = card.querySelector(".js-precio");
      const duracionInput = card.querySelector(".js-duracion");
      const mascotasInput = card.querySelector(".js-mascotas");
      entry = {
        service: key,
        price: Number(precioInput.value) || 0,
        duracion: duracionInput ? Number(duracionInput.value) : null,
        mascotas: mascotasInput ? Number(mascotasInput.value) : null,
      };
    }

    const existingIndex = publishedServices.findIndex(s => s.service === key);
    if (existingIndex >= 0) publishedServices[existingIndex] = entry;
    else publishedServices.push(entry);
  });

  renderProfileServices();
  alert("Servicios publicados exitosamente.");
});

updatePublishBtnState();

// ---------- Panel 5: perfil del prestador ----------
const profileServicesEl = document.getElementById("profileServices");

function renderProfileServices(){
  if (!profileServicesEl) return;

  if (!publishedServices.length){
    profileServicesEl.innerHTML = `
      <p class="col-12 text-secondary small mb-0">Todavía no publicaste ningún servicio.</p>
    `;
    return;
  }

  const range = LEVEL_SUGGESTED_RANGE[currentLevel];

  profileServicesEl.innerHTML = publishedServices.map(entry => {
    const service = SERVICES[entry.service];

    // Traslado no tiene precio de referencia: se muestra la tarjeta sin
    // cálculo de mínimo ni advertencia de precio bajo.
    if (service.variablePricing){
      return `
        <div class="col">
          <div class="card p-3">
            <div class="d-flex justify-content-between align-items-start mb-1">
              <p class="fw-bold mb-0">${service.label}</p>
              <button type="button" class="btn btn-sm btn-light rounded-circle profile-service-card__delete" data-service="${entry.service}" aria-label="Eliminar ${service.label}" style="width: 26px; height: 26px; padding: 0">✕</button>
            </div>
            <p class="fw-semibold text-secondary mb-0">A coordinar según distancia</p>
          </div>
        </div>
      `;
    }

    let durationFactor = 1;
    if (service.unit && entry.duracion) durationFactor = entry.duracion / service.unitRef;

    let petsFactor = 1;
    if (service.allowsPets && entry.mascotas){
      petsFactor = 1 + (Math.min(entry.mascotas, service.maxPets) - 1) * service.extraPetMult;
    }

    const min = service.base * durationFactor * petsFactor * range.min;
    const belowMin = entry.price < min;

    const detailBits = [];
    if (entry.duracion) detailBits.push(`${entry.duracion} ${service.unit}`);
    if (entry.mascotas) detailBits.push(`${entry.mascotas} mascota${entry.mascotas > 1 ? "s" : ""}`);

    return `
      <div class="col">
        <div class="card p-3${belowMin ? " border-warning" : ""}">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <p class="fw-bold mb-0">${service.label}</p>
            <button type="button" class="btn btn-sm btn-light rounded-circle profile-service-card__delete" data-service="${entry.service}" aria-label="Eliminar ${service.label}" style="width: 26px; height: 26px; padding: 0">✕</button>
          </div>
          ${detailBits.length ? `<p class="small text-secondary mb-1">${detailBits.join(" · ")}</p>` : ""}
          <p class="fw-display fs-4 fw-bold ${belowMin ? "text-warning" : "text-primary"} mb-0">${money(entry.price)}</p>
          ${belowMin ? `<p class="small text-warning fw-semibold mb-0">Por debajo del promedio sugerido</p>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// Un solo listener con delegación: alcanza para todas las tarjetas, incluso
// las que se regeneran cada vez que cambia publishedServices.
profileServicesEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".profile-service-card__delete");
  if (!btn) return;
  const key = btn.dataset.service;

  publishedServices = publishedServices.filter(s => s.service !== key);
  renderProfileServices();

  // Si ese servicio seguía tildado en el formulario de publicación,
  // lo destildamos y sacamos su tarjeta para que quede todo consistente.
  const checkbox = servicePickerEl.querySelector(`.js-service-checkbox[value="${key}"]`);
  if (checkbox && checkbox.checked){
    checkbox.checked = false;
    removeServiceCard(key);
    updatePublishBtnState();
  }
});

renderProfileServices();

// ---------- Panel 4: mapa real con Leaflet + ruta por calles ----------
// Coordenadas aproximadas de Formosa capital (mock — en el proyecto real
// vendrían de geocodificar la ubicación del prestador y la dirección de cada reserva).
const BASE_LOCATION = { lat: -26.1830, lng: -58.1650, label: "Tu ubicación actual" };

const ROUTE_STOPS = [
  { order: 1, label: "Toby · Barrio San Miguel", lat: -26.1950, lng: -58.1850, alert: false },
  { order: 2, label: "Kira · Barrio Namqom",      lat: -26.1600, lng: -58.2200, alert: false },
  { order: 3, label: "Rocky · Centro",            lat: -26.1849, lng: -58.1731, alert: true  },
];

let routeMap = null;

function initRouteMap(){
  const container = document.getElementById("routeMap");
  if (!container || typeof L === "undefined") return; // Leaflet no cargó (sin conexión)

  if (routeMap){
    routeMap.invalidateSize();
    return;
  }

  routeMap = L.map(container, { scrollWheelZoom: false });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(routeMap);

  const waypoints = [
    L.latLng(BASE_LOCATION.lat, BASE_LOCATION.lng),
    ...ROUTE_STOPS.map(s => L.latLng(s.lat, s.lng)),
  ];

  // Leaflet Routing Machine calcula el camino real por calles (usa el
  // servidor público de demo de OSRM). En producción conviene usar un
  // servicio propio de ruteo, ya que el demo público tiene límites de uso.
  L.Routing.control({
    waypoints,
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false, // oculta el panel de instrucciones paso a paso, nos quedamos con el dibujo del mapa
    lineOptions: {
      styles: [{ color: "#5EB5AE", weight: 5, opacity: 0.9 }], // var(--bs-primary)
    },
    createMarker: function (i, waypoint) {
      if (i === 0){
        const icon = L.divIcon({
          className: "",
          html: `<div class="route-pin rounded-circle text-bg-warning d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: .6rem">●</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        return L.marker(waypoint.latLng, { icon }).bindPopup(BASE_LOCATION.label);
      }
      const stop = ROUTE_STOPS[i - 1];
      const icon = L.divIcon({
        className: "",
        html: `<div class="route-pin rounded-circle text-bg-${stop.alert ? "danger" : "primary"} fw-bold d-flex align-items-center justify-content-center" style="width: 26px; height: 26px; font-size: .8rem">${stop.order}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      return L.marker(waypoint.latLng, { icon }).bindPopup(stop.label);
    },
  }).addTo(routeMap);

  // El tab arranca oculto, así que recalculamos el tamaño apenas se ve
  setTimeout(() => routeMap.invalidateSize(), 100);
}

// ---------- Panel 4: traslados de hoy ----------
// A diferencia del paseo/guardería (un solo punto), el traslado tiene origen
// y destino, un motivo, y un flujo de confirmaciones: el prestador confirma
// que recibió a la mascota antes de salir, y confirma la llegada al terminar.
// El dueño ve la ubicación en vivo con el mismo componente de mapa del paseo.
const TRANSPORT_REASON_LABELS = {
  veterinaria: "Veterinaria",
  peluqueria: "Peluquería",
  guarderia: "Guardería",
  otro: "Otro",
};

let TRANSPORT_JOBS = [
  {
    id: "t1",
    pet: "Milo",
    reason: "veterinaria",
    origin: "Barrio San Miguel",
    destination: "Veterinaria Vetcentro",
    partnered: true, // la plataforma tiene convenio con este destino
    appointmentTime: "13:30",
    scheduledPickup: "13:00",
    etaMinutes: 18,
    roundTrip: { enabled: true, returnTime: null, sameProvider: true },
    stage: "pendiente", // pendiente -> en_camino -> entregada
  },
  {
    id: "t2",
    pet: "Nina",
    reason: "peluqueria",
    origin: "Centro",
    destination: "Peluquería Canina Bella",
    partnered: false,
    appointmentTime: null,
    scheduledPickup: "16:15",
    etaMinutes: 12,
    roundTrip: { enabled: false, returnTime: null, sameProvider: true },
    stage: "pendiente",
  },
];

const transportJobsListEl = document.getElementById("transportJobsList");

function renderTransportJobCard(job){
  const reasonLabel = TRANSPORT_REASON_LABELS[job.reason] || "Otro";

  const appointmentHtml = job.partnered && job.appointmentTime
    ? `<p class="small mb-2">Destino con convenio · turno reservado: <strong>${job.appointmentTime}</strong></p>`
    : "";

  let roundTripHtml = "";
  if (job.roundTrip.enabled){
    const returnText = job.roundTrip.returnTime
      ? `Vuelta confirmada: <strong>${job.roundTrip.returnTime}</strong>`
      : "Vuelta: <strong>a confirmar</strong>";
    const providerText = job.roundTrip.sameProvider
      ? "Vos hacés los dos tramos"
      : "El tramo de vuelta lo hace otro prestador";
    roundTripHtml = `
      <div class="d-flex flex-wrap gap-3 small text-secondary border-dashed border-top border-bottom py-2 mb-2">
        <span class="fw-bold text-danger">Ida y vuelta</span>
        <span>${returnText}</span>
        <span>${providerText}</span>
        <span>Cobro único por el traslado completo</span>
      </div>`;
  }

  let statusHtml = "";
  let actionHtml = "";

  if (job.stage === "pendiente"){
    statusHtml = `
      <p class="small text-secondary mb-2">
        Pendiente de confirmar recepción — todavía no salgas hacia destino.
      </p>`;
    actionHtml = `
      <button type="button" class="btn btn-primary btn-sm js-transport-action" data-job="${job.id}" data-action="recibir">
        Confirmar recepción de ${job.pet}
      </button>`;
  } else if (job.stage === "en_camino"){
    statusHtml = `
      <p class="small text-primary fw-semibold mb-2">
        En camino a destino. El dueño ya puede ver tu ubicación en vivo
        (mismo mapa que usás en los paseos).
      </p>`;
    actionHtml = `
      <button type="button" class="btn btn-primary btn-sm js-transport-action" data-job="${job.id}" data-action="entregar">
        Notificar llegada a destino
      </button>`;
  } else if (job.stage === "entregada"){
    statusHtml = `
      <p class="small text-primary fw-bold mb-2">
        Entregada en destino — se notificó al dueño.
      </p>`;
    if (job.roundTrip.enabled && !job.roundTrip.returnTime){
      actionHtml = `
        <div class="d-flex flex-wrap gap-2 align-items-end">
          <div>
            <label for="return-${job.id}" class="form-label small text-secondary mb-1">Confirmar hora de vuelta</label>
            <input type="time" id="return-${job.id}" class="form-control form-control-sm js-return-time">
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm js-confirm-return" data-job="${job.id}">
            Confirmar
          </button>
        </div>
        <p class="small text-secondary mt-1 mb-0">
          Si todavía no sabés la hora (por ejemplo, depende de cuánto dure
          el turno), podés dejarlo así y confirmarlo más tarde.
        </p>`;
    } else if (job.roundTrip.enabled){
      actionHtml = `
        <p class="small text-primary fw-semibold mb-0">
          Vuelta programada para las <strong>${job.roundTrip.returnTime}</strong>.
        </p>`;
    }
  }

  return `
    <div class="card p-3" data-job="${job.id}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <p class="fw-bold fw-display mb-0">${job.pet}</p>
        <span class="badge rounded-pill text-bg-primary">${reasonLabel}</span>
      </div>

      <div class="route-line rounded-3 p-3 d-flex flex-wrap gap-3 align-items-center mb-2">
        <div>
          <span class="d-block text-uppercase text-primary fw-bold" style="font-size: .72rem">Origen</span>
          <span>${job.origin}</span>
        </div>
        <span class="text-primary fw-bold" aria-hidden="true">→</span>
        <div>
          <span class="d-block text-uppercase text-primary fw-bold" style="font-size: .72rem">Destino</span>
          <span>${job.destination}</span>
        </div>
      </div>

      <p class="small text-secondary mb-2">
        Recogida ${job.scheduledPickup} · Tiempo estimado de traslado: ${job.etaMinutes} min
      </p>
      ${appointmentHtml}
      ${roundTripHtml}
      ${statusHtml}
      ${actionHtml}
    </div>
  `;
}

function renderTransportJobs(){
  if (!transportJobsListEl) return;
  transportJobsListEl.innerHTML = TRANSPORT_JOBS.map(renderTransportJobCard).join("");
}

// Delegación de eventos: alcanza un solo listener aunque las tarjetas se
// vuelvan a dibujar cada vez que cambia el estado de un traslado.
transportJobsListEl?.addEventListener("click", (e) => {
  const actionBtn = e.target.closest(".js-transport-action");
  if (actionBtn){
    const job = TRANSPORT_JOBS.find(j => j.id === actionBtn.dataset.job);
    if (!job) return;

    if (actionBtn.dataset.action === "recibir"){
      job.stage = "en_camino";
    } else if (actionBtn.dataset.action === "entregar"){
      job.stage = "entregada";
      alert(`Se notificó al dueño de ${job.pet} que llegó a destino (simulado).`);
    }
    renderTransportJobs();
    return;
  }

  const confirmReturnBtn = e.target.closest(".js-confirm-return");
  if (confirmReturnBtn){
    const job = TRANSPORT_JOBS.find(j => j.id === confirmReturnBtn.dataset.job);
    if (!job) return;

    const input = document.getElementById(`return-${job.id}`);
    if (!input || !input.value){
      alert("Ingresá una hora antes de confirmar la vuelta.");
      return;
    }
    job.roundTrip.returnTime = input.value;
    renderTransportJobs();
  }
});

renderTransportJobs();
