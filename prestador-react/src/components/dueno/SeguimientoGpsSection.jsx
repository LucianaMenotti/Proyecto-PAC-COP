import React, { useEffect, useRef, useState } from 'react';
import { getDetalleServicio } from '../../api/dueno';

export default function SeguimientoGpsSection({ servicioId, onVolver, onOpenChat }) {
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState('00:00:00');
  const [distanciaTotal, setDistanciaTotal] = useState(0.85); // km

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  // Cargar servicio
  useEffect(() => {
    async function load() {
      if (!servicioId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getDetalleServicio(servicioId);
        setServicio(data);
      } catch (err) {
        console.error('Error cargando servicio para tracking:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [servicioId]);

  // Cronómetro del cuidado en tiempo real
  useEffect(() => {
    const inicio = servicio?.horaInicioReal ? new Date(servicio.horaInicioReal).getTime() : Date.now() - 25 * 60 * 1000;

    const interval = setInterval(() => {
      const diff = Math.max(0, Date.now() - inicio);
      const horas = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const minutos = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const segundos = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
      setTiempoTranscurrido(`${horas}:${minutos}:${segundos}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [servicio]);

  // Inicializar Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || !window.L || mapInstanceRef.current) return;

    // Coordenadas base (ej: Palermo / Buenos Aires)
    const centro = [-34.5889, -58.4306];

    const map = window.L.map(mapContainerRef.current).setView(centro, 15);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Marcador de la mascota
    const customIcon = window.L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #1f7a74; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">🐾</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = window.L.marker(centro, { icon: customIcon }).addTo(map);
    marker.bindPopup(`<strong>${servicio?.mascota || 'Tu mascota'}</strong> en paseo`).openPopup();

    // Línea de ruta simulada en vivo
    const rutaInicial = [
      [-34.5875, -58.4285],
      [-34.5882, -58.4295],
      [-34.5889, -58.4306],
    ];
    const polyline = window.L.polyline(rutaInicial, { color: '#ff6f52', weight: 4, opacity: 0.8 }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;
    polylineRef.current = polyline;

    // Simular actualización de GPS en vivo
    const gpsInterval = setInterval(() => {
      const latOffset = (Math.random() - 0.5) * 0.0006;
      const lngOffset = (Math.random() - 0.5) * 0.0006;
      const prevPos = marker.getLatLng();
      const newPos = [prevPos.lat + latOffset, prevPos.lng + lngOffset];

      marker.setLatLng(newPos);
      polyline.addLatLng(newPos);
      map.panTo(newPos);
      setDistanciaTotal((prev) => +(prev + 0.03).toFixed(2));
    }, 6000);

    return () => {
      clearInterval(gpsInterval);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [loading, servicio]);

  const horaInicio = servicio?.horaInicioReal
    ? new Date(servicio.horaInicioReal).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '10:15';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500 block mb-1">
            Geolocalización en tiempo real
          </span>
          <h2 className="text-2xl font-bold font-serif text-slate-800">
            Seguimiento de {servicio?.mascota || 'Mascota'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoreá el recorrido exacto y la duración del cuidado en vivo.
          </p>
        </div>

        <button
          type="button"
          onClick={onVolver}
          className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5"
        >
          <i className="bi bi-arrow-left"></i> Volver a Mis Reservas
        </button>
      </div>

      {/* Tarjeta de Métricas en Vivo del Cuidado */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
        <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Estado del servicio
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> En curso
          </span>
        </div>

        <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Hora de inicio
          </span>
          <strong className="text-base font-mono text-slate-800">{horaInicio} hs</strong>
        </div>

        <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Tiempo bajo cuidado
          </span>
          <strong className="text-xl font-mono text-teal-800 font-extrabold">{tiempoTranscurrido}</strong>
        </div>

        <div className="p-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Distancia recorrida
          </span>
          <strong className="text-base font-mono text-slate-800">{distanciaTotal} km</strong>
        </div>
      </div>

      {/* Mapa Interactivo Leaflet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[520px]">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <i className="bi bi-geo-alt-fill text-rose-500"></i> Señal GPS activa: transmitiendo cada pocos segundos
          </span>
          {servicioId && (
            <button
              type="button"
              onClick={() => onOpenChat?.(servicioId)}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1"
            >
              <i className="bi bi-chat-dots-fill"></i> Chatear con {servicio?.prestador || 'el prestador'}
            </button>
          )}
        </div>

        <div ref={mapContainerRef} className="flex-1 w-full bg-slate-100 min-h-[440px]" />
      </div>
    </div>
  );
}
