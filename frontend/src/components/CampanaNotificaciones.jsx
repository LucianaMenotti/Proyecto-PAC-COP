import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, apiJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { destinoDeNotificacion } from "../helpers/notificaciones";
import { formatearFechaHora } from "../helpers/reclamos";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import { useEventoTiempoReal, useTiempoReal } from "../hooks/useTiempoReal";
import estilosCampana from "../config/estilos/campana";

const INTERVALO_ACTUALIZACION = 30000;
const RUTAS_SIN_CAMPANA = [RUTAS.notificaciones, RUTAS.chat, RUTAS.login, RUTAS.registro];

// Campana global con avisos en tiempo real (SSE). Va flotante en todas las pantallas con sesión
// (también en el panel del prestador, que no tiene otra campana propia).
export default function CampanaNotificaciones() {
  const { usuario } = useAuth();
  const { avisos } = useTiempoReal();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierta, setAbierta] = useState(false);
  const [lista, setLista] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  useEstilos("campana", estilosCampana);

  const cargar = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/notificaciones");

      if (ok) {
        setLista(datos.notificaciones || []);
        setNoLeidas(datos.noLeidas || 0);
      }
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    if (!usuario) {
      return undefined;
    }

    cargar();

    const temporizador = setInterval(cargar, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [usuario, cargar]);

  useEventoTiempoReal("notificacion", cargar);

  if (!usuario) {
    return null;
  }

  const oculta = RUTAS_SIN_CAMPANA.includes(pathname);

  const marcarLeida = async (id) => {
    await apiFetch(`/api/notificaciones/${id}/leer`, { method: "POST" });
    await cargar();
  };

  const marcarTodas = async () => {
    await apiFetch("/api/notificaciones/leer-todas", { method: "POST" });
    await cargar();
  };

  const abrirNotificacion = (notificacion) => {
    if (!notificacion.leida) {
      marcarLeida(notificacion.id);
    }

    const destino = destinoDeNotificacion(notificacion, usuario);

    setAbierta(false);

    if (destino) {
      navegar(destino.ruta);
    }
  };

  return (
    <>
      {!oculta && (
        <div id="notifWidget">
          {abierta && (
            <div id="notifPanel" role="dialog" aria-label="Notificaciones">
              <header>
                <strong>Notificaciones</strong>
                <button type="button" onClick={marcarTodas}>
                  Marcar leídas
                </button>
              </header>

              {lista.length === 0 ? (
                <div className="notif-vacio">No tenés notificaciones.</div>
              ) : (
                lista.slice(0, 30).map((item) => (
                  <div
                    key={item.id}
                    className={`notif-item${item.leida ? "" : " no-leida"}`}
                    onClick={() => abrirNotificacion(item)}
                  >
                    <h6>{item.titulo}</h6>
                    {item.mensaje && <p>{item.mensaje}</p>}
                    <time>{formatearFechaHora(item.creadoEn)}</time>
                  </div>
                ))
              )}

              <button
                type="button"
                className="notif-footer"
                onClick={() => {
                  setAbierta(false);
                  navegar(RUTAS.notificaciones);
                }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}

          <button
            type="button"
            id="notifToggle"
            aria-label="Ver notificaciones"
            aria-expanded={abierta}
            onClick={() => {
              setAbierta((valor) => !valor);
              cargar();
            }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7a5.002 5.002 0 0 0-4.005-4.901z" />
            </svg>
            {noLeidas > 0 && <span id="notifBadge">{noLeidas}</span>}
          </button>
        </div>
      )}

      {avisos.length > 0 && (
        <div id="notifToasts">
          {avisos.map((aviso) => (
            <div className="notif-toast" key={aviso.id}>
              <strong>{aviso.titulo}</strong>
              {aviso.cuerpo && <p>{aviso.cuerpo}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
