import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../config/api";

export function useServicios() {
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
  }, [recargar]);

  return { servicios, fallo, recargar };
}
