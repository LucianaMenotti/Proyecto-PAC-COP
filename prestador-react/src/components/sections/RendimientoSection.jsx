import React, { useEffect, useState } from 'react';
import { getResenas } from '../../api/prestador';

export default function RendimientoSection({ user }) {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadResenas() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const data = await getResenas(user.id);
        setResenas(data.resenas || []);
      } catch (err) {
        setErrorMsg(err.message || 'Error al cargar reseñas');
      } finally {
        setLoading(false);
      }
    }
    loadResenas();
  }, [user?.id]);

  const serviciosCompletados = Number(user?.serviciosCompletados || 18);
  const calificacion = Number(user?.calificacion || 4.6);
  const totalResenas = resenas.length || Number(user?.resenas || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Estadísticas y reputación
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">Cómo viene tu rendimiento</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Estas métricas ayudan a definir tus recomendaciones de precio y visibilidad frente a los clientes.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <span className="text-4xl font-extrabold text-teal-800 font-mono block mb-1">
            {serviciosCompletados}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Servicios completados
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <div className="flex items-center justify-center gap-1 text-4xl font-extrabold text-amber-500 font-mono mb-1">
            <span>{calificacion.toFixed(1)}</span>
            <span className="text-2xl">★</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Calificación promedio
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center">
          <span className="text-4xl font-extrabold text-teal-800 font-mono block mb-1">
            {totalResenas}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Reseñas recibidas
          </span>
        </div>
      </div>

      {/* Tarjeta de Recomendación */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg shrink-0 mt-0.5">
            <i className="bi bi-lightbulb"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-base">Buen ritmo de servicios</h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Mantener una puntuación superior a 4.5 te acerca a la categoría <strong>Top</strong>.
              Recordá responder a tiempo los mensajes y registrar fotos con GPS durante los paseos para generar confianza.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Reseñas */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Opiniones de clientes</h3>
          <span className="text-xs text-slate-400 font-semibold">{totalResenas} valoraciones</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-4 text-center">Cargando reseñas...</p>
        ) : errorMsg ? (
          <p className="text-sm text-rose-500 py-4 text-center">{errorMsg}</p>
        ) : resenas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <i className="bi bi-chat-quote text-3xl mb-2 block"></i>
            <p className="text-sm font-semibold">Todavía no recibiste reseñas</p>
            <p className="text-xs text-slate-400 mt-1">Aparecerán aquí cuando los clientes califiquen tus servicios.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resenas.map((res, i) => {
              const estrellas = Math.max(0, Math.min(5, Math.round(Number(res.puntuacion) || 5)));
              return (
                <div key={res.id || i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800">{res.autor || 'Cliente'}</span>
                    <div className="text-amber-400 text-sm">
                      {'★'.repeat(estrellas)}
                      <span className="text-slate-300">{'☆'.repeat(5 - estrellas)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    {res.comentario ? `"${res.comentario}"` : 'Sin comentario escrito.'}
                  </p>
                  <span className="text-[11px] text-slate-400 block pt-1 font-mono">
                    {res.fecha ? new Date(res.fecha).toLocaleDateString('es-AR') : 'Reciente'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
