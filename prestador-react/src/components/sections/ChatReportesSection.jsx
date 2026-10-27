import React, { useState, useEffect, useRef } from 'react';
import { getServicios, getMensajes, postMensaje } from '../../api/prestador';
import { useCamera } from '../../hooks/useCamera';
import CameraOverlay from '../camera/CameraOverlay';
import Lightbox from '../camera/Lightbox';

export default function ChatReportesSection({ initialServicioId, user }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'reportes'
  const [servicios, setServicios] = useState([]);
  const [selectedServicioId, setSelectedServicioId] = useState(initialServicioId || null);

  // Chat state
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef(null);

  // Reportes state
  const [reportes, setReportes] = useState(() => {
    try {
      const saved = localStorage.getItem('pac_cop_reportes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [pendingPreview, setPendingPreview] = useState(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState(null);

  // Camera hook
  const camera = useCamera();

  // Cargar servicios activos para seleccionar en el chat
  useEffect(() => {
    async function loadServicios() {
      try {
        const res = await getServicios();
        const servs = res.servicios || [];
        setServicios(servs);
        if (!selectedServicioId && servs.length > 0) {
          const primeroActivo = servs.find((s) => ['aceptado', 'en-curso'].includes(s.estado)) || servs[0];
          setSelectedServicioId(primeroActivo.id);
        }
      } catch (err) {
        console.error('Error cargando servicios para chat:', err);
      }
    }
    loadServicios();
  }, [selectedServicioId]);

  // Cargar mensajes del servicio seleccionado
  const cargarMensajes = async (silencioso = false) => {
    if (!selectedServicioId) return;
    if (!silencioso) setLoadingChat(true);
    try {
      const data = await getMensajes(selectedServicioId);
      setMensajes(data.mensajes || []);
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    } finally {
      if (!silencioso) setLoadingChat(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
    const interval = setInterval(() => cargarMensajes(true), 5000);
    return () => clearInterval(interval);
  }, [selectedServicioId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !selectedServicioId) return;

    setSending(true);
    try {
      await postMensaje(selectedServicioId, nuevoMensaje.trim());
      setNuevoMensaje('');
      await cargarMensajes(true);
    } catch (err) {
      alert(err.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  // Manejar captura de foto
  const handleShutter = () => {
    const photo = camera.capturePhoto();
    if (photo) {
      setPendingPreview(photo);
    }
  };

  const handleFallbackUpload = async (file) => {
    const photo = await camera.captureFallbackFile(file);
    if (photo) {
      setPendingPreview(photo);
    }
  };

  const handleGuardarReporte = () => {
    if (!pendingPreview) return;
    const nuevoReporte = {
      id: Date.now(),
      servicioId: selectedServicioId,
      ...pendingPreview,
    };
    const updated = [nuevoReporte, ...reportes];
    setReportes(updated);
    try {
      localStorage.setItem('pac_cop_reportes', JSON.stringify(updated));
    } catch {
      /* ignore */
    }
    setPendingPreview(null);
  };

  const servicioActual = servicios.find((s) => s.id === Number(selectedServicioId));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          Comunicación y evidencias
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">
          Chat y reportes fotográficos en vivo
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Chateá con el dueño de la mascota durante el servicio y enviá reportes con fotografía verificada y sello GPS en tiempo real.
        </p>
      </div>

      {/* Selector de servicio */}
      {servicios.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">Reserva activa:</span>
            <select
              value={selectedServicioId || ''}
              onChange={(e) => setSelectedServicioId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} - {s.tipo} para {s.mascota} ({s.estado})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Tabs: Chat vs Reportes */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="bi bi-chat-text"></i> Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reportes')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'reportes'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="bi bi-camera"></i> Reportes ({reportes.length})
            </button>
          </div>
        </div>
      )}

      {/* Contenido Chat */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[520px]">
          {/* Header de conversación */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm shadow">
                {servicioActual ? servicioActual.mascota.charAt(0).toUpperCase() : '🐾'}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {servicioActual ? `Dueño de ${servicioActual.mascota}` : 'Conversación de servicio'}
                </h4>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> En línea
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('reportes')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200"
            >
              <i className="bi bi-camera-fill"></i> Foto en vivo
            </button>
          </div>

          {/* Hilo de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
            {loadingChat && mensajes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Cargando mensajes...</p>
            ) : mensajes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <i className="bi bi-chat-dots text-3xl mb-2 block text-slate-300"></i>
                <p className="text-xs font-semibold">No hay mensajes en esta conversación.</p>
                <p className="text-[11px] text-slate-400">Enviá un mensaje para coordinar el servicio.</p>
              </div>
            ) : (
              mensajes.map((m, idx) => {
                const esMio = m.usuarioId === user?.id || m.rol === 'prestador';
                return (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        esMio
                          ? 'bg-teal-700 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                      {m.hora || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '')}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulario para enviar mensaje */}
          <form
            onSubmit={handleEnviarMensaje}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={sending || !nuevoMensaje.trim()}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition disabled:opacity-40 text-xs sm:text-sm flex items-center gap-1.5"
            >
              <span>Enviar</span>
              <i className="bi bi-send-fill text-xs"></i>
            </button>
          </form>
        </div>
      )}

      {/* Contenido Reportes */}
      {activeTab === 'reportes' && (
        <div className="space-y-6">
          {/* CTA para abrir la cámara */}
          <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">Tomar foto verificada del servicio</h3>
              <p className="text-xs text-teal-100 mt-1 max-w-lg">
                La fotografía se captura en tiempo real e incluye automáticamente coordenadas GPS y hora precisa para mayor tranquilidad del cliente.
              </p>
            </div>
            <button
              type="button"
              onClick={camera.openCamera}
              className="bg-white hover:bg-teal-50 text-teal-800 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2 whitespace-nowrap active:scale-95"
            >
              <i className="bi bi-camera-fill text-base text-rose-500"></i>
              <span>Abrir Cámara en Vivo</span>
            </button>
          </div>

          {/* Modal Preview de Foto tomada antes de guardar */}
          {pendingPreview && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-200">
                <div className="relative">
                  <img
                    src={pendingPreview.dataUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                    📍 {pendingPreview.lat ? `${pendingPreview.lat.toFixed(4)}, ${pendingPreview.lng.toFixed(4)}` : 'Sin GPS'} · {pendingPreview.time}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800">
                    ¿Confirmás el envío de esta foto de reporte?
                  </h4>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setPendingPreview(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={handleGuardarReporte}
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition"
                    >
                      Guardar y Enviar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feed de Reportes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <i className="bi bi-images text-teal-600"></i> Fotos guardadas del servicio
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
                {reportes.map((rep) => (
                  <article
                    key={rep.id}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition group bg-slate-50/40"
                  >
                    <div
                      className="relative h-44 overflow-hidden cursor-pointer"
                      onClick={() => setActiveLightboxPhoto(rep)}
                    >
                      <img
                        src={rep.dataUrl}
                        alt="Reporte de servicio"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        ✓ Verificada
                      </div>
                    </div>

                    <div className="p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="truncate max-w-[150px]">
                          📍 {rep.lat ? `${rep.lat.toFixed(4)}, ${rep.lng.toFixed(4)}` : 'Sin GPS'}
                        </span>
                        <span className="font-mono text-slate-400">{rep.time}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay de Cámara en Vivo */}
      <CameraOverlay
        isOpen={camera.isOpen}
        onClose={camera.closeCamera}
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        gpsStatus={camera.gpsStatus}
        clock={camera.clock}
        cameraError={camera.cameraError}
        onFlip={camera.flipCamera}
        onShutter={handleShutter}
        onFallbackUpload={handleFallbackUpload}
      />

      {/* Lightbox para ver foto completa */}
      <Lightbox
        photo={activeLightboxPhoto}
        onClose={() => setActiveLightboxPhoto(null)}
      />
    </div>
  );
}
