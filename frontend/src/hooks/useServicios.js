import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../config/api";
import { useEventoTiempoReal } from "./useTiempoReal";

// intervalo (ms): si se indica, la lista se vuelve a pedir periódicamente.
// También se recarga cuando llega una notificación en tiempo real (SSE).
export function useServicios(intervalo = 0) {
  const [servicios, setServicios] = useState(null);
  const [fallo, setFallo] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/servicios");

      if (!ok) {
        throw new Error("No se pudieron cargar los servicios");
      }

      setServicios(datos.servicios || []);
      setFallo(false);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      setFallo(true);
      setServicios((anterior) => anterior ?? []);
    }
  }, []);

  useEffect(() => {
    recargar();

    if (!intervalo) {
      return undefined;
    }

    const temporizador = setInterval(recargar, intervalo);

    return () => clearInterval(temporizador);
  }, [recargar, intervalo]);

  useEventoTiempoReal("notificacion", recargar);

  return { servicios, fallo, recargar };
}
