import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiJson, enviarJson } from "../config/api";
import { distanciaHaversine, formatearCronometro, PUNTO_INICIAL } from "../helpers/geografia";
import L, { agregarCapaBase } from "../helpers/mapa";
import { useEventoTiempoReal } from "./useTiempoReal";

const INTERVALO_ACTUALIZACION = 5000;

// Seguimiento GPS de una reserva (/seguimiento?servicioId=ID), para el dueño y para el prestador.
// - El prestador inicia/finaliza el servicio y su navegador envía la ubicación (watchPosition).
// - El dueño ve la posición, el estado y, al finalizar, puede calificar al prestador.
// Ubicación y cambios de estado llegan por SSE (/api/eventos) y se refuerzan con sondeo cada 5 s.
export function useSeguimiento() {
  const [parametros] = useSearchParams();
  const servicioId = parametros.get("servicioId") || parametros.get("servicio") || parametros.get("id");

  const [servicio, setServicio] = useState(null);
  const [paso, setPaso] = useState("programado");
  const [error, setError] = useState("");
  const [puedeIniciar, setPuedeIniciar] = useState(false);
  const [puedeFinalizar, setPuedeFinalizar] = useState(false);
  const [horaInicioReal, setHoraInicioReal] = useState(null);
  const [horaFinReal, setHoraFinReal] = useState(null);
  const [cronometro, setCronometro] = useState("00:00");
  const [distancia, setDistancia] = useState(0);
  const [calificacion, setCalificacion] = useState({ visible: false, mensaje: "", enviando: false });

  const servicioRef = useRef(null);
  const pasoRef = useRef("programado");
  const watchId = useRef(null);
  const distanciaTotal = useRef(0);
  const ultimaPosicion = useRef(null);
  const recorridoReal = useRef([]);
  const mapaVivo = useRef(null);
  const marcadorVivo = useRef(null);
  const lineaRecorrida = useRef(null);
  const contenedorVivo = useRef(null);
  const contenedorFinal = useRef(null);

  const cambiarPaso = useCallback((nuevoPaso) => {
    pasoRef.current = nuevoPaso;
    setPaso(nuevoPaso);
  }, []);

  const agregarPosicionAlMapa = useCallback((posicion) => {
    const latitud = Number(posicion.latitud);
    const longitud = Number(posicion.longitud);

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      return;
    }

    const punto = [latitud, longitud];

    if (
      ultimaPosicion.current &&
      ultimaPosicion.current[0] === punto[0] &&
      ultimaPosicion.current[1] === punto[1]
    ) {
      return;
    }

    if (ultimaPosicion.current) {
      distanciaTotal.current += distanciaHaversine(ultimaPosicion.current, punto);
    }

    ultimaPosicion.current = punto;
    recorridoReal.current.push(punto);
    setDistancia(distanciaTotal.current);

    const mapa = mapaVivo.current;

    if (!mapa) {
      return;
    }

    if (marcadorVivo.current) {
      marcadorVivo.current.setLatLng(punto);
    } else {
      marcadorVivo.current = L.marker(punto).addTo(mapa);
    }

    if (lineaRecorrida.current) {
      lineaRecorrida.current.addLatLng(punto);
    } else {
      lineaRecorrida.current = L.polyline([punto], { color: "#1F7A74", weight: 4 }).addTo(mapa);
    }

    mapa.setView(punto, Math.max(mapa.getZoom(), 16));
  }, []);

  const consultarUbicacion = useCallback(async () => {
    if (!servicioRef.current) {
      return;
    }

    const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}/ubicacion`);

    if (ok && datos.ubicacion) {
      agregarPosicionAlMapa(datos.ubicacion);
    }
  }, [agregarPosicionAlMapa]);

  const enviarUbicacion = useCallback(
    async (latitud, longitud) => {
      if (!servicioRef.current) {
        return;
      }

      const { ok, datos } = await enviarJson(`/api/servicios/${servicioRef.current.id}/ubicacion`, "POST", {
        latitud,
        longitud
      });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo guardar la ubicación");
      }

      agregarPosicionAlMapa({ latitud, longitud });
    },
    [agregarPosicionAlMapa]
  );

  // Pide el permiso de ubicación al prestador antes de iniciar, para que el navegador no lo bloquee después
  const solicitarPermisoUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
      );
    } catch {
      /* si el navegador no lo permite, se pide al iniciar el servicio */
    }
  }, []);

  const iniciarGeolocalizacion = useCallback(() => {
    if (watchId.current !== null) {
      return;
    }

    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener la ubicación.");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        enviarUbicacion(coords.latitude, coords.longitude).catch((fallo) =>
          console.error("No se pudo enviar la ubicación:", fallo)
        );
      },
      () =>
        setError(
          "No se pudo obtener la ubicación. Habilitá el permiso de ubicación del navegador (ícono del candado junto a la dirección) y recargá la página."
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [enviarUbicacion]);

  const detenerGeolocalizacion = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = null;
  }, []);

  const mostrarServicioEnCurso = useCallback(
    (datos) => {
      setHoraInicioReal(datos.iniciadoEn ? new Date(datos.iniciadoEn) : new Date());
      setPuedeIniciar(false);
      setPuedeFinalizar(Boolean(datos.puedeGestionar));
      cambiarPaso("en-curso");
    },
    [cambiarPaso]
  );

  const mostrarServicioFinalizado = useCallback(
    (datos) => {
      detenerGeolocalizacion();
      setPuedeIniciar(false);
      setPuedeFinalizar(false);
      setHoraInicioReal(datos.iniciadoEn ? new Date(datos.iniciadoEn) : null);
      setHoraFinReal(datos.finalizadoEn ? new Date(datos.finalizadoEn) : null);
      setCalificacion((anterior) => ({
        ...anterior,
        visible: Boolean(datos.puedeCalificar && !datos.calificado)
      }));
      cambiarPaso("finalizado");
    },
    [cambiarPaso, detenerGeolocalizacion]
  );

  // Aplica el estado que informa el backend (carga inicial, sondeo y avisos en tiempo real)
  const aplicarServicio = useCallback(
    (datos, anterior) => {
      servicioRef.current = datos;
      setServicio(datos);

      const estadoAnterior = anterior?.estado;

      if (datos.estado === "programado" || datos.estado === "aceptado") {
        setPuedeIniciar(Boolean(datos.puedeGestionar && datos.estado === "aceptado"));

        if (!anterior && datos.puedeGestionar) {
          solicitarPermisoUbicacion();
        }

        if (datos.puedeGestionar && datos.estado === "programado") {
          setError("Primero aceptá la reserva (desde tu panel) para poder iniciarla.");
        } else if (!datos.puedeGestionar && datos.estado === "programado") {
          setError("El servicio está programado. El prestador debe iniciarlo.");
        } else {
          setError("");
        }

        return;
      }

      if (datos.estado === "en-curso") {
        setError("");

        if (estadoAnterior !== "en-curso") {
          mostrarServicioEnCurso(datos);
        }

        if (datos.puedeGestionar) {
          iniciarGeolocalizacion();
        }

        return;
      }

      if (datos.estado === "finalizado") {
        if (estadoAnterior !== "finalizado") {
          mostrarServicioFinalizado(datos);
        }

        return;
      }

      setPuedeIniciar(false);
      setPuedeFinalizar(false);
      setError(`La reserva está ${datos.estado}: no hay seguimiento disponible.`);
    },
    [iniciarGeolocalizacion, mostrarServicioEnCurso, mostrarServicioFinalizado, solicitarPermisoUbicacion]
  );

  const consultarEstadoServicio = useCallback(async () => {
    if (!servicioRef.current) {
      return;
    }

    try {
      const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}`);

      if (ok && datos.servicio) {
        aplicarServicio(datos.servicio, servicioRef.current);
      }
    } catch (fallo) {
      console.error("Error al consultar el estado del servicio:", fallo);
    }
  }, [aplicarServicio]);

  // Carga inicial
  useEffect(() => {
    if (!servicioId) {
      setError(
        'No se pudo abrir el seguimiento: falta el identificador de la reserva. Abrí la página usando el botón "Seguimiento" o "Ver seguimiento" de tu reserva.'
      );
      return undefined;
    }

    let activo = true;

    const cargarServicio = async () => {
      try {
        const { ok, datos } = await apiJson(`/api/servicios/${servicioId}`);

        if (!ok) {
          throw new Error(datos.mensaje || "No se pudo cargar el servicio");
        }

        if (activo) {
          aplicarServicio(datos.servicio, null);
        }
      } catch (fallo) {
        if (activo) {
          setPuedeIniciar(false);
          setPuedeFinalizar(false);
          setError(fallo.message || "Iniciá sesión para usar el seguimiento");
        }
      }
    };

    cargarServicio();

    return () => {
      activo = false;
    };
    // aplicarServicio es estable; solo debe volver a cargar si cambia la reserva
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicioId]);

  // Mientras no esté finalizado se consulta el estado cada 5 s (el prestador puede aceptar/iniciar desde otro dispositivo)
  useEffect(() => {
    if (!servicio || servicio.estado === "finalizado" || ["cancelado", "rechazado"].includes(servicio.estado)) {
      return undefined;
    }

    const temporizador = setInterval(consultarEstadoServicio, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [servicio, consultarEstadoServicio]);

  // Mapa en vivo + cronómetro + consulta de ubicación
  useEffect(() => {
    if (paso !== "en-curso" || !horaInicioReal || !contenedorVivo.current) {
      return undefined;
    }

    const centro = ultimaPosicion.current || PUNTO_INICIAL;
    const mapa = L.map(contenedorVivo.current, { zoomControl: false }).setView(
      centro,
      ultimaPosicion.current ? 16 : 12
    );

    agregarCapaBase(mapa);

    mapaVivo.current = mapa;

    if (ultimaPosicion.current) {
      marcadorVivo.current = L.marker(ultimaPosicion.current).addTo(mapa);
      lineaRecorrida.current = L.polyline([ultimaPosicion.current], {
        color: "#1F7A74",
        weight: 4
      }).addTo(mapa);
    }

    const intervaloCronometro = setInterval(() => {
      const segundos = Math.floor((Date.now() - horaInicioReal.getTime()) / 1000);

      setCronometro(formatearCronometro(Math.max(0, segundos)));
    }, 1000);

    consultarUbicacion();
    const intervaloUbicacion = setInterval(consultarUbicacion, INTERVALO_ACTUALIZACION);

    return () => {
      clearInterval(intervaloCronometro);
      clearInterval(intervaloUbicacion);
      mapa.remove();
      mapaVivo.current = null;
      marcadorVivo.current = null;
      lineaRecorrida.current = null;
    };
  }, [paso, horaInicioReal, consultarUbicacion]);

  // Mapa del recorrido final
  useEffect(() => {
    if (paso !== "finalizado" || !contenedorFinal.current) {
      return undefined;
    }

    const puntos = recorridoReal.current.slice();
    const mapa = L.map(contenedorFinal.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false
    }).setView(puntos[0] || ultimaPosicion.current || PUNTO_INICIAL, puntos.length ? 16 : 12);

    agregarCapaBase(mapa);

    if (puntos.length > 0) {
      const linea = L.polyline(puntos, { color: "#FF6F52", weight: 4 }).addTo(mapa);

      L.marker(puntos[0]).addTo(mapa);

      if (puntos.length > 1) {
        L.marker(puntos[puntos.length - 1]).addTo(mapa);
      }

      mapa.fitBounds(linea.getBounds(), { padding: [24, 24] });
    }

    return () => {
      mapa.remove();
    };
  }, [paso]);

  useEffect(() => detenerGeolocalizacion, [detenerGeolocalizacion]);

  // Posición enviada en tiempo real por el prestador (SSE)
  useEventoTiempoReal("ubicacion", (datos) => {
    if (servicioId && Number(datos.servicioId) === Number(servicioId)) {
      agregarPosicionAlMapa({ latitud: datos.latitud, longitud: datos.longitud });
    }
  });

  // Cambios de estado de la reserva (aceptada, iniciada, finalizada...) llegan como notificación
  useEventoTiempoReal("notificacion", (datos) => {
    if (servicioId && datos.servicioId && Number(datos.servicioId) === Number(servicioId)) {
      consultarEstadoServicio();
    }
  });

  const iniciar = async () => {
    if (!servicioRef.current) {
      return;
    }

    try {
      const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}/iniciar`, {
        method: "POST"
      });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo iniciar el servicio");
      }

      setError("");
      aplicarServicio(datos.servicio, servicioRef.current);
    } catch (fallo) {
      setError(fallo.message || "No se pudo iniciar el servicio");
    }
  };

  const finalizar = async () => {
    if (!servicioRef.current) {
      return;
    }

    try {
      const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}/finalizar`, {
        method: "POST"
      });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo finalizar el servicio");
      }

      aplicarServicio(datos.servicio, servicioRef.current);
    } catch (fallo) {
      setError(fallo.message || "No se pudo finalizar el servicio");
    }
  };

  const calificar = async ({ puntuacion, comentario }) => {
    if (!servicioRef.current || servicioRef.current.estado !== "finalizado") {
      setCalificacion((anterior) => ({ ...anterior, mensaje: "El servicio todavía no finalizó." }));
      return;
    }

    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      setCalificacion((anterior) => ({
        ...anterior,
        mensaje: "Seleccioná una puntuación entre 1 y 5."
      }));
      return;
    }

    setCalificacion((anterior) => ({ ...anterior, enviando: true, mensaje: "" }));

    try {
      const { ok, datos } = await enviarJson(
        `/api/servicios/${servicioRef.current.id}/calificacion`,
        "POST",
        { puntuacion, comentario }
      );

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo guardar la calificación");
      }

      servicioRef.current = { ...servicioRef.current, calificado: true, puedeCalificar: false };
      setCalificacion({ visible: false, mensaje: "La calificación se guardó correctamente.", enviando: false });
    } catch (fallo) {
      setCalificacion((anterior) => ({ ...anterior, mensaje: fallo.message, enviando: false }));
    }
  };

  return {
    servicioId,
    servicio,
    paso,
    error,
    puedeIniciar,
    puedeFinalizar,
    horaInicioReal,
    horaFinReal,
    cronometro,
    distancia,
    calificacion,
    contenedorVivo,
    contenedorFinal,
    iniciar,
    finalizar,
    calificar
  };
}
