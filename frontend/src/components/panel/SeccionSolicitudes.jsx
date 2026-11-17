import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiJson, enviarDatos } from "../../config/api";
import { RUTAS } from "../../config/rutas";
import EncabezadoSeccion from "./EncabezadoSeccion";

const INTERVALO_ACTUALIZACION = 20000;

const formatearFecha = (valor) =>
  valor
    ? new Date(valor).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
    : "A convenir";

export default function SeccionSolicitudes({ servicios, cargando, alActualizar }) {
  const [ruta, setRuta] = useState([]);
  const [procesandoId, setProcesandoId] = useState(null);
  const [aviso, setAviso] = useState(null);

  const cargarRuta = useCallback(async () => {
    try {
      const { ok, datos } = await apiJson("/api/servicios/prestador/ruta");

      if (ok) {
        setRuta(datos.recorridos || []);
      }
    } catch {
      /* si falla se muestra el recorrido vacío */
    }
  }, []);

  useEffect(() => {
    cargarRuta();

    const temporizador = setInterval(cargarRuta, INTERVALO_ACTUALIZACION);

    return () => clearInterval(temporizador);
  }, [cargarRuta]);

  const gestionar = async (id, accion) => {
    setAviso(null);

    try {
      setProcesandoId(id);

      const datos = await enviarDatos(`/api/servicios/${id}/${accion}`, "POST", {}, `No se pudo ${accion} la solicitud`);

      setAviso({ tipo: "ok", texto: datos.mensaje || "Listo." });
      await alActualizar();
      await cargarRuta();
    } catch (error) {
      setAviso({ tipo: "error", texto: error.message });
    } finally {
      setProcesandoId(null);
    }
  };

  const lista = servicios || [];
  const pendientes = lista.filter(
    (servicio) => servicio.estado === "programado" && servicio.puedeGestionar !== false
  );
  const activos = lista.filter((servicio) => ["aceptado", "en-curso"].includes(servicio.estado));
  const ahora = Date.now();

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Gestión de reservas"
        titulo="Reservas y servicios activos"
        descripcion="Aceptá o rechazá las reservas pendientes de los dueños, accedé al chat en tiempo real y seguí tu recorrido del día."
      />

      {aviso && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold border ${
            aviso.tipo === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {aviso.texto}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-bell-fill text-amber-500"></i>
          <span>Solicitudes pendientes ({pendientes.length})</span>
        </h3>

        {cargando && lista.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">Cargando solicitudes...</p>
        ) : pendientes.length === 0 ? (
          <div className="p-4 bg-teal-50/70 border border-teal-200 text-teal-800 rounded-xl text-xs sm:text-sm font-medium">
            No tenés solicitudes pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendientes.map((servicio) => (
              <div
                key={servicio.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {servicio.tipo}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base">{servicio.mascota}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>
                      <i className="bi bi-calendar-event me-1"></i>
                      {formatearFecha(servicio.horaProgramada)}
                    </span>
                    <span>
                      <i className="bi bi-cash-coin me-1"></i>
                      <strong>${Number(servicio.monto || 0).toLocaleString("es-AR")}</strong>
                    </span>
                    {servicio.origen && (
                      <span>
                        <i className="bi bi-geo-alt me-1"></i>
                        {servicio.origen} → {servicio.destino}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={procesandoId === servicio.id}
                    onClick={() => gestionar(servicio.id, "aceptar")}
                    className="flex-1 sm:flex-initial bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    disabled={procesandoId === servicio.id}
                    onClick={() => gestionar(servicio.id, "rechazar")}
                    className="flex-1 sm:flex-initial border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold text-xs px-4 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activos.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-truck text-teal-600"></i>
            <span>Servicios confirmados y activos ({activos.length})</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {activos.map((servicio) => (
              <div
                key={servicio.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        servicio.estado === "en-curso"
                          ? "bg-emerald-100 text-emerald-800 animate-pulse"
                          : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {servicio.estado === "en-curso" ? "En curso" : "Confirmado"}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base">
                      {servicio.tipo} · {servicio.mascota}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="bi bi-clock me-1"></i> {formatearFecha(servicio.horaProgramada)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    to={`${RUTAS.panelPrestador}/chat?servicioId=${servicio.id}`}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <i className="bi bi-chat-dots"></i> Chat y Reporte
                  </Link>
                  <Link
                    to={`${RUTAS.seguimiento}?servicioId=${servicio.id}`}
                    className="flex-1 sm:flex-initial border border-teal-600 text-teal-800 hover:bg-teal-50 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <i className="bi bi-geo-alt"></i> Seguimiento GPS
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-geo-alt text-teal-600"></i> Tu recorrido sugerido de hoy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Orden de paradas sugerido según cercanía y horario de los servicios.
          </p>
        </div>

        {ruta.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No tenés servicios programados para la fecha.</p>
        ) : (
          <div className="space-y-3">
            {ruta.map((parada, indice) => {
              const salida = new Date(parada.salidaSugerida).getTime();
              const urgente = salida - ahora < 30 * 60 * 1000 && salida - ahora > -60 * 60 * 1000;

              return (
                <div
                  key={parada.id || indice}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                    urgente
                      ? "border-amber-300 bg-amber-50/70"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {indice + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800">
                        {parada.mascota} · {parada.tipo}
                      </h4>
                      {urgente && (
                        <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          Salí pronto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {parada.origen ? `${parada.origen} → ${parada.destino}` : "Domicilio del cliente"}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Salida sugerida:{" "}
                      <strong>
                        {new Date(parada.salidaSugerida).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
