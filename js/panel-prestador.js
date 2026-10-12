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

const CAMPOS_POR_SERVICIO = {
  Paseo: {
    duracion: { label: "Duración (minutos)", min: 5, step: 5, value: 30 },
    mascotas: true,
  },
  Guarderia: {
    duracion: { label: "Horas de cuidado", min: 1, step: 1, value: 4 },
    mascotas: true,
  },
  Traslado: {
    duracion: { label: "Distancia estimada (km)", min: 1, step: 1, value: 5 },
    mascotas: false,
  },
};

// Extras que se suman al precio base según la duración, las mascotas (Guardería)
// o los kilómetros (Traslado) cargados en el formulario.
const EXTRAS_POR_SERVICIO = {
  Paseo: {
    baseCantidad: 30,
    bloque: 30,
    costoBloque: 1000,
    costoMascotaExtra: 2000,
  },
  Guarderia: { baseCantidad: 4, costoHoraExtra: 1000, costoMascotaExtra: 2000 },
  Traslado: { baseCantidad: 5, costoPorKm: 800 },
};

function valorNumerico(id) {
  const valor = Number(document.getElementById(id)?.value);
  return Number.isFinite(valor) ? valor : 0;
}

function calcularSugerenciaCaso() {
  const servicio = NOMBRE_SERVICIO[servicioSelect.value];
  const base = obtenerPrecioMinimo();

  if (!servicio || !base) return { precio: 0, detalle: "" };

  const extras = EXTRAS_POR_SERVICIO[servicio];

  if (!extras) return { precio: base, detalle: "" };

  if (servicio === "Traslado") {
    const km = Math.max(0, Math.round(valorNumerico("duracionInput")));
    const costoKm = Math.max(0, km - extras.baseCantidad) * extras.costoPorKm;
    return {
      precio: base + costoKm,
      detalle: `${km} km (la base incluye ${extras.baseCantidad} km)`,
    };
  }

  const mascotas = Math.max(1, Math.round(valorNumerico("mascotasInput")) || 1);
  const cantidad = Math.max(1, Math.round(valorNumerico("duracionInput")) || 1);

  if (servicio === "Guarderia") {
    const costoHoras =
      Math.max(0, cantidad - extras.baseCantidad) * extras.costoHoraExtra;
    const costoMascotas =
      Math.max(0, mascotas - 1) * extras.costoMascotaExtra;
    return {
      precio: base + costoHoras + costoMascotas,
      detalle: `${cantidad} h · ${mascotas} mascota${mascotas > 1 ? "s" : ""}`,
    };
  }

  // Paseo: bloques de 30 minutos adicionales y recargo por mascota extra.
  const bloques = Math.ceil(
    Math.max(0, cantidad - extras.baseCantidad) / extras.bloque,
  );
  const costoMascotas = Math.max(0, mascotas - 1) * extras.costoMascotaExtra;
  return {
    precio: base + bloques * extras.costoBloque + costoMascotas,
    detalle: `${cantidad} minutos · ${mascotas} mascota${mascotas > 1 ? "s" : ""}`,
  };
}

function adaptarCampos() {
  const servicio = NOMBRE_SERVICIO[servicioSelect.value];
  const config = CAMPOS_POR_SERVICIO[servicio];
  if (!config) return;

  const duracionLabel = document.getElementById("duracionLabel");
  const duracionInput = document.getElementById("duracionInput");
  const mascotasField = document.getElementById("mascotasField");

  if (duracionLabel) duracionLabel.textContent = config.duracion.label;

  if (duracionInput) {
    duracionInput.min = config.duracion.min;
    duracionInput.step = config.duracion.step;
    duracionInput.value = config.duracion.value;
  }

  if (mascotasField) mascotasField.classList.toggle("d-none", !config.mascotas);
}

