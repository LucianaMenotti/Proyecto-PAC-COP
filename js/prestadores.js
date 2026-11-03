function normalizarConfigPrecio(precioData) {
  if (precioData === null || precioData === undefined) {
    return { precioBase: 0, tipoDescuento: "ninguno", valorDescuento: 0 };
  }
  if (typeof precioData === "number" || typeof precioData === "string") {
    return {
      precioBase: Number(precioData) || 0,
      tipoDescuento: "ninguno",
      valorDescuento: 0,
    };
  }
  return {
    precioBase: Number(precioData.precioBase ?? precioData.precio ?? 0) || 0,
    tipoDescuento: precioData.tipoDescuento || "ninguno",
    valorDescuento: Number(precioData.valorDescuento) || 0,
  };
}

function calcularPresupuesto(precioBase, cantidadMascotas, reglaDescuento = {}) {
  const base = Math.max(0, Number(precioBase) || 0);
  const cantidad = Math.max(0, Math.floor(Number(cantidadMascotas) || 0));

  if (cantidad === 0 || base === 0) {
    return {
      precioBase: base,
      cantidadMascotas: cantidad,
      subtotalSinDescuento: 0,
      descuentoTotal: 0,
      costoMascotasExtra: 0,
      total: 0,
      reglaAplicada: "Sin selección",
    };
  }

  if (cantidad === 1) {
    return {
      precioBase: base,
      cantidadMascotas: 1,
      subtotalSinDescuento: base,
      descuentoTotal: 0,
      costoMascotasExtra: 0,
      total: base,
      reglaAplicada: "Precio base unitario",
    };
  }

  const cantidadExtra = cantidad - 1;
  const subtotalSinDescuento = base * cantidad;
  const tipo = reglaDescuento?.tipoDescuento || "ninguno";
  const valor = Number(reglaDescuento?.valorDescuento) || 0;

  let costoMascotasExtra = 0;
  let reglaAplicada = "Tarifa completa sin descuento";

  if (tipo === "porcentaje" && valor > 0) {
    const factorDescuento = Math.max(0, Math.min(100, valor)) / 100;
    const precioUnitarioExtra = base * (1 - factorDescuento);
    costoMascotasExtra = Math.round(precioUnitarioExtra * cantidadExtra * 100) / 100;
    reglaAplicada = `${valor}% desc. a partir de la 2da mascota`;
  } else if (tipo === "fijoIncremental" && valor >= 0) {
    costoMascotasExtra = valor * cantidadExtra;
    reglaAplicada = `+$${valor} por mascota adicional`;
  } else {
    costoMascotasExtra = base * cantidadExtra;
  }

  const total = Math.round((base + costoMascotasExtra) * 100) / 100;
  const descuentoTotal = Math.max(0, Math.round((subtotalSinDescuento - total) * 100) / 100);

  return {
    precioBase: base,
    cantidadMascotas: cantidad,
    subtotalSinDescuento,
    descuentoTotal,
    costoMascotasExtra,
    total,
    reglaAplicada,
  };
}
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
                                .map((s) => {
                                  const cfg = normalizarConfigPrecio(prestador.preciosServicios?.[s]);
                                  if (!cfg.precioBase) return s;
                                  let extra = "";
                                  if (cfg.tipoDescuento === "porcentaje" && cfg.valorDescuento > 0) {
                                    extra = ` (2da+ con ${cfg.valorDescuento}% desc)`;
                                  } else if (cfg.tipoDescuento === "fijoIncremental" && cfg.valorDescuento >= 0) {
                                    extra = ` (+${cfg.valorDescuento} por extra)`;
                                  }
                                  return `${s} (${cfg.precioBase}/u${extra})`;
                                })
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
// const reservaMascota = document.getElementById("reservaMascota");
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
  const cfg = normalizarConfigPrecio(prestador.preciosServicios?.[tipo]);
  return cfg.precioBase;
}

