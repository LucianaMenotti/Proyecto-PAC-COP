import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson, enviarJson } from "../config/api";

const INTERVALO_ACTUALIZACION = 3000;

const unirMensajes = (actuales, nuevos) => {
  const conocidos = new Set(actuales.map((mensaje) => mensaje.id));
  const agregados = nuevos.filter((mensaje) => !conocidos.has(mensaje.id));

  if (agregados.length === 0) {
    return actuales;
  }

  return [...actuales, ...agregados].sort((a, b) => a.id - b.id);
};

export function useChat(servicioId) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const ultimoId = useRef(0);

  const incorporar = useCallback((nuevos) => {
    if (nuevos.length === 0) {
      return;
    }

    ultimoId.current = Math.max(ultimoId.current, ...nuevos.map((mensaje) => mensaje.id));
    setMensajes((actuales) => unirMensajes(actuales, nuevos));
  }, []);

  const cargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson(`/api/mensajes/${servicioId}?desde=${ultimoId.current}`);

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar los mensajes.");
      }

      incorporar(datos.mensajes || []);
      setError("");
    } catch (fallo) {
      console.error("Error al cargar el chat:", fallo);
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }, [servicioId, incorporar]);

  useEffect(() => {
    if (!servicioId) {
      setCargando(false);
      setError("No se indicó una reserva para este chat.");
      return undefined;
    }

    cargar();
    const intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION);

    return () => clearInterval(intervalo);
  }, [servicioId, cargar]);

  const enviar = useCallback(
    async ({ texto = "", imagen = null, latitud = null, longitud = null }) => {
      setEnviando(true);

      try {
        const cuerpo = { texto };

        if (imagen) {
          cuerpo.imagen = imagen;
        }

        if (imagen && latitud !== null && longitud !== null) {
          cuerpo.latitud = latitud;
          cuerpo.longitud = longitud;
        }

        const { ok, datos } = await enviarJson(`/api/mensajes/${servicioId}`, "POST", cuerpo);

        if (!ok) {
          throw new Error(datos.mensaje || "No se pudo enviar el mensaje.");
        }

        incorporar([datos.mensaje]);

        return true;
      } catch (fallo) {
        console.error("Error al enviar mensaje:", fallo);
        alert(fallo.message);

        return false;
      } finally {
        setEnviando(false);
      }
    },
    [servicioId, incorporar]
  );

  return { mensajes, cargando, error, enviando, enviar };
}
