import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "../config/api";
import { distanciaHaversine, formatearCronometro, PUNTO_INICIAL } from "../helpers/geografia";
import L, { agregarCapaBase } from "../helpers/mapa";

export function useSeguimiento() {
  const [servicio, setServicio] = useState(null);
  const [paso, setPaso] = useState("programado");
  const [error, setError] = useState("");
  const [puedeIniciar, setPuedeIniciar] = useState(false);
  const [puedeFinalizar, setPuedeFinalizar] = useState(false);
  const [horaInicioReal, setHoraInicioReal] = useState(null);
  const [horaFinReal, setHoraFinReal] = useState(null);
  const [cronometro, setCronometro] = useState("00:00");
  const [distancia, setDistancia] = useState(0);

  const servicioRef = useRef(null);
  const watchId = useRef(null);
  const distanciaTotal = useRef(0);
  const ultimaPosicion = useRef(null);
  const recorridoReal = useRef([]);
  const mapaVivo = useRef(null);
  const marcadorVivo = useRef(null);
  const lineaRecorrida = useRef(null);
  const contenedorVivo = useRef(null);
  const contenedorFinal = useRef(null);
  const cargaIniciada = useRef(false);

  const agregarPosicionAlMapa = useCallback((posicion) => {
    const punto = [Number(posicion.latitud), Number(posicion.longitud)];

    if (ultimaPosicion.current) {
      distanciaTotal.current += distanciaHaversine(ultimaPosicion.current, punto);
    }

    ultimaPosicion.current = punto;
    recorridoReal.current.push(punto);
    setDistancia(distanciaTotal.current);

    marcadorVivo.current?.setLatLng(punto);
    lineaRecorrida.current?.addLatLng(punto);
    mapaVivo.current?.panTo(punto);
  }, []);

  const consultarUbicacion = useCallback(async () => {
    if (!servicioRef.current) {
      return;
    }

    const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}/ubicacion`);

    if (!ok) {
      return;
    }

    const { ubicacion } = datos;

    if (
      ubicacion &&
      (!ultimaPosicion.current ||
        Number(ubicacion.latitud) !== ultimaPosicion.current[0] ||
        Number(ubicacion.longitud) !== ultimaPosicion.current[1])
    ) {
      agregarPosicionAlMapa(ubicacion);
    }
  }, [agregarPosicionAlMapa]);

  const enviarUbicacion = useCallback(
    async (latitud, longitud) => {
      const { ok } = await apiJson(`/api/servicios/${servicioRef.current.id}/ubicacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitud, longitud })
      });

      if (!ok) {
        throw new Error("No se pudo guardar la ubicación");
      }

      agregarPosicionAlMapa({ latitud, longitud });
    },
    [agregarPosicionAlMapa]
  );

  const iniciarGeolocalizacion = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener la ubicación del dispositivo.");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => enviarUbicacion(coords.latitude, coords.longitude).catch(console.error),
      () => setError("No se pudo obtener la ubicación. Revisá el permiso del navegador."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }, [enviarUbicacion]);

  const detenerGeolocalizacion = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const mostrarServicioEnCurso = useCallback((datos) => {
    setHoraInicioReal(new Date(datos.iniciadoEn));
    setPuedeFinalizar(false);
    setPaso("en-curso");
  }, []);

  useEffect(() => {
    if (cargaIniciada.current) {
      return;
    }

    cargaIniciada.current = true;

    const cargarServicio = async () => {
      try {
        const { ok, datos } = await apiJson("/api/servicios/demo", { method: "POST" });

        if (!ok) {
          throw new Error(datos.mensaje || "No se pudo cargar el servicio");
        }

        servicioRef.current = datos.servicio;
        setServicio(datos.servicio);
        setPuedeIniciar(datos.servicio.puedeGestionar && datos.servicio.estado === "programado");

        if (!datos.servicio.puedeGestionar) {
          setError(
            "El servicio está asignado al prestador. Podés consultar el seguimiento cuando comience."
          );
        }

        if (datos.servicio.estado === "en-curso") {
          mostrarServicioEnCurso(datos.servicio);
        }
      } catch (fallo) {
        setPuedeIniciar(false);
        setPuedeFinalizar(false);
        setError(fallo.message || "Iniciá sesión para usar el seguimiento");
      }
    };

    cargarServicio();
  }, [mostrarServicioEnCurso]);

  useEffect(() => {
    if (paso !== "en-curso" || !horaInicioReal || !contenedorVivo.current) {
      return undefined;
    }

    const puntoInicial = ultimaPosicion.current || PUNTO_INICIAL;
    const mapa = L.map(contenedorVivo.current, { zoomControl: false }).setView(puntoInicial, 16);

    agregarCapaBase(mapa);

    mapaVivo.current = mapa;
    marcadorVivo.current = L.marker(puntoInicial).addTo(mapa);
    lineaRecorrida.current = L.polyline([puntoInicial], { color: "#1F7A74", weight: 4 }).addTo(
      mapa
    );

    const intervaloCronometro = setInterval(() => {
      const segundos = Math.floor((Date.now() - horaInicioReal.getTime()) / 1000);
      setCronometro(formatearCronometro(segundos));
    }, 1000);

    consultarUbicacion();
    const intervaloUbicacion = setInterval(consultarUbicacion, 5000);

    return () => {
      clearInterval(intervaloCronometro);
      clearInterval(intervaloUbicacion);
      mapa.remove();
      mapaVivo.current = null;
      marcadorVivo.current = null;
      lineaRecorrida.current = null;
    };
  }, [paso, horaInicioReal, consultarUbicacion]);

  useEffect(() => {
    if (paso !== "finalizado" || !contenedorFinal.current) {
      return undefined;
    }

    const puntos = recorridoReal.current.length > 0 ? recorridoReal.current : [PUNTO_INICIAL];
    const mapa = L.map(contenedorFinal.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false
    });

    agregarCapaBase(mapa);

    const linea = L.polyline(puntos, { color: "#FF6F52", weight: 4 }).addTo(mapa);

    L.marker(puntos[0]).addTo(mapa);

    if (puntos.length > 1) {
      L.marker(puntos[puntos.length - 1]).addTo(mapa);
    }

    mapa.fitBounds(linea.getBounds(), { padding: [24, 24] });

    return () => {
      mapa.remove();
    };
  }, [paso]);

  useEffect(() => detenerGeolocalizacion, [detenerGeolocalizacion]);

  const iniciar = async () => {
    if (!servicioRef.current) {
      return;
    }

    try {
      const { ok, datos } = await apiJson(`/api/servicios/${servicioRef.current.id}/iniciar`, {
        method: "POST"
      });

      if (!ok) {
        throw new Error(datos.mensaje);
      }

      servicioRef.current = datos.servicio;
      setServicio(datos.servicio);
      setHoraInicioReal(new Date(datos.servicio.iniciadoEn));
      setPaso("en-curso");
      iniciarGeolocalizacion();
      setPuedeFinalizar(true);
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
        throw new Error(datos.mensaje);
      }

      servicioRef.current = datos.servicio;
      setServicio(datos.servicio);
      setHoraFinReal(new Date(datos.servicio.finalizadoEn));
      detenerGeolocalizacion();
      setPuedeFinalizar(false);
      setPaso("finalizado");
    } catch (fallo) {
      setError(fallo.message || "No se pudo finalizar el servicio");
    }
  };

  return {
    servicio,
    paso,
    error,
    puedeIniciar,
    puedeFinalizar,
    horaInicioReal,
    horaFinReal,
    cronometro,
    distancia,
    contenedorVivo,
    contenedorFinal,
    iniciar,
    finalizar
  };
}