function actualizarPrecioReserva() {
  if (!prestadorElegido || !reservaServicio.value) return;

  const config = normalizarConfigPrecio(prestadorElegido.preciosServicios?.[reservaServicio.value]);
  const checkboxes = document.querySelectorAll(".check-mascota-reserva:checked");
  const cantidad = checkboxes.length;

  const resultado = calcularPresupuesto(config.precioBase, cantidad, config);

  const elPrecioBase = document.getElementById("desglosePrecioBase");
  const elCantidad = document.getElementById("desgloseCantidad");
  const elRegla = document.getElementById("desgloseRegla");
  const filaDescuento = document.getElementById("filaDescuento");
  const etiquetaDescuento = document.getElementById("etiquetaDescuento");
  const desgloseDescuento = document.getElementById("desgloseDescuento");

  if (elPrecioBase) elPrecioBase.textContent = `${resultado.precioBase}`;
  if (elCantidad) elCantidad.textContent = `${resultado.cantidadMascotas}`;
  if (elRegla) elRegla.textContent = resultado.reglaAplicada;

  if (filaDescuento && etiquetaDescuento && desgloseDescuento) {
    if (resultado.descuentoTotal > 0) {
      filaDescuento.classList.remove("d-none");
      etiquetaDescuento.textContent = "Descuento aplicado:";
      desgloseDescuento.className = "text-success fw-bold";
      desgloseDescuento.textContent = `-${resultado.descuentoTotal}`;
    } else if (resultado.costoMascotasExtra > 0 && config.tipoDescuento === "fijoIncremental") {
      filaDescuento.classList.remove("d-none");
      etiquetaDescuento.textContent = "Adicional mascotas extra:";
      desgloseDescuento.className = "text-primary fw-bold";
      desgloseDescuento.textContent = `+${resultado.costoMascotasExtra}`;
    } else {
      filaDescuento.classList.add("d-none");
    }
  }

  reservaPrecio.textContent = resultado.total > 0 ? `${resultado.total}` : "—";
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

  const contenedorMascotas = document.getElementById("contenedorMascotasCheckboxes");
  if (contenedorMascotas) {
    contenedorMascotas.innerHTML = mascotas
      .map(
        (mascota, index) => `
          <div class="form-check">
            <input class="form-check-input check-mascota-reserva" type="checkbox" value="${mascota.id}" id="chk_mascota_${mascota.id}" ${index === 0 ? "checked" : ""}>
            <label class="form-check-label d-flex justify-content-between" for="chk_mascota_${mascota.id}">
              <span><strong>${escapar(mascota.nombre)}</strong> <small class="text-secondary">(${mascota.tipo || "Mascota"}${mascota.tamano ? " - " + mascota.tamano : ""})</small></span>
            </label>
          </div>
        `
      )
      .join("");

    contenedorMascotas.querySelectorAll(".check-mascota-reserva").forEach((chk) => {
      chk.addEventListener("change", () => {
        const errorElem = document.getElementById("errorMascotasSeleccion");
        if (errorElem) errorElem.classList.add("d-none");
        actualizarPrecioReserva();
      });
    });
  }

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

  const checkboxes = Array.from(document.querySelectorAll(".check-mascota-reserva:checked"));
  const mascotaIds = checkboxes.map((chk) => Number(chk.value));
  const errorElem = document.getElementById("errorMascotasSeleccion");

  if (mascotaIds.length === 0) {
    if (errorElem) errorElem.classList.remove("d-none");
    reservaError.textContent = "Seleccioná al menos una mascota.";
    reservaError.classList.remove("d-none");
    return;
  }

  const datos = {
    providerId: prestadorElegido.id,
    tipo: reservaServicio.value,
    mascotaIds: mascotaIds,
    mascotaId: mascotaIds[0],
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

  try {
    const respuesta = await fetch("/api/servicios", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    let resultado;

    try {
      resultado = await respuesta.json();
    } catch {
      resultado = null;
    }

    if (!respuesta.ok) {
      reservaError.textContent =
        (resultado && resultado.mensaje) || "No se pudo crear la reserva";
      reservaError.classList.remove("d-none");
      return;
    }

    modalReserva.hide();
    alert(
      "Reserva creada correctamente. Ya podés pagarla desde la pantalla de pago.",
    );
  } catch (error) {
    reservaError.textContent =
      "No se pudo crear la reserva. Intentalo de nuevo.";
    reservaError.classList.remove("d-none");
  }
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
