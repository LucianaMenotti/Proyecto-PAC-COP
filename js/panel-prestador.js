
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

function leerPrecios(valor) {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    try {
      const resultado = JSON.parse(valor);
      return resultado && typeof resultado === "object" ? resultado : {};
    } catch {
      return {};
    }
  }

  return {};
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
  misPrecios = leerPrecios(resultado.usuario.preciosServicios);

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
            ${servicio} · ${
              misPrecios[servicio]
                ? "$" + misPrecios[servicio]
                : "sin precio"
            }
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
  misPrecios = leerPrecios(usuario.preciosServicios);

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

  // -----------------------------------------
  // TABLA DE PRECIOS MÍNIMOS
  // -----------------------------------------

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

  // -----------------------------------------
  // FORMULARIO DE PUBLICACIÓN
  // -----------------------------------------

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

  // -----------------------------------------
  // RENDIMIENTO REAL: SERVICIOS FINALIZADOS
  // -----------------------------------------

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
      completados >= 50
        ? "top"
        : completados >= 10
          ? "establecido"
          : "nuevo";

    if (precioInput) {
      precioInput.placeholder = obtenerPrecioMinimo();
    }

    const barra = document.getElementById("barraProgresoNivel");

    if (barra) {
      barra.style.width = `${Math.min(
        100,
        Math.round((completados / 50) * 100),
      )}%`;
    }

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

// -----------------------------------------
// SOLICITUDES DE RESERVA
// -----------------------------------------

async function cargarSolicitudes() {
    try {
        const respuesta = await fetch("/api/servicios", {
            credentials: "include",
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las solicitudes");
        }

        const resultado = await respuesta.json();
        const servicios = resultado.servicios || [];

        const solicitudes = servicios.filter(
            (servicio) =>
                servicio.estado === "programado" &&
                servicio.puedeGestionar === true
        );

        mostrarSolicitudes(solicitudes);
    } catch (error) {
        console.error("Error al cargar solicitudes:", error);
    }
}

function mostrarSolicitudes(solicitudes) {
    let contenedor = document.getElementById("solicitudesPrestador");

    if (!contenedor) {
        const main = document.querySelector("main");
        if (!main) return;

        contenedor = document.createElement("div");
        contenedor.id = "solicitudesPrestador";

        main.prepend(contenedor);
    }

    contenedor.innerHTML = `
        <div class="container mb-4">
            <div class="card border-0 shadow-sm">

                <button
                    type="button"
                    class="btn btn-light w-100 text-start border-0 p-4"
                    data-bs-toggle="collapse"
                    data-bs-target="#listaSolicitudes"
                    aria-expanded="false"
                    aria-controls="listaSolicitudes"
                >
                    <div class="d-flex justify-content-between align-items-center">

                        <div>
                            <h4 class="fw-bold mb-1">
                                Solicitudes (${solicitudes.length})
                            </h4>

                            <small class="text-secondary">
                                Reservas pendientes para aceptar o rechazar
                            </small>
                        </div>

                        <span class="fs-4">
                            ▾
                        </span>

                    </div>
                </button>

                <div id="listaSolicitudes" class="collapse">
                    <div class="card-body pt-0">

                        ${
                            solicitudes.length === 0
                                ? `
                                    <div class="text-center py-4 text-secondary">
                                        <p class="mb-0">
                                            No hay solicitudes pendientes.
                                        </p>
                                    </div>
                                `
                                : solicitudes
                                      .map(
                                          (servicio) => `
                                    <div
                                        class="border rounded p-3 mb-3"
                                        data-solicitud="${servicio.id}"
                                    >
                                        <div class="row g-3 align-items-center">

                                            <div class="col-md-8">

                                                <h5 class="fw-bold mb-2">
                                                    Nueva reserva
                                                </h5>

                                                <p class="mb-1">
                                                    <strong>${servicio.tipo}</strong>
                                                    para ${servicio.mascota}
                                                </p>

                                                <p class="mb-1 text-secondary">
                                                    ${servicio.prestador}
                                                </p>

                                                <p class="mb-1">
                                                    <strong>Precio:</strong>
                                                    $${servicio.monto}
                                                </p>

                                                <p class="mb-0 text-secondary">
                                                    ${formatearFecha(
                                                        servicio.horaProgramada
                                                    )}
                                                </p>

                                            </div>

                                            <div class="col-md-4">
                                                <div class="d-flex gap-2 justify-content-md-end">

                                                    <button
                                                        type="button"
                                                        class="btn btn-outline-danger"
                                                        data-rechazar="${servicio.id}"
                                                    >
                                                        Rechazar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        class="btn btn-success"
                                                        data-aceptar="${servicio.id}"
                                                    >
                                                        Aceptar
                                                    </button>

                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                `
                                      )
                                      .join("")
                        }

                    </div>
                </div>

            </div>
        </div>
    `;

    contenedor
        .querySelectorAll("[data-aceptar]")
        .forEach((boton) => {
            boton.addEventListener("click", () => {
                gestionarSolicitud(
                    boton.dataset.aceptar,
                    "aceptar"
                );
            });
        });

    contenedor
        .querySelectorAll("[data-rechazar]")
        .forEach((boton) => {
            boton.addEventListener("click", () => {
                gestionarSolicitud(
                    boton.dataset.rechazar,
                    "rechazar"
                );
            });
        });
}

function formatearFecha(fecha) {
    if (!fecha) return "Fecha no disponible";

    return new Date(fecha).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

async function gestionarSolicitud(id, accion) {
    const accionTexto =
        accion === "aceptar" ? "aceptar" : "rechazar";

    const confirmar = confirm(
        `¿Seguro que querés ${accionTexto} esta reserva?`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `/api/servicios/${id}/${accion}`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                "No se pudo gestionar la reserva"
            );
        }

        alert(resultado.mensaje);

        await cargarSolicitudes();

    } catch (error) {
        alert(error.message);
    }
}

cargarSolicitudes();