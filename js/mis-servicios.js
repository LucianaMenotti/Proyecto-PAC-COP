import { cargarContadorNotificaciones } from "./notificaciones-badge.js";
import { escapar, obtenerEstadoReclamo } from "./reclamos-comun.js";

const usuario = await window.PacCopAuth.requireSession(["dueño", "prestador"]);

if (!usuario) {
  throw new Error("No se pudo obtener la sesión del usuario");
}

const MAX_IMAGENES = 5;
const MAX_TAMANO_IMAGEN = 5242880;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const INTERVALO_ACTUALIZACION = 15000;

const mensajeCarga = document.getElementById("mensajeCarga");
const mensajeVacio = document.getElementById("mensajeVacio");
const mensajeError = document.getElementById("mensajeError");
const mensajeExito = document.getElementById("mensajeExito");
const listaServicios = document.getElementById("listaServicios");

const modalElemento = document.getElementById("modalReclamo");
const formReclamo = document.getElementById("formReclamo");
const reclamoServicio = document.getElementById("reclamoServicio");
const reclamoFechaHora = document.getElementById("reclamoFechaHora");
const reclamoDescripcion = document.getElementById("reclamoDescripcion");
const reclamoEvidencias = document.getElementById("reclamoEvidencias");
const reclamoVistaPrevia = document.getElementById("reclamoVistaPrevia");
const reclamoError = document.getElementById("reclamoError");
const btnEnviarReclamo = document.getElementById("btnEnviarReclamo");

const modalReclamo = new bootstrap.Modal(modalElemento);

let servicios = [];
let reclamos = [];
let firmaDatos = "";
let servicioReclamado = null;
let relojReclamo = null;

