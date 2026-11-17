import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RUTAS } from "../config/rutas";

export default function RutaProtegida({ roles = [], children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Navigate to={RUTAS.login} replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to={RUTAS.cuenta} replace />;
  }

  return children;
}
