// =========================================
// PAC-COP - PANEL DEL PRESTADOR
// =========================================

const usuario = await window.PacCopAuth.requireSession(["prestador"]);

// -----------------------------------------
// DATOS BASE
// -----------------------------------------

// El <select> del HTML usa minúsculas; el backend guarda estos nombres
const NOMBRE_SERVICIO = {
  paseo: "Paseo",
  guarderia: "Guarderia",
  traslado: "Traslado",
};

const precios = {
  Paseo: { nombre: "Paseo", nuevo: 4000, establecido: 5000, top: 7000 },
  Guarderia: {
    nombre: "Guardería",
    nuevo: 7000,
    establecido: 9000,
    top: 12000,
  },
  Traslado: { nombre: "Traslado", nuevo: 5000, establecido: 7000, top: 10000 },
};

let nivelActual = "nuevo";
let misServicios = [];
let misPrecios = {};

const formulario = document.getElementById("publishForm");
const servicioSelect = document.getElementById("servicioSelect");
const precioInput = document.getElementById("precioInput");
const precioError = document.getElementById("precioError");
const useSuggested = document.getElementById("useSuggested");

function leerLista(valor) {
  if (Array.isArray(valor)) return valor;

  if (typeof valor === "string") {
    try {
      const resultado = JSON.parse(valor);
      return Array.isArray(resultado) ? resultado : [];
    } catch {
      return [];
    }
  }

  return [];
}

function escribir(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = texto;
}

function obtenerPrecioMinimo() {
  const servicio = NOMBRE_SERVICIO[servicioSelect.value];
  return precios[servicio]?.[nivelActual] ?? 0;
}

// -----------------------------------------
// GUARDAR / MOSTRAR SERVICIOS
// -----------------------------------------

async function guardarServicios() {
  const respuesta = await fetch("/api/users/me/servicios", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      servicios: misServicios,
      preciosServicios: misPrecios,
    }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || "No se pudo guardar");
  }

  misServicios = leerLista(resultado.usuario.servicios);
  misPrecios = resultado.usuario.preciosServicios || {};
  renderizarServicios();
}

function renderizarServicios() {
  const contenedor = document.getElementById("serviciosPrestador");
  if (!contenedor) return;

  if (misServicios.length === 0) {
    contenedor.innerHTML = `<span class="text-secondary small">Todavía no publicaste servicios.</span>`;
    return;
  }

  contenedor.innerHTML = misServicios
    .map(
      (servicio) => `
        <span class="badge bg-light text-dark border me-1 mb-1">
            ${servicio} · ${misPrecios[servicio] ? "$" + misPrecios[servicio] : "sin precio"}
        </span>
    `,
    )
    .join("");
}

// -----------------------------------------
// INICIO
// -----------------------------------------

if (usuario) {
  misServicios = leerLista(usuario.servicios);
  misPrecios = { ...(usuario.preciosServicios || {}) };

  // Encabezado
  const avatar = document.getElementById("avatarUsuario");

  if (avatar) {
    avatar.textContent = (usuario.nombre || "P").charAt(0).toUpperCase();
    avatar.style.cursor = "pointer";
    avatar.addEventListener("click", () => {
      window.location.href = "perfil-prestador.html";
    });
  }

  escribir("nombrePrestador", `${usuario.nombre} ${usuario.apellido}`);
  escribir("zonaPrestador", usuario.zona || "Zona no especificada");
  escribir("calificacionPrestador", usuario.calificacion || "0");
  escribir("resenasPrestador", usuario.resenas || "0");

  renderizarServicios();

  // Tabla de precios mínimos
  const tabla = document.getElementById("tablaPrecios");

  if (tabla) {
    tabla.innerHTML = Object.values(precios)
      .map(
        (servicio) => `
            <tr>
                <td class="fw-semibold">${servicio.nombre}</td>
                <td>$${servicio.nuevo}</td>
                <td class="fw-bold text-success">$${servicio.establecido}</td>
                <td>$${servicio.top}</td>
            </tr>
        `,
      )
      .join("");
  }

  // Formulario de publicación
  if (servicioSelect && precioInput) {
    precioInput.placeholder = obtenerPrecioMinimo();

    servicioSelect.addEventListener("change", () => {
      precioInput.placeholder = obtenerPrecioMinimo();
      precioError.classList.add("d-none");
    });
  }

  if (useSuggested) {
    useSuggested.addEventListener("click", () => {
      precioInput.value = obtenerPrecioMinimo();
      precioError.classList.add("d-none");
    });
  }

  if (formulario) {
    formulario.addEventListener("submit", async (event) => {
      event.preventDefault();

      const servicio = NOMBRE_SERVICIO[servicioSelect.value];
      const precio = Number(precioInput.value);

      if (!precio || precio < obtenerPrecioMinimo()) {
        precioError.classList.remove("d-none");
        return;
      }

      precioError.classList.add("d-none");

      if (!misServicios.includes(servicio)) {
        misServicios.push(servicio);
      }

      misPrecios[servicio] = precio;

      try {
        await guardarServicios();
        formulario.reset();
        precioInput.placeholder = obtenerPrecioMinimo();
        alert("Servicio publicado correctamente.");
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Rendimiento real: servicios finalizados y nivel
  (async () => {
    let completados = 0;

    try {
      const respuesta = await fetch("/api/servicios", {
        credentials: "include",
      });
      const { servicios } = await respuesta.json();
      completados = (servicios || []).filter(
        (s) => s.estado === "finalizado",
      ).length;
    } catch {
      completados = 0;
    }

    nivelActual =
      completados >= 50 ? "top" : completados >= 10 ? "establecido" : "nuevo";

    if (precioInput) precioInput.placeholder = obtenerPrecioMinimo();

    const barra = document.getElementById("barraProgresoNivel");
    if (barra)
      barra.style.width = `${Math.min(100, Math.round((completados / 50) * 100))}%`;

    ["nuevo", "establecido", "top"].forEach((nivel) => {
      document
        .getElementById(`col-nivel-${nivel}`)
        ?.classList.toggle("nivel-actual", nivel === nivelActual);
    });

    const resumen = document.getElementById("textoResumenNivel");

    if (resumen) {
      const faltan = Math.max(0, 50 - completados);
      resumen.innerHTML =
        `Llevás <strong>${completados} servicios</strong> con <strong>${usuario.calificacion ?? 0}★</strong> de promedio.` +
        (faltan > 0
          ? ` Te faltan <strong>${faltan} servicios</strong> para alcanzar Top.`
          : " Ya estás en el nivel Top.");
    }
  })();
}