const obtenerEstado = (estado) => {
  switch (estado) {
    case "programado":
      return { texto: "Programado", clase: "bg-warning text-dark" };

    case "aceptado":
      return { texto: "Aceptado", clase: "bg-success" };

    case "en-curso":
      return { texto: "En curso", clase: "bg-primary" };

    case "finalizado":
      return { texto: "Finalizado", clase: "bg-secondary" };

    case "rechazado":
      return { texto: "Rechazado", clase: "bg-danger" };

    default:
      return { texto: estado || "Sin estado", clase: "bg-secondary" };
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) {
    return "Sin fecha programada";
  }

  return new Date(fecha).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const crearBotonReclamo = (servicio, reclamoEmitido) => {
  if (servicio.estado !== "finalizado") {
    return `
            <button type="button" class="btn btn-outline-danger w-100 mt-2" disabled>
                Reclamar
            </button>
            <small class="text-secondary d-block mt-1">
                Disponible cuando el servicio esté finalizado.
            </small>
        `;
  }

  if (reclamoEmitido) {
    const estadoReclamo = obtenerEstadoReclamo(reclamoEmitido.estado);

    return `
            <button type="button" class="btn btn-outline-secondary w-100 mt-2" disabled>
                Reclamo enviado
            </button>
            <p class="small mt-2 mb-0">
                Estado del reclamo:
                <span class="badge ${estadoReclamo.clase}">${estadoReclamo.texto}</span>
            </p>
        `;
  }

  return `
        <button
            type="button"
            class="btn btn-outline-danger w-100 mt-2"
            data-reclamar="${servicio.id}"
        >
            Reclamar
        </button>
    `;
};

const crearBloqueReclamoRecibido = (reclamoRecibido) => {
  if (!reclamoRecibido) {
    return "";
  }

  const estadoReclamo = obtenerEstadoReclamo(reclamoRecibido.estado);

  return `
        <p class="small mt-2 mb-0">
            Reclamo recibido:
            <span class="badge ${estadoReclamo.clase}">${estadoReclamo.texto}</span>
        </p>
    `;
};

const renderizar = () => {
  listaServicios.innerHTML = "";
  mensajeVacio.classList.toggle("d-none", servicios.length > 0);

  servicios.forEach((servicio) => {
    const estado = obtenerEstado(servicio.estado);

    const puedeAbrirChat =
      servicio.estado === "aceptado" || servicio.estado === "en-curso";

    const reclamoEmitido = reclamos.find(
      (reclamo) =>
        Number(reclamo.servicioId) === Number(servicio.id) &&
        reclamo.soyReclamante,
    );

    const reclamoRecibido = reclamos.find(
      (reclamo) =>
        Number(reclamo.servicioId) === Number(servicio.id) &&
        !reclamo.soyReclamante,
    );

    const lineaPrestador =
      usuario.rol === "prestador"
        ? ""
        : `
                    <p class="mb-2">
                        <strong>Prestador:</strong>
                        ${escapar(servicio.prestador || "No especificado")}
                    </p>
                `;

    const tarjeta = document.createElement("div");

    tarjeta.className = "col-md-6 col-lg-4";

    tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0 rounded-4">
                <div class="card-body p-4">

                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h2 class="h5 fw-bold mb-0">
                            ${escapar(servicio.tipo || "Servicio")}
                        </h2>

                        <span class="badge ${estado.clase}">
                            ${estado.texto}
                        </span>
                    </div>

                    <p class="mb-2">
                        <strong>Mascota:</strong>
                        ${escapar(servicio.mascota || "No especificada")}
                    </p>

                    ${lineaPrestador}

                    <p class="mb-2">
                        <strong>Fecha:</strong>
                        ${formatearFecha(servicio.horaProgramada)}
                    </p>

                    <p class="mb-4">
                        <strong>Monto:</strong>
                        $${Number(servicio.monto || 0).toLocaleString("es-AR")}
                    </p>

                    ${
                      puedeAbrirChat
                        ? `
                                <a
                                    href="../prestadordeServicio/chatApp.html?servicioId=${servicio.id}"
                                    class="btn btn-primary w-100"
                                >
                                    Abrir chat
                                </a>
                            `
                        : `
                                <button class="btn btn-outline-secondary w-100" disabled>
                                    Chat no disponible
                                </button>
                            `
                    }

                    ${crearBotonReclamo(servicio, reclamoEmitido)}
                    ${crearBloqueReclamoRecibido(reclamoRecibido)}

                </div>
            </div>
        `;

    listaServicios.appendChild(tarjeta);
  });
};

const cargarDatos = async () => {
  const respuestaServicios = await fetch("/api/servicios", {
    credentials: "include",
  });

  const datosServicios = await respuestaServicios.json();

  if (!respuestaServicios.ok) {
    throw new Error(
      datosServicios.mensaje || "No se pudieron cargar los servicios",
    );
  }

  const respuestaReclamos = await fetch("/api/reclamos", {
    credentials: "include",
  });

  const datosReclamos = respuestaReclamos.ok
    ? await respuestaReclamos.json()
    : { reclamos: [] };

  servicios = datosServicios.servicios || [];
  reclamos = datosReclamos.reclamos || [];

  const firma = JSON.stringify([
    servicios.map((servicio) => [servicio.id, servicio.estado]),
    reclamos.map((reclamo) => [reclamo.id, reclamo.estado]),
  ]);

  const cambio = firma !== firmaDatos;

  firmaDatos = firma;

  return cambio;
};

const mostrarErrorReclamo = (texto) => {
  reclamoError.textContent = texto;
  reclamoError.classList.remove("d-none");
};

const ocultarErrorReclamo = () => {
  reclamoError.textContent = "";
  reclamoError.classList.add("d-none");
};

const mostrarExito = (texto) => {
  mensajeExito.textContent = texto;
  mensajeExito.classList.remove("d-none");

  setTimeout(() => {
    mensajeExito.classList.add("d-none");
  }, 6000);
};

const actualizarReloj = () => {
  reclamoFechaHora.value = new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
};

const limpiarVistaPrevia = () => {
  reclamoVistaPrevia.querySelectorAll("img").forEach((imagen) => {
    URL.revokeObjectURL(imagen.src);
  });

  reclamoVistaPrevia.innerHTML = "";
};

const validarArchivos = (archivos) => {
  if (archivos.length > MAX_IMAGENES) {
    return "Podés adjuntar hasta 5 imágenes.";
  }

  if (archivos.some((archivo) => !TIPOS_IMAGEN.includes(archivo.type))) {
    return "Solo se permiten imágenes JPG, PNG o WEBP.";
  }

  if (archivos.some((archivo) => archivo.size > MAX_TAMANO_IMAGEN)) {
    return "Cada imagen puede pesar hasta 5 MB.";
  }

  return "";
};

const abrirModalReclamo = (servicioId) => {
  servicioReclamado = servicios.find(
    (servicio) => Number(servicio.id) === Number(servicioId),
  );

  if (!servicioReclamado || servicioReclamado.estado !== "finalizado") {
    return;
  }

  formReclamo.reset();
  limpiarVistaPrevia();
  ocultarErrorReclamo();

  reclamoServicio.textContent = `${servicioReclamado.tipo} - ${servicioReclamado.mascota} (servicio #${servicioReclamado.id})`;

  actualizarReloj();
  clearInterval(relojReclamo);
  relojReclamo = setInterval(actualizarReloj, 1000);

  modalReclamo.show();
};

listaServicios.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-reclamar]");

  if (!boton) {
    return;
  }

  abrirModalReclamo(boton.dataset.reclamar);
});

modalElemento.addEventListener("hidden.bs.modal", () => {
  clearInterval(relojReclamo);
  limpiarVistaPrevia();
});

reclamoEvidencias.addEventListener("change", () => {
  limpiarVistaPrevia();
  ocultarErrorReclamo();

  const archivos = Array.from(reclamoEvidencias.files);
  const error = validarArchivos(archivos);

  if (error) {
    mostrarErrorReclamo(error);
    reclamoEvidencias.value = "";
    return;
  }

  archivos.forEach((archivo) => {
    const imagen = document.createElement("img");

    imagen.src = URL.createObjectURL(archivo);
    imagen.alt = "Vista previa de la evidencia";
    imagen.className = "rounded border";
    imagen.style.width = "72px";
    imagen.style.height = "72px";
    imagen.style.objectFit = "cover";

    reclamoVistaPrevia.appendChild(imagen);
  });
});

formReclamo.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  ocultarErrorReclamo();

  if (!servicioReclamado) {
    return;
  }

  const descripcion = reclamoDescripcion.value.trim();

  if (descripcion.length < 10) {
    mostrarErrorReclamo("La descripción debe tener al menos 10 caracteres.");
    return;
  }

  const archivos = Array.from(reclamoEvidencias.files);
  const errorArchivos = validarArchivos(archivos);

  if (errorArchivos) {
    mostrarErrorReclamo(errorArchivos);
    return;
  }

  const datos = new FormData();

  datos.append("servicioId", servicioReclamado.id);
  datos.append("descripcion", descripcion);
  archivos.forEach((archivo) => datos.append("evidencias", archivo));

  btnEnviarReclamo.disabled = true;
  btnEnviarReclamo.textContent = "Enviando...";

  try {
    const respuesta = await fetch("/api/reclamos", {
      method: "POST",
      credentials: "include",
      body: datos,
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo enviar el reclamo");
    }

    modalReclamo.hide();

    await cargarDatos();
    renderizar();
    await cargarContadorNotificaciones();

    mostrarExito("Reclamo enviado. Podés seguir su estado en este servicio.");
  } catch (error) {
    mostrarErrorReclamo(error.message);
  } finally {
    btnEnviarReclamo.disabled = false;
    btnEnviarReclamo.textContent = "Enviar reclamo";
  }
});

const iniciar = async () => {
  try {
    await cargarDatos();

    mensajeCarga.classList.add("d-none");
    renderizar();

    await cargarContadorNotificaciones();

    setInterval(async () => {
      try {
        if (await cargarDatos()) {
          renderizar();
        }

        await cargarContadorNotificaciones();
      } catch (error) {
        console.error("Error al actualizar los servicios:", error);
      }
    }, INTERVALO_ACTUALIZACION);
  } catch (error) {
    console.error("Error al cargar mis servicios:", error);

    mensajeCarga.classList.add("d-none");
    mensajeError.textContent =
      error.message || "No se pudieron cargar tus servicios.";

    mensajeError.classList.remove("d-none");
  }
};

iniciar();
