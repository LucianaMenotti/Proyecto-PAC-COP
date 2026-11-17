import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ConversacionChat from "../chat/ConversacionChat";
import VisorImagen from "../chat/VisorImagen";
import { RUTAS } from "../../config/rutas";
import { chatDisponible } from "../../helpers/servicios";
import { formatearHoraMensaje } from "../../helpers/imagen";
import { useChat } from "../../hooks/useChat";
import { useEstilos } from "../../hooks/useEstilos";
import estilosChat from "../../config/estilos/chat";
import EncabezadoSeccion from "./EncabezadoSeccion";

const formatearUbicacion = (mensaje) =>
  mensaje.latitud !== null && mensaje.longitud !== null
    ? `${Number(mensaje.latitud).toFixed(4)}, ${Number(mensaje.longitud).toFixed(4)}`
    : "Sin GPS";

// Chat unificado con el dueño (mismo hilo que usa /chat) + reportes fotográficos del servicio.
// Las fotos con sello GPS se envían por el chat, así el dueño las ve en la conversación.
export default function SeccionChat({ usuario, servicios }) {
  const [parametros, setParametros] = useSearchParams();
  const idPedido = parametros.get("servicioId");
  const [servicioId, setServicioId] = useState(idPedido ? Number(idPedido) : null);
  const [pestana, setPestana] = useState("chat");
  const [fotoAbierta, setFotoAbierta] = useState(null);

  useEstilos("chat", estilosChat);

  const lista = useMemo(() => servicios || [], [servicios]);

  // Si no se indicó una reserva se elige la primera activa (o la última)
  useEffect(() => {
    if (servicioId || lista.length === 0) {
      return;
    }

    const activa = lista.find((servicio) => chatDisponible(servicio.estado)) || lista[0];

    setServicioId(activa.id);
  }, [servicioId, lista]);

  const chat = useChat(servicioId);
  const servicioActual = lista.find((servicio) => Number(servicio.id) === Number(servicioId));

  const reportes = useMemo(
    () => chat.mensajes.filter((mensaje) => mensaje.imagenArchivo).reverse(),
    [chat.mensajes]
  );

  const elegirServicio = (evento) => {
    const id = Number(evento.target.value);

    setServicioId(id);
    setParametros({ servicioId: String(id) }, { replace: true });
  };

  const urlImagen = (mensaje) => `/api/mensajes/${servicioId}/imagen/${mensaje.imagenArchivo}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <EncabezadoSeccion
        etiqueta="Comunicación y evidencias"
        titulo="Chat y reportes fotográficos en vivo"
        descripcion="Chateá con el dueño de la mascota durante el servicio y enviá reportes con fotografía verificada y sello GPS en tiempo real."
      />

      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-400 shadow-xs">
          <i className="bi bi-chat-dots text-3xl mb-2 block"></i>
          <p className="text-sm font-semibold text-slate-600">Todavía no tenés reservas</p>
          <p className="text-xs mt-1">El chat se habilita cuando aceptás una reserva.</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-500">Reserva:</span>
              <select
                value={servicioId || ""}
                onChange={elegirServicio}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {lista.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    #{servicio.id} - {servicio.tipo} para {servicio.mascota} ({servicio.estado})
                  </option>
                ))}
              </select>

              {servicioId && (
                <Link
                  to={`${RUTAS.chat}?servicioId=${servicioId}`}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  Abrir en pantalla completa
                </Link>
              )}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPestana("chat")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  pestana === "chat" ? "bg-white text-teal-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="bi bi-chat-text"></i> Chat
              </button>
              <button
                type="button"
                onClick={() => setPestana("reportes")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  pestana === "reportes"
                    ? "bg-white text-teal-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="bi bi-camera"></i> Reportes ({reportes.length})
              </button>
            </div>
          </div>

          {servicioActual && !chatDisponible(servicioActual.estado) && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-medium">
              Esta reserva está en estado «{servicioActual.estado}». El chat está pensado para reservas
              aceptadas o en curso.
            </div>
          )}

          {pestana === "chat" && (
            <div className="chat-app chat-embebido">
              <ConversacionChat chat={chat} servicioId={servicioId} usuarioId={usuario.id} />
            </div>
          )}

          {pestana === "reportes" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold">Tomar foto verificada del servicio</h3>
                  <p className="text-xs text-teal-100 mt-1 max-w-lg">
                    Desde la pestaña Chat tocá el ícono de la cámara: la foto se captura en tiempo real,
                    incluye coordenadas GPS y hora, y le llega al dueño en la conversación.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPestana("chat")}
                  className="bg-white hover:bg-teal-50 text-teal-800 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2 whitespace-nowrap active:scale-95"
                >
                  <i className="bi bi-camera-fill text-base text-rose-500"></i>
                  <span>Ir al chat para tomar la foto</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <i className="bi bi-images text-teal-600"></i> Fotos enviadas de este servicio
                </h3>

                {reportes.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    <i className="bi bi-camera text-3xl mb-2 block"></i>
                    <p className="text-xs font-semibold">No hay reportes fotográficos aún.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tomá una foto con la cámara para registrar el estado de la mascota.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {reportes.map((reporte) => (
                      <article
                        key={reporte.id}
                        className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition group bg-slate-50/40"
                      >
                        <div
                          className="relative h-44 overflow-hidden cursor-pointer"
                          onClick={() =>
                            setFotoAbierta({
                              url: urlImagen(reporte),
                              detalle: `${formatearUbicacion(reporte)} · ${formatearHoraMensaje(reporte.creadoEn)}`
                            })
                          }
                        >
                          <img
                            src={urlImagen(reporte)}
                            alt="Reporte de servicio"
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            ✓ Verificada
                          </div>
                        </div>

                        <div className="p-3 text-xs space-y-1">
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="truncate max-w-[150px]">📍 {formatearUbicacion(reporte)}</span>
                            <span className="font-mono text-slate-400">
                              {formatearHoraMensaje(reporte.creadoEn)}
                            </span>
                          </div>
                          {reporte.texto && <p className="text-slate-500 italic">{reporte.texto}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {fotoAbierta && <VisorImagen imagen={fotoAbierta} alCerrar={() => setFotoAbierta(null)} />}
    </div>
  );
}
