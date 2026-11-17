import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";

// Canal SSE único (/api/eventos) compartido por toda la app.
// Eventos del backend: conectado, notificacion, mensaje, ubicacion.
const EVENTOS = ["notificacion", "mensaje", "ubicacion"];
const DURACION_AVISO = 5000;

const ContextoTiempoReal = createContext({
  suscribir: () => () => {},
  avisos: [],
  conectado: false
});

const leerDatos = (evento) => {
  try {
    return JSON.parse(evento.data || "{}");
  } catch {
    return {};
  }
};

export function ProveedorTiempoReal({ children }) {
  const { usuario } = useAuth();
  const oyentes = useRef(new Map());
  const contadorAvisos = useRef(0);
  const [avisos, setAvisos] = useState([]);
  const [conectado, setConectado] = useState(false);

  const usuarioId = usuario?.id ?? null;

  const suscribir = useCallback((evento, manejador) => {
    const conjunto = oyentes.current.get(evento) || new Set();

    conjunto.add(manejador);
    oyentes.current.set(evento, conjunto);

    return () => conjunto.delete(manejador);
  }, []);

  const avisar = useCallback((titulo, cuerpo = "") => {
    contadorAvisos.current += 1;

    const id = contadorAvisos.current;

    setAvisos((actuales) => [...actuales, { id, titulo, cuerpo }]);
    setTimeout(
      () => setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id)),
      DURACION_AVISO
    );
  }, []);

  useEffect(() => {
    if (!usuarioId || typeof EventSource === "undefined") {
      return undefined;
    }

    const fuente = new EventSource("/api/eventos", { withCredentials: true });

    fuente.addEventListener("conectado", () => setConectado(true));
    fuente.onerror = () => setConectado(false);

    EVENTOS.forEach((nombre) => {
      fuente.addEventListener(nombre, (evento) => {
        const datos = leerDatos(evento);

        if (nombre === "notificacion") {
          avisar(datos.titulo || "Nueva notificación", datos.mensaje);
        }

        // Cada mensaje nuevo también genera una notificación (que ya muestra su aviso),
        // por eso el evento "mensaje" solo sirve para refrescar el chat abierto.

        oyentes.current.get(nombre)?.forEach((manejador) => manejador(datos));
      });
    });

    return () => {
      fuente.close();
      setConectado(false);
    };
  }, [usuarioId, avisar]);

  const valor = useMemo(() => ({ suscribir, avisos, conectado }), [suscribir, avisos, conectado]);

  return <ContextoTiempoReal.Provider value={valor}>{children}</ContextoTiempoReal.Provider>;
}

export const useTiempoReal = () => useContext(ContextoTiempoReal);

// Ejecuta `manejador(datos)` cada vez que llega un evento SSE de ese tipo.
export function useEventoTiempoReal(evento, manejador) {
  const { suscribir } = useTiempoReal();
  const referencia = useRef(manejador);

  useEffect(() => {
    referencia.current = manejador;
  }, [manejador]);

  useEffect(() => suscribir(evento, (datos) => referencia.current?.(datos)), [evento, suscribir]);
}
