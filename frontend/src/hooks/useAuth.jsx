import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson, enviarJson } from "../config/api";
import { borrarGuardado, guardar } from "../helpers/almacenamiento";

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/users/me");

      if (!ok || !datos.usuario) {
        throw new Error("Sesión no válida");
      }

      guardar("usuario", JSON.stringify(datos.usuario));
      setUsuario(datos.usuario);
      return datos.usuario;
    } catch {
      borrarGuardado("usuario");
      setUsuario(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const iniciarSesion = useCallback(async (email, password) => {
    const { ok, datos } = await enviarJson("/api/users/login", "POST", { email, password });

    if (ok && datos.usuario) {
      guardar("usuario", JSON.stringify(datos.usuario));
      setUsuario(datos.usuario);
    }

    return { ok, datos };
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await apiFetch("/api/users/logout", { method: "POST" });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    borrarGuardado("usuario");
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, refrescar, iniciarSesion, cerrarSesion }),
    [usuario, cargando, refrescar, iniciarSesion, cerrarSesion]
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export const useAuth = () => useContext(ContextoAuth);
