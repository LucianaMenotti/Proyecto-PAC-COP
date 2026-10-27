import React, { useState, useEffect } from 'react';
import { getMisReservas, cancelarReserva, calificarServicio } from '../../api/dueno';

const ESTADOS = {
  programado: { texto: 'Pendiente de confirmación', bg: 'bg-amber-100 text-amber-900 border-amber-200', icon: 'bi-hourglass-split' },
  aceptado: { texto: 'Aceptada por prestador', bg: 'bg-teal-100 text-teal-900 border-teal-200', icon: 'bi-check2-circle' },
  'en-curso': { texto: 'En curso', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200 animate-pulse', icon: 'bi-truck' },
  finalizado: { texto: 'Finalizada', bg: 'bg-blue-100 text-blue-900 border-blue-200', icon: 'bi-flag-fill' },
  cancelado: { texto: 'Cancelada', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'bi-x-circle' },
  rechazado: { texto: 'Rechazada', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: 'bi-slash-circle' },
};

export default function MisReservasSection({ onNavigateToPay, onNavigateToTracking, onNavigateToChat }) {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [alerta, setAlerta] = useState(null);

  // Modal Cancelar
  const [cancelModalReserva, setCancelModalReserva] = useState(null);
  const [motivoCancel, setMotivoCancel] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Modal Calificar
  const [reviewModalReserva, setReviewModalReserva] = useState(null);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getMisReservas();
      setReservas(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleConfirmarCancelar = async () => {
    if (!cancelModalReserva) return;
    setCancelling(true);
    try {
      const res = await cancelarReserva(cancelModalReserva.id, motivoCancel.trim());
      setCancelModalReserva(null);
      setMotivoCancel('');
      setAlerta({ tipo: 'warning', msg: res.mensaje || 'Reserva cancelada con éxito.' });
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al cancelar reserva');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmarCalificar = async () => {
    if (!reviewModalReserva) return;
    setReviewing(true);
    try {
      await calificarServicio(reviewModalReserva.id, rating, comentario.trim());
      setReviewModalReserva(null);
      setComentario('');
      setRating(5);
      setAlerta({ tipo: 'success', msg: '¡Gracias por compartir tu reseña y calificar el servicio!' });
      await cargarDatos();
    } catch (err) {
      alert(err.message || 'Error al enviar reseña');
    } finally {
      setReviewing(false);
    }
  };

  const listaFiltrada = filtro ? reservas.filter((r) => r.estado === filtro) : reservas;

  const formatFecha = (f) =>
    f ? new Date(f).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'A convenir';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-1">
            Panel de Dueño
          </span>
          <h2 className="text-2xl font-bold font-serif text-slate-800">Mis Reservas</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Seguí el estado de tus reservas, realizá pagos seguros, cancelá con reembolso o calificá la atención.
          </p>
        </div>

        {/* Filtro por estado */}
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todas las reservas</option>
          <option value="programado">Pendientes</option>
          <option value="aceptado">Aceptadas</option>
          <option value="en-curso">En curso</option>
          <option value="finalizado">Finalizadas</option>
          <option value="cancelado">Canceladas</option>
        </select>
      </div>

      {alerta && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex justify-between items-center ${
            alerta.tipo === 'warning' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span>{alerta.msg}</span>
          <button onClick={() => setAlerta(null)} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>
      )}

      {loading && reservas.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Cargando tus reservas...</p>
      ) : listaFiltrada.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400 shadow-xs">
          <i className="bi bi-calendar2-x text-4xl text-slate-300 mb-2 block"></i>
          <h3 className="font-bold text-slate-700 text-base">No hay reservas para mostrar</h3>
          <p className="text-xs text-slate-400 mt-1">
            Buscá un prestador disponible y reservá el primer servicio para tu mascota.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaFiltrada.map((r) => {
            const estadoConf = ESTADOS[r.estado] || ESTADOS.cancelado;
            const tieneVuelta = Boolean(r.servicioVueltaId);

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${estadoConf.bg}`}
                    >
                      <i className={`bi ${estadoConf.icon}`}></i>
                      <span>{estadoConf.texto}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#{r.id}</span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mt-2">
                    {r.tipo} · {r.mascota}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <i className="bi bi-person text-teal-600"></i>
                    <span>Prestador: <strong>{r.prestador || 'A asignar'}</strong></span>
                  </p>

                  <div className="text-xs text-slate-600 mt-3 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-calendar-event text-slate-400"></i>
                      <span>{formatFecha(r.horaProgramada)}</span>
                    </div>

                    {r.origen && (
                      <div className="text-[11px] text-slate-500">
                        <i className="bi bi-geo-alt me-1 text-slate-400"></i>
                        <span>{r.origen} → {r.destino}</span>
                      </div>
                    )}

                    {tieneVuelta && (
                      <div className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded inline-block">
                        <i className="bi bi-arrow-repeat me-1"></i> Incluye viaje de regreso
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 text-[11px]">Total del servicio:</span>
                      <strong className="text-emerald-700 font-mono text-sm">
                        ${Number(r.monto || 0).toLocaleString('es-AR')}
                      </strong>
                    </div>
                  </div>

                  {r.estado === 'cancelado' && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      <span className="font-semibold">Reembolso: </span>
                      {r.reembolso ? (
                        <span className="text-emerald-600 font-bold">100% reembolsado a tu cuenta</span>
                      ) : (
                        <span className="text-slate-400">Sin reembolso (cancelación fuera de plazo)</span>
                      )}
                      {r.motivoCancelacion && (
                        <p className="italic text-slate-400 mt-0.5">Motivo: "{r.motivoCancelacion}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botones de acción dinámicos */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {r.estado === 'programado' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateToPay?.(r.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                      >
                        <i className="bi bi-credit-card"></i> Pagar con custodia
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelModalReserva(r)}
                        className="text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl transition"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {r.estado === 'aceptado' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateToChat?.(r.id)}
                        className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                      >
                        <i className="bi bi-chat-dots"></i> Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelModalReserva(r)}
                        className="text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl transition"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {r.estado === 'en-curso' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onNavigateToTracking?.(r.id)}
                        className="flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                      >
                        <i className="bi bi-geo-alt"></i> Seguimiento GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToChat?.(r.id)}
                        className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2 px-3 rounded-xl transition"
                      >
                        <i className="bi bi-chat-dots"></i>
                      </button>
                    </>
                  )}

                  {r.estado === 'finalizado' && (
                    <button
                      type="button"
                      onClick={() => setReviewModalReserva(r)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <i className="bi bi-star-fill text-amber-200"></i> Calificar y dejar reseña
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cancelar Reserva */}
      {cancelModalReserva && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i> Cancelar Reserva
            </h3>
            <p className="text-xs text-slate-600">
              ¿Estás seguro de que querés cancelar la reserva de <strong>{cancelModalReserva.tipo}</strong> para{' '}
              <strong>{cancelModalReserva.mascota}</strong>?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              <strong>Política de Reembolso PAC-COP:</strong> Las cancelaciones con más de 24 horas de aviso
              acceden al 100% de devolución de los fondos retenidos en custodia.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Motivo de la cancelación (opcional)
              </label>
              <textarea
                rows="2"
                value={motivoCancel}
                onChange={(e) => setMotivoCancel(e.target.value)}
                placeholder="Ej: Cambio de planes o imprevisto personal..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancelModalReserva(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmarCancelar}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Calificar y Reseña */}
      {reviewModalReserva && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <i className="bi bi-star-fill text-amber-500"></i> Calificar servicio recibido
            </h3>
            <p className="text-xs text-slate-600">
              ¿Cómo fue tu experiencia con <strong>{reviewModalReserva.prestador}</strong> cuidando a{' '}
              <strong>{reviewModalReserva.mascota}</strong>?
            </p>

            {/* Puntuación en Estrellas */}
            <div className="text-center py-2">
              <span className="block text-xs font-bold uppercase text-slate-400 mb-2">Puntuación</span>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className="text-3xl transition hover:scale-125 focus:outline-none"
                  >
                    <span className={val <= rating ? 'text-amber-400' : 'text-slate-200'}>★</span>
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-600 mt-1 block">
                {rating === 5 ? 'Excelente (5 estrellas)' : `${rating} de 5 estrellas`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Escribir reseña
              </label>
              <textarea
                rows="3"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Contanos cómo atendió a tu mascota, puntualidad y cuidados..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setReviewModalReserva(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={handleConfirmarCalificar}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {reviewing ? 'Publicando...' : 'Publicar Calificación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
