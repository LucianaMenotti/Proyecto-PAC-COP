import { useEffect, useState } from "react";
import { apiJson } from "../config/api";
import { TIPOS_SERVICIO } from "../helpers/niveles";

// Rango real de precios del mercado por servicio (mínimo, promedio, máximo) según la zona.
// GET /api/servicios/precios/sugerido?tipo=&zona= -> { rango: { min, promedio, max, cantidad } | null }
export function useRangosMercado(zona) {
  const [rangos, setRangos] = useState({});

  useEffect(() => {
    let activo = true;
    const zonaLimpia = (zona || "").trim();

    const cargar = async () => {
      const resultados = await Promise.all(
        TIPOS_SERVICIO.map(async (tipo) => {
          try {
            const { ok, datos } = await apiJson(
              `/api/servicios/precios/sugerido?tipo=${encodeURIComponent(tipo)}&zona=${encodeURIComponent(zonaLimpia)}`
            );

            return [tipo, ok ? datos.rango || null : null];
          } catch {
            return [tipo, null];
          }
        })
      );

      if (activo) {
        setRangos(Object.fromEntries(resultados));
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [zona]);

  return rangos;
}
