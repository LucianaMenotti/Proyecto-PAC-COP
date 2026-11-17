import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../config/api";

export function useContadorNotificaciones(intervalo = 0) {
  const [noLeidas, setNoLeidas] = useState(0);

  const recargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/notificaciones");

      if (ok) {
        setNoLeidas(datos.noLeidas || 0);
      }
    } catch (error) {
      console.error("Error al cargar el contador de notificaciones:", error);
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

  return { noLeidas, recargar };
}
