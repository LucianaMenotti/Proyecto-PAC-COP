import React, { useEffect, useState } from 'react';
import { getServicios, accionServicio, getRutaHoy } from '../../api/prestador';

export default function SolicitudesSection({ onOpenChat }) {
  const [servicios, setServicios] = useState([]);
  const [ruta, setRuta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resServicios, resRuta] = await Promise.allSettled([
        getServicios(),
        getRutaHoy(),
      ]);

      if (resServicios.status === 'fulfilled') {
        setServicios(resServicios.value.servicios || []);
      }
      if (resRuta.status === 'fulfilled') {
        setRuta(resRuta.value.recorridos || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleAccion = async (id, accion) => {
    try {
      setProcessingId(id);
      await accionServicio(id, accion);
      await cargarDatos();
    } catch (err) {
      alert(err.message || `No se pudo ${accion} la solicitud`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendientes = servicios.filter((s) => s.estado === 'programado');
  const activos = servicios.filter((s) => ['aceptado', 'en-curso'].includes(s.estado));

  const formatFecha = (str) =>
    str ? new Date(str).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'A convenir';

  const ahora = new Date().getTime();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Gestión de reservas
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Reservas y servicios activos</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Aceptá o rechazá las reservas pendientes de los dueños y accedé al chat en tiempo real.
        </p>
      </div>

      {/* Solicitudes Pendientes */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-bell-fill text-amber-500"></i>
          <span>Solicitudes pendientes ({pendientes.length})</span>
        </h3>

        {loading && servicios.length === 0 ? (
          <p className="text-sm text-slate-400 py-3">Cargando solicitudes...</p>
        ) : pendientes.length === 0 ? (
          <div className="p-4 bg-teal-50/70 border border-teal-200 text-teal-800 rounded-xl text-xs sm:text-sm font-medium">
            No tenés solicitudes pendientes en este momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendientes.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {s.tipo}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base">{s.mascota}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                    <span>
                      <i className="bi bi-calendar-event me-1"></i>
                      {formatFecha(s.horaProgramada)}
                    </span>
                    <span>
                      <i className="bi bi-cash-coin me-1"></i>
                      <strong>${Number(s.monto || 0).toLocaleString('es-AR')}</strong>
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={processingId === s.id}
                    onClick={() => handleAccion(s.id, 'aceptar')}
                    className="flex-1 sm:flex-initial bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    disabled={processingId === s.id}
                    onClick={() => handleAccion(s.id, 'rechazar')}
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

      {/* Servicios Activos */}
      {activos.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <i className="bi bi-truck text-teal-600"></i>
            <span>Servicios confirmados y activos ({activos.length})</span>
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {activos.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        s.estado === 'en-curso'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {s.estado === 'en-curso' ? 'En curso' : 'Confirmado'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-base">
                      {s.tipo} · {s.mascota}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="bi bi-clock me-1"></i> {formatFecha(s.horaProgramada)}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onOpenChat(s.id)}
                    className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <i className="bi bi-chat-dots"></i> Chat y Reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recorrido sugerido de hoy */}
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
            {ruta.map((item, idx) => {
              const salida = new Date(item.salidaSugerida).getTime();
              const urgente = salida - ahora < 30 * 60 * 1000 && salida - ahora > -60 * 60 * 1000;

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                    urgente
                      ? 'border-amber-300 bg-amber-50/70'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-800">
                        {item.mascota} · {item.tipo}
                      </h4>
                      {urgente && (
                        <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                          Salí pronto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {item.origen ? `${item.origen} → ${item.destino}` : 'Domicilio del cliente'}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>
                        Salida sugerida:{' '}
                        <strong>
                          {new Date(item.salidaSugerida).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </strong>
                      </span>
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
