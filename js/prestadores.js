const contenedor = document.getElementById("resultados");

const filtroServicio = document.getElementById("filtroServicio");
const filtroZona = document.getElementById("filtroZona");
const btnBuscar = document.getElementById("btnBuscar");

let prestadores = [];

const escapar = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function obtenerServicios(servicios) {
  if (Array.isArray(servicios)) {
    return servicios;
  }

  if (typeof servicios === "string") {
    try {
      const resultado = JSON.parse(servicios);

      return Array.isArray(resultado) ? resultado : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

async function cargarPrestadores() {
  try {
    const respuesta = await fetch("/api/users");

    if (!respuesta.ok) {
      throw new Error("Error al obtener los usuarios");
    }

    const usuarios = await respuesta.json();

    prestadores = usuarios.filter((usuario) => usuario.rol === "prestador");

    mostrarPrestadores(prestadores);
  } catch (error) {
    console.error("Error al cargar prestadores:", error);

    contenedor.innerHTML = `
            <div class="alert alert-danger">
                No se pudieron cargar los prestadores.
            </div>
        `;
  }
}

function mostrarPrestadores(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
            <div class="alert alert-info">
                No se encontraron prestadores.
            </div>
        `;

    return;
  }

  lista.forEach((prestador) => {
    const servicios = obtenerServicios(prestador.servicios);

    const tarjeta = document.createElement("div");

    tarjeta.className = "col-md-6 col-lg-4";

    tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0">

                <div class="card-body">

                    <h5 class="card-title fw-bold">
                        ${escapar(prestador.nombre)}
                        ${escapar(prestador.apellido)}
                    </h5>

                    <p class="card-text">
                        <strong>Zona:</strong>
                        ${escapar(prestador.zona)}
                    </p>

                    <p class="card-text">
                        <strong>Servicios:</strong>
                        ${
                          servicios.length > 0
                            ? servicios
                                .map((s) =>
                                  prestador.preciosServicios?.[s]
                                    ? `${s} ($${prestador.preciosServicios[s]})`
                                    : s,
                                )
                                .join(", ")
                            : "Sin servicios registrados"
                        }
                    </p>

                    <p class="card-text">
                        <strong>Acepta:</strong>
                        ${
                          Array.isArray(prestador.tamanosAceptados) &&
                          prestador.tamanosAceptados.length > 0
                            ? prestador.tamanosAceptados.join(", ")
                            : "Todos los tamaños"
                        }
                    </p>

                    <p class="card-text">
                        <strong>Calificación:</strong>
                        ${prestador.calificacion || 0}
                    </p>

                        <button
                        class="btn btn-primary w-100"
                        onclick="abrirReserva(${prestador.id})"
                    >
                        Reservar
                    </button>

                    <button
                        class="btn btn-outline-secondary w-100 mt-2"
                        onclick="abrirResenas(${prestador.id})"
                    >
                        Ver reseñas (${prestador.resenas || 0})
                    </button>

                </div>

            </div>
        `;

    contenedor.appendChild(tarjeta);
  });
}

function buscarPrestadores() {
  const servicio = filtroServicio.value.trim().toLowerCase();

  const zona = filtroZona.value.trim().toLowerCase();

  const resultados = prestadores.filter((prestador) => {
    const servicios = obtenerServicios(prestador.servicios);

    const coincideServicio =
      servicio === "" ||
      servicios.some((item) => item.toLowerCase() === servicio);

    const coincideZona =
      zona === "" || prestador.zona.toLowerCase().includes(zona);

    return coincideServicio && coincideZona;
  });

  mostrarPrestadores(resultados);
}

btnBuscar.addEventListener("click", buscarPrestadores);

cargarPrestadores();

// =========================================
// RESERVA REAL
// =========================================

let prestadorElegido = null;
let modalReserva = null;

const formReserva = document.getElementById("formReserva");
const reservaServicio = document.getElementById("reservaServicio");
const reservaMascota = document.getElementById("reservaMascota");
const reservaFecha = document.getElementById("reservaFecha");
const reservaPrecio = document.getElementById("reservaPrecio");
const reservaError = document.getElementById("reservaError");
const tituloReserva = document.getElementById("tituloReserva");

const trasladoDatos = document.getElementById("trasladoDatos");
const trasladoOrigen = document.getElementById("trasladoOrigen");
const trasladoDestino = document.getElementById("trasladoDestino");
const trasladoMotivo = document.getElementById("trasladoMotivo");

const vueltaDatos = document.getElementById("vueltaDatos");
const solicitarVuelta = document.getElementById("solicitarVuelta");
const horaRegreso = document.getElementById("horaRegreso");

function mostrarCamposTraslado() {
  const esTraslado = reservaServicio.value === "Traslado";
  trasladoDatos.classList.toggle("d-none", !esTraslado);

  [trasladoOrigen, trasladoDestino, trasladoMotivo].forEach((campo) => {
    campo.required = esTraslado && campo !== trasladoMotivo;
  });

  const esGuarden = esTraslado && trasladoMotivo.value === "queda";
  vueltaDatos.classList.toggle("d-none", !esGuarden);

  if (!esTraslado) {
    trasladoOrigen.value = "";
    trasladoDestino.value = "";
    trasladoMotivo.value = "";
  }

  if (!esGuarden) {
    solicitarVuelta.checked = false;
    horaRegreso.value = "";
  }
}

function precioDe(prestador, tipo) {
  return Number(prestador.preciosServicios?.[tipo]) || 0;
}

function actualizarPrecioReserva() {
  const precio = precioDe(prestadorElegido, reservaServicio.value);
  reservaPrecio.textContent = precio > 0 ? `$${precio}` : "Sin precio cargado";
}

async function abrirReserva(id) {
  reservaError.classList.add("d-none");

  let usuario;

  try {
    usuario = await window.PacCopAuth.getCurrentSession();
  } catch {
    window.location.href = "/paginas/login.html";
    return;
  }

  if (usuario.rol !== "dueño") {
    alert("Solo los dueños de mascota pueden reservar servicios.");
    return;
  }

  prestadorElegido = prestadores.find((prestador) => prestador.id === id);

  const serviciosConPrecio = obtenerServicios(
    prestadorElegido.servicios,
  ).filter((servicio) => precioDe(prestadorElegido, servicio) > 0);

  if (serviciosConPrecio.length === 0) {
    alert("Este prestador todavía no cargó precios para sus servicios.");
    return;
  }

  const respuesta = await fetch(`/api/mascotas/usuario/${usuario.id}`, {
    credentials: "include",
  });

  const mascotas = respuesta.ok ? await respuesta.json() : [];

  if (mascotas.length === 0) {
    alert("Primero tenés que registrar una mascota para poder reservar.");
    return;
  }

  tituloReserva.textContent = `Reservar con ${prestadorElegido.nombre} ${prestadorElegido.apellido}`;

  reservaServicio.innerHTML = serviciosConPrecio
    .map((servicio) => `<option value="${servicio}">${servicio}</option>`)
    .join("");

  reservaMascota.innerHTML = mascotas
    .map(
      (mascota) => `<option value="${mascota.id}">${mascota.nombre}</option>`,
    )
    .join("");

  reservaFecha.value = "";
  actualizarPrecioReserva();
  mostrarCamposTraslado();

  if (!modalReserva) {
    modalReserva = new bootstrap.Modal(document.getElementById("modalReserva"));
  }

  modalReserva.show();
}

reservaServicio.addEventListener("change", actualizarPrecioReserva);
reservaServicio.addEventListener("change", mostrarCamposTraslado);
trasladoMotivo.addEventListener("change", mostrarCamposTraslado);

formReserva.addEventListener("submit", async (event) => {
  event.preventDefault();
  reservaError.classList.add("d-none");

  const datos = {
    providerId: prestadorElegido.id,
    tipo: reservaServicio.value,
    mascotaId: Number(reservaMascota.value),
    horaProgramada: new Date(reservaFecha.value).toISOString(),
  };

  if (reservaServicio.value === "Traslado") {
    if (!trasladoOrigen.value.trim() || !trasladoDestino.value.trim()) {
      reservaError.textContent = "Indicá el origen y el destino del traslado.";
      reservaError.classList.remove("d-none");
      return;
    }

    datos.origen = trasladoOrigen.value.trim();
    datos.destino = trasladoDestino.value.trim();
    datos.motivoTraslado = trasladoMotivo.value || "";

    if (solicitarVuelta.checked) {
      if (!horaRegreso.value) {
        reservaError.textContent = "Indicá la fecha y hora de regreso.";
        reservaError.classList.remove("d-none");
        return;
      }

      datos.solicitarVuelta = true;
      datos.horaRegreso = new Date(horaRegreso.value).toISOString();
    }
  }

  const respuesta = await fetch("/api/servicios", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    reservaError.textContent =
      resultado.mensaje || "No se pudo crear la reserva";
    reservaError.classList.remove("d-none");
    return;
  }

  modalReserva.hide();
  alert(
    "Reserva creada correctamente. Ya podés pagarla desde la pantalla de pago.",
  );
});

// =========================================
// RESEÑAS DEL PRESTADOR
// =========================================

let modalResenas = null;

async function abrirResenas(id) {
  const prestador = prestadores.find((item) => item.id === id);
  if (!prestador) return;

  const contenedorResenas = document.getElementById("listaResenas");
  document.getElementById("tituloResenas").textContent =
    `Reseñas de ${prestador.nombre} ${prestador.apellido}`;
  contenedorResenas.innerHTML =
    '<p class="text-secondary mb-0">Cargando reseñas...</p>';

  if (!modalResenas) {
    modalResenas = new bootstrap.Modal(document.getElementById("modalResenas"));
  }

  modalResenas.show();

  try {
    const respuesta = await fetch(`/api/servicios/prestador/${id}/resenas`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "No se pudieron cargar las reseñas");
    }

    const resenas = datos.resenas || [];

    if (resenas.length === 0) {
      contenedorResenas.innerHTML =
        '<p class="text-secondary mb-0">Este prestador todavía no tiene reseñas.</p>';
      return;
    }

    contenedorResenas.innerHTML = resenas
      .map(
        (resena) => `
        <div class="border-bottom py-2">
          <div class="d-flex justify-content-between">
            <strong>${escapar(resena.autor)}</strong>
            <span class="text-warning">${"★".repeat(resena.puntuacion)}${"☆".repeat(5 - resena.puntuacion)}</span>
          </div>
          ${resena.comentario ? `<p class="mb-0 small">${escapar(resena.comentario)}</p>` : ""}
          <small class="text-secondary">${new Date(resena.fecha).toLocaleDateString("es-AR")}</small>
        </div>`,
      )
      .join("");
  } catch (error) {
    contenedorResenas.innerHTML = `<p class="text-danger mb-0">${escapar(error.message)}</p>`;
  }
}

window.abrirResenas = abrirResenas;
