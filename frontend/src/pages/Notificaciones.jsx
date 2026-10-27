import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, apiJson } from "../config/api";
import { RUTAS, ROLES_ADMIN } from "../config/rutas";
import { formatearFechaHora } from "../helpers/reclamos";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

const INTERVALO_ACTUALIZACION = 15000;

export default function Notificaciones() {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState(null);
  const [error, setError] = useState("");

  useBootstrap();
  useEstilos("base", estilosBase);

  const destinoReclamos = ROLES_ADMIN.includes(usuario.rol)
    ? RUTAS.adminReclamos
    : RUTAS.misServicios;

  const cargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/notificaciones");

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar las notificaciones");
      }

      setNotificaciones(datos.notificaciones || []);
      setError("");
    } catch (fallo) {
      console.error("Error al cargar notificaciones:", fallo);
      setError(fallo.message);
      setNotificaciones((anterior) => anterior ?? []);
    }
  }, []);

  useEffect(() => {
    cargar();

    const temporizador = setInterval(cargar, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [cargar]);

  const marcarLeida = async (id) => {
    await apiFetch(`/api/notificaciones/${id}/leer`, { method: "POST" });
    await cargar();
  };

  const marcarTodas = async () => {
    await apiFetch("/api/notificaciones/leer-todas", { method: "POST" });
    await cargar();
  };

  const lista = notificaciones || [];
  const hayNoLeidas = lista.some((notificacion) => !notificacion.leida);

  return (
    <>
      <nav className="navbar bg-white shadow-sm">
        <div className="container">
          <Link to={RUTAS.cuenta} className="navbar-brand fw-bold text-primary">
            Pac-Cop
          </Link>
          <Link to={RUTAS.cuenta} className="btn btn-outline-primary">
            Volver
          </Link>
        </div>
      </nav>

      <main className="container py-5" style={{ maxWidth: "800px" }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <h1 className="fw-bold mb-0">Notificaciones</h1>

          {hayNoLeidas && (
            <button type="button" className="btn btn-outline-primary" onClick={marcarTodas}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        {notificaciones === null && (
          <div className="text-center text-secondary">Cargando notificaciones...</div>
        )}

        {notificaciones !== null && lista.length === 0 && !error && (
          <div className="alert alert-info">No tenés notificaciones.</div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {lista.map((notificacion) => (
          <div
            key={notificacion.id}
            className={`card shadow-sm rounded-4 mb-3 ${
              notificacion.leida ? "border-0" : "border border-primary"
            }`}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <h2 className="h6 fw-bold mb-0">{notificacion.titulo}</h2>
                {!notificacion.leida && <span className="badge bg-primary">Nueva</span>}
              </div>

              <p className="mb-2">{notificacion.mensaje}</p>

              <small className="text-secondary d-block mb-3">
                {formatearFechaHora(notificacion.creadoEn)}
              </small>

              <div className="d-flex flex-wrap gap-2">
                {notificacion.reclamoId && (
                  <Link to={destinoReclamos} className="btn btn-primary btn-sm">
                    Ver reclamos
                  </Link>
                )}
                {!notificacion.leida && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => marcarLeida(notificacion.id)}
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
