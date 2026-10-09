/* Seguimiento GPS conectado al backend (Dueño y Prestador). */

document.addEventListener("DOMContentLoaded", async () => {
  let servicio = null;
  let horaInicioReal = null;
  let intervaloCronometro = null;
  let intervaloUbicacion = null;
  let intervaloEstado = null;
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

  const parametros = new URLSearchParams(window.location.search);
  const servicioId = parametros.get("servicioId");

  const formularioCalificacion = document.getElementById("form-calificacion");

  const panelCalificacion = document.getElementById("panel-calificacion");

  const mensajeCalificacion = document.getElementById("mensaje-calificacion");

  const mostrarTexto = (id, texto) => {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = texto ?? "—";
    }
  };

  const mostrarError = (texto) => {
    const panel =
      document.getElementById("panel-programado") ||
      document.querySelector(".panel");

    if (!panel) return;

    const anterior = panel.querySelector(".mensaje-error");

    if (anterior) {
      anterior.remove();
    }

    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-error";
    mensaje.textContent = texto;

    panel.prepend(mensaje);
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "—";

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return "—";
    }

    return fechaConvertida.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

      if (panel) {
        panel.hidden = paso !== nombrePaso;
      }
    });

    document.querySelectorAll(".paso").forEach((elemento) => {
      const paso = elemento.dataset.paso;

      elemento.classList.remove("activo", "hecho");

      if (paso === nombrePaso) {
        elemento.classList.add("activo");
      }

      if (pasos.indexOf(paso) < pasos.indexOf(nombrePaso)) {
        elemento.classList.add("hecho");
      }
    });
  };

  const actualizarInsignia = (texto, clase) => {
    const insignia = document.getElementById("insigniaEstado");

    if (!insignia) return;

    insignia.textContent = texto;
    insignia.className = `insignia ${clase || ""}`;
  };

  const actualizarDatosServicio = () => {
    if (!servicio) return;

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
    if (!servicioId) {
      throw new Error("No se indicó el servicio que querés consultar");
    }

    const respuesta = await fetch(`/api/servicios/${servicioId}`, {
      credentials: "include",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo cargar el servicio");
    }

    servicio = resultado.servicio;
    actualizarDatosServicio();
  };

  const agregarPosicionAlMapa = (posicion) => {
    const latitud = Number(posicion.latitud);
    const longitud = Number(posicion.longitud);

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      return;
    }

    const punto = [latitud, longitud];

    if (
      ultimaPosicion &&
      ultimaPosicion[0] === punto[0] &&
      ultimaPosicion[1] === punto[1]
    ) {
      return;
    }

    if (ultimaPosicion) {
      distanciaTotal += distanciaHaversine(ultimaPosicion, punto);
    }

    ultimaPosicion = punto;
    recorridoReal.push(punto);

    mostrarTexto("distanciaRecorrida", distanciaTotal.toFixed(2));

    if (marcadorVivo) {
      marcadorVivo.setLatLng(punto);
    }

    if (lineaRecorrida) {
      lineaRecorrida.addLatLng(punto);
    }

    if (mapaVivo) {
      mapaVivo.panTo(punto);
    }
  };

  const inicializarMapaVivo = () => {
    if (mapaVivo) return;

    const puntoInicial = ultimaPosicion || [-26.1849, -58.1731];

    mapaVivo = L.map("mapaVivo", {
      zoomControl: false,
    }).setView(puntoInicial, 16);

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
    if (!servicio) return;

    const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        latitud,
        longitud,
      }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo guardar la ubicación");
    }

    agregarPosicionAlMapa({
      latitud,
      longitud,
    });
  };

  const consultarUbicacion = async () => {
    if (!servicio) return;

    try {
      const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
        credentials: "include",
      });

      if (!respuesta.ok) {
        return;
      }

      const resultado = await respuesta.json();

      if (resultado.ubicacion) {
        agregarPosicionAlMapa(resultado.ubicacion);
      }
    } catch (error) {
      console.error("Error al consultar la ubicación:", error);
    }
  };

  const consultarEstadoServicio = async () => {
    if (!servicio) return;

    try {
      const respuesta = await fetch(`/api/servicios/${servicio.id}`, {
        credentials: "include",
      });

      if (!respuesta.ok) {
        return;
      }

      const resultado = await respuesta.json();
      const servicioActualizado = resultado.servicio;

      if (!servicioActualizado) {
        return;
      }

      const estadoAnterior = servicio.estado;

      servicio = servicioActualizado;
      actualizarDatosServicio();

      if (estadoAnterior !== "en-curso" && servicio.estado === "en-curso") {
        mostrarServicioEnCurso();

        if (servicio.puedeGestionar) {
          iniciarGeolocalizacion();
        }
      }

      if (estadoAnterior !== "finalizado" && servicio.estado === "finalizado") {
        mostrarServicioFinalizado();
      }
    } catch (error) {
      console.error("Error al consultar el estado del servicio:", error);
    }
  };

  const iniciarGeolocalizacion = () => {
    if (watchId !== null) {
      return;
    }

    if (!navigator.geolocation) {
      mostrarError("Este navegador no permite obtener la ubicación.");
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        enviarUbicacion(coords.latitude, coords.longitude).catch((error) => {
          console.error("No se pudo enviar la ubicación:", error);
        });
      },
      () => {
        mostrarError(
          "No se pudo obtener la ubicación. Revisá el permiso del navegador.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );
  };

  const iniciarCronometro = () => {
    if (intervaloCronometro) {
      clearInterval(intervaloCronometro);
    }

    if (!horaInicioReal) return;

    intervaloCronometro = setInterval(() => {
      const segundos = Math.floor(
        (Date.now() - horaInicioReal.getTime()) / 1000,
      );

      mostrarTexto("cronometro", formatearCronometro(Math.max(0, segundos)));
    }, 1000);
  };

  const detenerSeguimiento = () => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    clearInterval(intervaloCronometro);
    clearInterval(intervaloUbicacion);
    clearInterval(intervaloEstado);

    intervaloCronometro = null;
    intervaloUbicacion = null;
    intervaloEstado = null;
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

    if (botonFinal) {
      botonFinal.disabled = !servicio.puedeGestionar;
      botonFinal.style.display = servicio.puedeGestionar ? "" : "none";
    }

    consultarUbicacion();

    if (!intervaloUbicacion) {
      intervaloUbicacion = setInterval(consultarUbicacion, 5000);
    }

    if (!intervaloEstado) {
      intervaloEstado = setInterval(consultarEstadoServicio, 5000);
    }
  };

  const mostrarServicioFinalizado = () => {
    detenerSeguimiento();

    actualizarInsignia("Finalizado", "finalizado");

    const inicio = servicio.iniciadoEn ? new Date(servicio.iniciadoEn) : null;

    const fin = servicio.finalizadoEn ? new Date(servicio.finalizadoEn) : null;

    mostrarTexto("finHoraInicio", formatearHora(inicio));
    mostrarTexto("finHoraFin", formatearHora(fin));

    if (inicio && fin) {
      const duracion = Math.max(0, Math.floor((fin - inicio) / 1000));

      mostrarTexto("finDuracion", `${Math.floor(duracion / 60)} min`);
    }

    mostrarTexto("finDistancia", distanciaTotal.toFixed(2));

    irAPaso("finalizado");
    inicializarMapaFinal();

    if (panelCalificacion && servicio.puedeCalificar && !servicio.calificado) {
      panelCalificacion.hidden = false;
    }

    if (
      panelCalificacion &&
      (servicio.calificado || !servicio.puedeCalificar)
    ) {
      panelCalificacion.hidden = true;
    }
  };

  const inicializarMapaFinal = () => {
    if (mapaFinal || !document.getElementById("mapaFinal")) {
      return;
    }

    const puntos =
      recorridoReal.length > 0 ? recorridoReal : [[-26.1849, -58.1731]];

    mapaFinal = L.map("mapaFinal", {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(mapaFinal);

    const linea = L.polyline(puntos, {
      color: "#FF6F52",
      weight: 4,
    }).addTo(mapaFinal);

    L.marker(puntos[0]).addTo(mapaFinal);

    if (puntos.length > 1) {
      L.marker(puntos[puntos.length - 1]).addTo(mapaFinal);
    }

    mapaFinal.fitBounds(linea.getBounds(), {
      padding: [24, 24],
    });
  };

  if (botonInicio) {
    botonInicio.addEventListener("click", async () => {
      if (!servicio) return;

      try {
        const respuesta = await fetch(`/api/servicios/${servicio.id}/iniciar`, {
          method: "POST",
          credentials: "include",
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje || "No se pudo iniciar el servicio",
          );
        }

        servicio = resultado.servicio;

        mostrarServicioEnCurso();
        iniciarGeolocalizacion();
      } catch (error) {
        mostrarError(error.message);
      }
    });
  }

  if (botonFinal) {
    botonFinal.addEventListener("click", async () => {
      if (!servicio) return;

      try {
        const respuesta = await fetch(
          `/api/servicios/${servicio.id}/finalizar`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje || "No se pudo finalizar el servicio",
          );
        }

        servicio = resultado.servicio;
        mostrarServicioFinalizado();
      } catch (error) {
        mostrarError(error.message);
      }
    });
  }

  if (formularioCalificacion) {
    formularioCalificacion.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      if (!servicio || servicio.estado !== "finalizado") {
        mensajeCalificacion.textContent = "El servicio todavía no finalizó.";
        return;
      }

      const puntuacion = Number(document.getElementById("puntuacion").value);

      const comentario = document.getElementById("comentario").value.trim();

      if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
        mensajeCalificacion.textContent =
          "Seleccioná una puntuación entre 1 y 5.";
        return;
      }

      const botonEnviar = formularioCalificacion.querySelector(
        'button[type="submit"]',
      );

      try {
        if (botonEnviar) {
          botonEnviar.disabled = true;
        }

        const respuesta = await fetch(
          `/api/servicios/${servicio.id}/calificacion`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              puntuacion,
              comentario,
            }),
          },
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            resultado.mensaje || "No se pudo guardar la calificación",
          );
        }

        servicio.calificado = true;
        servicio.puedeCalificar = false;

        mensajeCalificacion.textContent =
          "La calificación se guardó correctamente.";

        formularioCalificacion.reset();

        if (panelCalificacion) {
          panelCalificacion.hidden = true;
        }
      } catch (error) {
        mensajeCalificacion.textContent = error.message;

        if (botonEnviar) {
          botonEnviar.disabled = false;
        }
      }
    });
  }

  if (botonInicio) {
    botonInicio.disabled = true;
  }

  if (botonFinal) {
    botonFinal.disabled = true;
  }

  try {
    await cargarServicio();

    if (servicio.estado === "programado") {
      if (botonInicio) {
        botonInicio.disabled = !servicio.puedeGestionar;
      }

      if (!servicio.puedeGestionar) {
        mostrarError(
          "El servicio está programado. El prestador debe iniciarlo.",
        );
      }

      // Mientras esté programado, seguimos consultando por si el
      // prestador lo acepta e inicia (transición a "en-curso").
      if (!intervaloEstado) {
        intervaloEstado = setInterval(consultarEstadoServicio, 5000);
      }
    }

    if (servicio.estado === "aceptado") {
      if (botonInicio) {
        botonInicio.disabled = !servicio.puedeGestionar;
      }

      if (!intervaloEstado) {
        intervaloEstado = setInterval(consultarEstadoServicio, 5000);
      }
    }

    if (servicio.estado === "en-curso") {
      mostrarServicioEnCurso();

      if (servicio.puedeGestionar) {
        iniciarGeolocalizacion();
      }
    }

    if (servicio.estado === "finalizado") {
      mostrarServicioFinalizado();
    }
  } catch (error) {
    if (botonInicio) {
      botonInicio.disabled = true;
    }

    if (botonFinal) {
      botonFinal.disabled = true;
    }

    mostrarError(error.message);
  }
});
