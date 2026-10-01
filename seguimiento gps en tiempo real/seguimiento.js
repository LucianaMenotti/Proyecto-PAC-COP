/* Seguimiento GPS conectado al backend (Dueño y Prestador). */

document.addEventListener("DOMContentLoaded", async () => {
  let servicio = null;
  let horaInicioReal = null;
  let horaFinReal = null;
  let intervaloCronometro = null;
  let intervaloUbicacion = null;
  let watchId = null;
  let mapaVivo = null;
  let marcadorVivo = null;
  let lineaRecorrida = null;
  let mapaFinal = null;
  let distanciaTotal = 0;
  let ultimaPosicion = null;
  const recorridoReal = [];
  const pasos = ["programado", "en-curso", "finalizado"];
  const botonInicio = document.getElementById("btnIniciarDemo");
  const botonFinal = document.getElementById("btnFinalizarDemo");

  const mostrarTexto = (id, texto) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto ?? "—";
  };

  const mostrarError = (texto) => {
    const panel = document.getElementById("panel-programado");
    if (panel) {
      const anterior = panel.querySelector(".mensaje-error");
      if (anterior) anterior.remove();

      const mensaje = document.createElement("p");
      mensaje.className = "mensaje-error";
      mensaje.textContent = texto;
      panel.prepend(mensaje);
    }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatearCronometro = (segundos) => {
    const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
    const segundosRestantes = String(segundos % 60).padStart(2, "0");
    return `${minutos}:${segundosRestantes}`;
  };

  const distanciaHaversine = ([lat1, lon1], [lat2, lon2]) => {
    const radioTierra = 6371;
    const toRad = (grados) => (grados * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const irAPaso = (nombrePaso) => {
    pasos.forEach((paso) => {
      const panel = document.getElementById(`panel-${paso}`);
      if (panel) panel.hidden = paso !== nombrePaso;
    });

    document.querySelectorAll(".paso").forEach((elemento) => {
      const paso = elemento.dataset.paso;
      elemento.classList.remove("activo", "hecho");
      if (paso === nombrePaso) elemento.classList.add("activo");
      if (pasos.indexOf(paso) < pasos.indexOf(nombrePaso))
        elemento.classList.add("hecho");
    });
  };

  const actualizarInsignia = (texto, clase) => {
    const insignia = document.getElementById("insigniaEstado");
    if (insignia) {
      insignia.textContent = texto;
      insignia.className = `insignia ${clase || ""}`;
    }
  };

  const actualizarDatosServicio = () => {
    mostrarTexto("servicioId", servicio.id);
    mostrarTexto("prestadorNombre", servicio.prestador);
    mostrarTexto("servicioNombre", servicio.tipo);
    mostrarTexto("mascotaNombre", servicio.mascota);
    mostrarTexto("horaProgramada", formatearHora(servicio.horaProgramada));
    mostrarTexto("mascotaNombreEspera", servicio.mascota);
    mostrarTexto("prestadorNombreEspera", servicio.prestador);
    mostrarTexto(
      "horaProgramadaGrande",
      formatearHora(servicio.horaProgramada),
    );
  };

  const cargarServicio = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("servicioId");

    let respuesta;
    if (idParam) {
      respuesta = await fetch(`/api/servicios/${idParam}`, {
        credentials: "include",
      });
    } else {
      respuesta = await fetch("/api/servicios/demo", {
        method: "POST",
        credentials: "include",
      });
    }

    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo cargar el servicio");
    }
    servicio = resultado.servicio;
    actualizarDatosServicio();
  };

  const agregarPosicionAlMapa = (posicion) => {
    const punto = [Number(posicion.latitud), Number(posicion.longitud)];
    if (ultimaPosicion)
      distanciaTotal += distanciaHaversine(ultimaPosicion, punto);
    ultimaPosicion = punto;
    recorridoReal.push(punto);
    mostrarTexto("distanciaRecorrida", distanciaTotal.toFixed(2));
    if (marcadorVivo) marcadorVivo.setLatLng(punto);
    if (lineaRecorrida) lineaRecorrida.addLatLng(punto);
    if (mapaVivo) mapaVivo.panTo(punto);
  };

  const inicializarMapaVivo = () => {
    if (mapaVivo) return;
    const puntoInicial = ultimaPosicion || [-26.1849, -58.1731];
    mapaVivo = L.map("mapaVivo", { zoomControl: false }).setView(
      puntoInicial,
      16,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapaVivo);
    marcadorVivo = L.marker(puntoInicial).addTo(mapaVivo);
    lineaRecorrida = L.polyline([puntoInicial], {
      color: "#1F7A74",
      weight: 4,
    }).addTo(mapaVivo);
  };

  const enviarUbicacion = async (latitud, longitud) => {
    const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ latitud, longitud }),
    });
    if (respuesta.ok) {
      agregarPosicionAlMapa({ latitud, longitud });
    }
  };

  const consultarUbicacion = async () => {
    const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
      credentials: "include",
    });
    if (!respuesta.ok) return;
    const { ubicacion } = await respuesta.json();
    if (ubicacion) {
      agregarPosicionAlMapa(ubicacion);
    }
  };

  const iniciarGeolocalizacion = () => {
    if (!navigator.geolocation) {
      enviarUbicacion(-26.1849, -58.1731);
      return;
    }
    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => enviarUbicacion(coords.latitude, coords.longitude),
      () => enviarUbicacion(-26.1849, -58.1731), // Fallback para desarrollo
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  };

  const iniciarCronometro = () => {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = setInterval(() => {
      const segundos = Math.floor(
        (Date.now() - horaInicioReal.getTime()) / 1000,
      );
      mostrarTexto("cronometro", formatearCronometro(Math.max(0, segundos)));
    }, 1000);
  };

  const detenerSeguimiento = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    clearInterval(intervaloCronometro);
    clearInterval(intervaloUbicacion);
  };

  const mostrarServicioEnCurso = () => {
    horaInicioReal = servicio.iniciadoEn
      ? new Date(servicio.iniciadoEn)
      : new Date();
    mostrarTexto("horaInicioReal", formatearHora(horaInicioReal));
    actualizarInsignia("En curso", "en-curso");
    irAPaso("en-curso");
    inicializarMapaVivo();
    iniciarCronometro();

    // Solo el prestador o quien gestiona puede finalizar
    botonFinal.disabled = !servicio.puedeGestionar;
    if (!servicio.puedeGestionar) {
      botonFinal.style.display = "none";
    }

    consultarUbicacion();
    intervaloUbicacion = setInterval(consultarUbicacion, 5000);
  };

  const mostrarServicioFinalizado = () => {
    detenerSeguimiento();
    actualizarInsignia("Finalizado", "finalizado");

    const inicio = servicio.iniciadoEn
      ? new Date(servicio.iniciadoEn)
      : new Date();
    const fin = servicio.finalizadoEn
      ? new Date(servicio.finalizadoEn)
      : new Date();

    mostrarTexto("finHoraInicio", formatearHora(inicio));
    mostrarTexto("finHoraFin", formatearHora(fin));

    const minutos = Math.max(
      1,
      Math.round((fin.getTime() - inicio.getTime()) / 60000),
    );
    mostrarTexto("finDuracion", `${minutos} min`);
    mostrarTexto(
      "finDistancia",
      distanciaTotal > 0 ? distanciaTotal.toFixed(2) : "1.20",
    );

    irAPaso("finalizado");
    inicializarMapaFinal();

    // Gestión del panel de calificación
    const caja = document.getElementById("cajaCalificacion");
    const mensaje = document.getElementById("mensajeCalificado");

    if (servicio.calificacion) {
      if (caja) caja.classList.add("d-none");
      if (mensaje) {
        mensaje.textContent = `✓ Ya calificaste este servicio con ${servicio.calificacion}★.`;
        mensaje.classList.remove("d-none");
      }
    } else {
      if (caja) caja.classList.remove("d-none");
      if (mensaje) mensaje.classList.add("d-none");
    }
  };

  const inicializarMapaFinal = () => {
    if (mapaFinal || !document.getElementById("mapaFinal")) return;
    const puntos =
      recorridoReal.length > 0
        ? recorridoReal
        : [
            [-26.1849, -58.1731],
            [-26.186, -58.1745],
            [-26.1872, -58.176],
          ];
    mapaFinal = L.map("mapaFinal", {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapaFinal);
    const linea = L.polyline(puntos, { color: "#FF6F52", weight: 4 }).addTo(
      mapaFinal,
    );
    L.marker(puntos[0]).addTo(mapaFinal);
    L.marker(puntos[puntos.length - 1]).addTo(mapaFinal);
    mapaFinal.fitBounds(linea.getBounds(), { padding: [24, 24] });
  };

  // Botón Iniciar (solo prestador)
  botonInicio.addEventListener("click", async () => {
    if (!servicio) return;
    try {
      const respuesta = await fetch(`/api/servicios/${servicio.id}/iniciar`, {
        method: "POST",
        credentials: "include",
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje);
      servicio = resultado.servicio;
      mostrarServicioEnCurso();
      iniciarGeolocalizacion();
    } catch (error) {
      mostrarError(error.message || "No se pudo iniciar el servicio");
    }
  });

  // Botón Finalizar (solo prestador)
  botonFinal.addEventListener("click", async () => {
    if (!servicio) return;
    try {
      const respuesta = await fetch(`/api/servicios/${servicio.id}/finalizar`, {
        method: "POST",
        credentials: "include",
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje);
      servicio = resultado.servicio;
      mostrarServicioFinalizado();
    } catch (error) {
      mostrarError(error.message || "No se pudo finalizar el servicio");
    }
  });

  // --- CARGA INICIAL ---
  try {
    await cargarServicio();

    if (servicio.estado === "programado") {
      botonInicio.disabled = !servicio.puedeGestionar;
      if (!servicio.puedeGestionar) {
        mostrarError(
          "El servicio está programado. Se activará cuando el prestador comience el recorrido.",
        );
      }
    } else if (servicio.estado === "en-curso") {
      mostrarServicioEnCurso();
    } else if (servicio.estado === "finalizado") {
      mostrarServicioFinalizado();
    }
  } catch (error) {
    botonInicio.disabled = true;
    botonFinal.disabled = true;
    mostrarError(error.message || "Iniciá sesión para usar el seguimiento");
  }

  // --- LÓGICA DE ESTRELLAS DE CALIFICACIÓN ---
  let puntuacionSeleccionada = 5;
  const estrellasSpan = document.querySelectorAll("#estrellas span");

  const pintarEstrellas = (valor) => {
    estrellasSpan.forEach((span) => {
      const spanValor = Number(span.dataset.valor);
      span.style.color = spanValor <= valor ? "#ffc107" : "#e4e5e7";
    });
  };

  if (estrellasSpan.length > 0) {
    pintarEstrellas(puntuacionSeleccionada);
    estrellasSpan.forEach((span) => {
      span.addEventListener("click", () => {
        puntuacionSeleccionada = Number(span.dataset.valor);
        pintarEstrellas(puntuacionSeleccionada);
      });
    });
  }

  const btnCalificar = document.getElementById("btnEnviarCalificacion");
  if (btnCalificar) {
    btnCalificar.addEventListener("click", async () => {
      if (!servicio || !servicio.id) return;
      const comentario =
        document.getElementById("comentarioCalificacion")?.value || "";

      try {
        btnCalificar.disabled = true;
        const respuesta = await fetch(
          `/api/servicios/${servicio.id}/calificar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              nota: puntuacionSeleccionada,
              comentario: comentario,
            }),
          },
        );

        const data = await respuesta.json();
        if (!respuesta.ok)
          throw new Error(data.mensaje || "Error al calificar");

        const caja = document.getElementById("cajaCalificacion");
        const mensaje = document.getElementById("mensajeCalificado");
        if (caja) caja.classList.add("d-none");
        if (mensaje) {
          mensaje.textContent = `✓ ¡Gracias! Calificaste con ${puntuacionSeleccionada}★.`;
          mensaje.classList.remove("d-none");
        }
      } catch (err) {
        alert(err.message);
        btnCalificar.disabled = false;
      }
    });
  }
});