function actualizarSugerenciaNivel() {
  const caso = calcularSugerenciaCaso();
  const servicio = NOMBRE_SERVICIO[servicioSelect.value];

  escribir(
    "nivelSugerenciaNombre",
    nivelActual.charAt(0).toUpperCase() + nivelActual.slice(1),
  );
  escribir("nivelSugerenciaPrecio", caso.precio ? `$${caso.precio}` : "—");

  if (precioInput) {
    precioInput.placeholder = caso.precio ? `$${caso.precio}` : "Ingresá tu precio";
  }

  const detalle = document.getElementById("nivelSugerenciaDetalle");
  if (detalle) {
    detalle.textContent = servicio
      ? `Calculado para tu caso: ${caso.detalle}.`
      : "Elegí un servicio para ver la sugerencia.";
  }
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

async function cargarRangoSugerido() {
  if (!servicioSelect) return;

  const servicio = NOMBRE_SERVICIO[servicioSelect.value];
  const zona = (usuario.zona || "").trim();

  try {
    const respuesta = await fetch(
      `/api/servicios/precios/sugerido?tipo=${encodeURIComponent(servicio)}&zona=${encodeURIComponent(zona)}`,
      { credentials: "include" },
    );
    const datos = await respuesta.json();
    const rango = datos.rango;

    const barra = document.querySelector(".range-progress");
    if (barra) barra.style.width = "0%";

    window.__rangoSugerido = rango || null;

    if (!rango) {
      escribir("precioMin", "—");
      escribir("precioPromedio", "—");
      escribir("precioMax", "—");
      return;
    }

    escribir("precioMin", `$${rango.min}`);
    escribir("precioPromedio", `$${rango.promedio}`);
    escribir("precioMax", `$${rango.max}`);

    if (barra && rango.max > rango.min) {
      const ancho = Math.round(
        ((rango.promedio - rango.min) / (rango.max - rango.min)) * 100,
      );
      barra.style.width = `${Math.min(100, Math.max(15, ancho))}%`;
    }
  } catch {
    escribir("precioMin", "—");
    escribir("precioPromedio", "—");
    escribir("precioMax", "—");
    window.__rangoSugerido = null;
  }
}

function renderizarServicios() {
  const contenedor = document.getElementById("serviciosPrestador");
  if (!contenedor) return;

  if (misServicios.length === 0) {
    contenedor.innerHTML = `<p class="text-secondary small mb-0">Todavía no publicaste servicios.</p>`;
    return;
  }

  contenedor.innerHTML = misServicios
    .map(
      (servicio) => `
        <div class="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2 flex-wrap gap-2">
          <span>
            <strong>${servicio}</strong>
            <span class="text-secondary ms-2">
              ${misPrecios[servicio] ? "$" + misPrecios[servicio] : "Sin precio"}
            </span>
          </span>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill"
                  data-quitar="${servicio}">
            <i class="bi bi-trash me-1"></i> Eliminar
          </button>
        </div>`,
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
  cargarRangoSugerido();

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
    adaptarCampos();
    actualizarSugerenciaNivel();

    servicioSelect.addEventListener("change", () => {
      precioError.classList.add("d-none");
      adaptarCampos();
      actualizarSugerenciaNivel();
      cargarRangoSugerido();
    });

    const duracionInput = document.getElementById("duracionInput");
    const mascotasInput = document.getElementById("mascotasInput");

    if (duracionInput) {
      duracionInput.addEventListener("input", actualizarSugerenciaNivel);
    }

    if (mascotasInput) {
      mascotasInput.addEventListener("input", actualizarSugerenciaNivel);
    }
  }

  const usarNivelSugerencia = document.getElementById("usarNivelSugerencia");
  if (usarNivelSugerencia) {
    usarNivelSugerencia.addEventListener("click", () => {
      const caso = calcularSugerenciaCaso();
      if (!caso.precio) return;
      precioInput.value = caso.precio;
      precioError.classList.add("d-none");
    });
  }

  if (formulario) {
    formulario.addEventListener("submit", async (event) => {
      event.preventDefault();

      const servicio = NOMBRE_SERVICIO[servicioSelect.value];
      const precio = Number(precioInput.value);

      if (!Number.isFinite(precio) || precio <= 0) {
        precioError.classList.remove("d-none");
        return;
      }

      precioError.classList.add("d-none");

      if (servicio === "Traslado") {
        let vehiculoActual = usuario.vehiculo || null;

        try {
          const respuestaPerfil = await fetch("/api/users/me", {
            credentials: "include",
          });
          if (respuestaPerfil.ok) {
            const { usuario: perfil } = await respuestaPerfil.json();
            vehiculoActual = perfil?.vehiculo || null;
            usuario.vehiculo = vehiculoActual;
          }
        } catch {
          /* usar el valor local si falla la consulta */
        }

        if (!vehiculoActual) {
          const tabVehiculo = document.getElementById("tab-vehiculo");
          if (tabVehiculo) tabVehiculo.click();

          alert(
            "Para publicar Traslado primero cargá tu vehículo en la pestaña Vehículo.",
          );
          return;
        }
      }

      if (!misServicios.includes(servicio)) {
        misServicios.push(servicio);
      }

      misPrecios[servicio] = precio;

      try {
        await guardarServicios();
        formulario.reset();
        actualizarSugerenciaNivel();
        alert("Servicio publicado correctamente.");
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Eliminar un servicio publicado
  const contenedorServicios = document.getElementById("serviciosPrestador");

  if (contenedorServicios) {
    contenedorServicios.addEventListener("click", async (event) => {
      const boton = event.target.closest("[data-quitar]");
      if (!boton) return;

      const servicio = boton.dataset.quitar;

      if (!confirm(`¿Eliminar el servicio "${servicio}"?`)) return;

      misServicios = misServicios.filter((s) => s !== servicio);
      delete misPrecios[servicio];
      boton.disabled = true;

      try {
        await guardarServicios();
      } catch (error) {
        alert(error.message);
        boton.disabled = false;
      }
    });
  }

  // Rendimiento real: servicios finalizados y nivel
  (async () => {
    let completados = 0;
    let recientes = 0;

    try {
      const respuesta = await fetch("/api/servicios", {
        credentials: "include",
      });
      const datos = await respuesta.json();
      const servicios = datos.servicios || [];
      completados = servicios.filter((s) => s.estado === "finalizado").length;
      recientes = servicios.filter(
        (s) =>
          s.estado === "finalizado" &&
          s.finalizadoEn &&
          new Date(s.finalizadoEn) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      ).length;
    } catch {
      completados = 0;
      recientes = 0;
    }

    const promedio = Number(usuario.calificacion) || 0;

    nivelActual =
      completados >= 50 && promedio >= 4.5
        ? "top"
        : completados >= 10 && promedio >= 4
          ? "establecido"
          : "nuevo";

    actualizarSugerenciaNivel();

    const badgeNivel = document.getElementById("nivelBadge");
    if (badgeNivel) {
      badgeNivel.textContent =
        `Nivel: ${nivelActual.charAt(0).toUpperCase() + nivelActual.slice(1)}`;
    }

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
      const faltaServicios = Math.max(0, 10 - completados);
      const faltaPromedio = Math.max(0, 4 - promedio);

      resumen.innerHTML =
        `Llevás <strong>${completados} servicios</strong> con <strong>${promedio}★</strong> de promedio.` +
        (nivelActual === "top"
          ? " Estás en el nivel <strong>Top</strong>."
          : nivelActual === "establecido"
            ? " Tu nivel actual es <strong>Establecido</strong>."
            : completados >= 10
              ? ` Para llegar a Establecido te falta <strong>${faltaPromedio.toFixed(1)}★</strong> de promedio.`
              : ` Te faltan <strong>${faltaServicios} servicios</strong> (y +4★) para llegar a Establecido.`);
    }

    const metricas = document.querySelectorAll("#rendimiento .metric-card .metric-number");
    if (metricas.length >= 3) {
      metricas[0].textContent = completados;
      metricas[1].textContent = `${promedio}★`;
      metricas[2].textContent = recientes;
    }

    const tituloRecomendacion = document.getElementById("recomendacionTitulo");
    if (tituloRecomendacion) {
      const textoRecomendacion = document.getElementById("recomendacionTexto");
      const botonRecomendacion = document.getElementById("recomendacionBoton");
      const mercadoPromedio = window.__rangoSugerido?.promedio;
      const misPreciosActuales = Object.values(usuario.preciosServicios || {}).map(Number);

      let titulo;
      let texto;
      let accion;

      if (recientes === 0) {
        titulo = "Te recomendamos mantener tu precio actual";
        texto =
          `Tuviste ${recientes} reservas en las últimas 2 semanas. ` +
          "Antes de subir el precio, esperá a validar que la demanda se sostenga.";
        accion = "Entendido";
      } else if (
        recientes >= 3 &&
        promedio >= 4 &&
        mercadoPromedio &&
        misPreciosActuales.some((precio) => precio < mercadoPromedio * 0.9)
      ) {
        titulo = "Podés subir tu precio";
        texto =
          `Tu demanda es alta (${recientes} reservas recientes) y tenés ${promedio}★ de promedio. ` +
          `El mercado para tu zona promedia $${mercadoPromedio}; podés acercarte a ese rango.`;
        accion = "Usar precio promedio";
      } else {
        titulo = "Tu precio actual está bien";
        texto =
          `Con ${recientes} reservas recientes y ${promedio}★ de promedio, mantené tu precio para consolidar la demanda.`;
        accion = "Mantener precio actual";
      }

      tituloRecomendacion.textContent = titulo;
      textoRecomendacion.textContent = texto;
      botonRecomendacion.textContent = accion;
      botonRecomendacion.onclick = () => {
        if (window.__rangoSugerido && precioInput) {
          precioInput.value = window.__rangoSugerido.promedio;
          precioError?.classList.add("d-none");
        }
      };
    }
  })();
}
