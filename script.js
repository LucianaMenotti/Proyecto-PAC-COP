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
  "guarderia-dia": {
    label: "Guardería diurna", base: 9000,
    unit: "horas", unitRef: 8,
  },
  "guarderia-noche": {
    label: "Guardería nocturna", base: 13000,
    unit: "horas", unitRef: 12,
  },
  traslado: {
    label: "Traslado (veterinaria, peluquería, etc.)", base: 5000,
    unit: null, unitRef: null,
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

// ---------- Tabs ----------
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
    panels.forEach(p => { p.classList.remove("is-active"); p.hidden = true; });

    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    const target = document.getElementById(tab.dataset.target);
    target.classList.add("is-active");
    target.hidden = false;

    // El mapa de Leaflet necesita el contenedor visible para calcular su tamaño,
    // así que lo iniciamos (o le recalculamos el tamaño) recién al abrir esta pestaña.
    if (target.id === "panel-ruta") initRouteMap();
  });
});

// ---------- Panel 1: tabla de pisos por nivel (unidad de referencia) ----------
const floorTableBody = document.querySelector("#floorTable tbody");

function renderFloorTable(){
  floorTableBody.innerHTML = "";

  Object.entries(SERVICES).forEach(([key, service]) => {
    const row = document.createElement("tr");
    const cells = ["nuevo", "establecido", "top"].map(level => {
      const value = service.base * LEVEL_FLOOR_MULT[level];
      const isCurrent = level === currentLevel;
      return `<td class="${isCurrent ? "is-top" : ""}">${money(value)}</td>`;
    }).join("");
    row.innerHTML = `<th scope="row">${service.label}</th>${cells}`;
    floorTableBody.appendChild(row);
  });
}
renderFloorTable();

// ---------- Panel 2: rango sugerido al publicar ----------
const servicioSelect = document.getElementById("servicioSelect");
const duracionField = document.getElementById("duracionField");
const duracionLabel = document.getElementById("duracionLabel");
const duracionInput = document.getElementById("duracionInput");
const mascotasField = document.getElementById("mascotasField");
const mascotasInput = document.getElementById("mascotasInput");
const precioInput = document.getElementById("precioInput");
const precioError = document.getElementById("precioError");
const rangeFill = document.getElementById("rangeFill");
const markerMin = document.getElementById("markerMin");
const markerAvg = document.getElementById("markerAvg");
const markerMax = document.getElementById("markerMax");
const rangeValues = document.getElementById("rangeValues");
const useSuggestedBtn = document.getElementById("useSuggested");
const publishForm = document.getElementById("publishForm");

// Ajusta qué campos se ven y sus valores por defecto según el servicio elegido
function toggleServiceFields(){
  const service = SERVICES[servicioSelect.value];

  // Duración: se muestra si el servicio tiene unidad de referencia (paseo y guardería, no traslado)
  if (service.unit){
    duracionField.hidden = false;
    duracionLabel.textContent = `Duración estimada (${service.unit})`;
    duracionInput.value = service.defaultDuration ?? service.unitRef;
    duracionInput.min = service.unit === "minutos" ? 10 : 1;
  } else {
    duracionField.hidden = true;
  }

  // Cantidad de mascotas: solo para paseo
  mascotasField.hidden = !service.allowsPets;
  if (service.allowsPets) mascotasInput.value = 1;
}

function getCurrentRange(){
  const service = SERVICES[servicioSelect.value];
  const range = LEVEL_SUGGESTED_RANGE[currentLevel];

  // Factor por duración: si el servicio tiene unidad de referencia, escala proporcional
  let durationFactor = 1;
  if (service.unit){
    const duracion = Number(duracionInput.value) || service.unitRef;
    durationFactor = duracion / service.unitRef;
  }

  // Factor por cantidad de mascotas: la primera está incluida en el precio base,
  // cada mascota adicional suma un porcentaje extra (no se cobra doble por completo)
  let petsFactor = 1;
  if (service.allowsPets){
    const cantidad = Math.min(Number(mascotasInput.value) || 1, service.maxPets);
    petsFactor = 1 + (cantidad - 1) * service.extraPetMult;
  }

  const adjustedBase = service.base * durationFactor * petsFactor;

  return {
    min: adjustedBase * range.min,
    avg: adjustedBase * range.avg,
    max: adjustedBase * range.max,
  };
}

function renderRange(){
  const { min, avg, max } = getCurrentRange();

  // posiciones relativas dentro de la barra (0 a 100%)
  const span = max - min || 1;
  const avgPos = ((avg - min) / span) * 100;

  markerMin.style.left = "0%";
  markerAvg.style.left = avgPos + "%";
  markerMax.style.left = "100%";
  rangeFill.style.width = "100%";

  rangeValues.innerHTML = `
    <div><dt>Mínimo</dt><dd>${money(min)}</dd></div>
    <div><dt>Promedio zona</dt><dd>${money(avg)}</dd></div>
    <div><dt>Máximo visto</dt><dd>${money(max)}</dd></div>
  `;

  validatePrice();
}

function validatePrice(){
  const { min } = getCurrentRange();
  const value = Number(precioInput.value);
  const belowMin = precioInput.value !== "" && value < min;
  precioError.hidden = !belowMin;
  precioInput.style.borderColor = belowMin ? "var(--coral)" : "var(--line)";
}

servicioSelect.addEventListener("change", () => { toggleServiceFields(); renderRange(); });
duracionInput.addEventListener("input", renderRange);
mascotasInput.addEventListener("input", renderRange);
precioInput.addEventListener("input", validatePrice);

useSuggestedBtn.addEventListener("click", () => {
  const { avg } = getCurrentRange();
  precioInput.value = Math.round(avg);
  validatePrice();
});

publishForm.addEventListener("submit", (e) => {
  e.preventDefault();
  validatePrice();
  if (!precioError.hidden) return;
  useSuggestedBtn.textContent = "Precio sugerido";
  alert("Servicio publicado (simulado). En el proyecto real esto se enviaría al backend.");
});

toggleServiceFields();
renderRange();

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
      styles: [{ color: "#5EB5AE", weight: 5, opacity: 0.9 }], // var(--turquoise)
    },
    createMarker: function (i, waypoint) {
      if (i === 0){
        const icon = L.divIcon({
          className: "",
          html: `<div class="route-pin route-pin--base">●</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        return L.marker(waypoint.latLng, { icon }).bindPopup(BASE_LOCATION.label);
      }
      const stop = ROUTE_STOPS[i - 1];
      const icon = L.divIcon({
        className: "",
        html: `<div class="route-pin${stop.alert ? " route-pin--alert" : ""}">${stop.order}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      return L.marker(waypoint.latLng, { icon }).bindPopup(stop.label);
    },
  }).addTo(routeMap);

  // El tab arranca oculto, así que recalculamos el tamaño apenas se ve
  setTimeout(() => routeMap.invalidateSize(), 100);
}
