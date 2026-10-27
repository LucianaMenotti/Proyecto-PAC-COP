import React from 'react';

export default function Lightbox({ photo, onClose }) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <img
          src={photo.dataUrl}
          alt="Reporte de servicio"
          className="w-full max-h-[75vh] object-contain bg-black"
        />

        <div className="p-4 bg-neutral-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-neutral-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-400">
            <i className="bi bi-geo-alt-fill"></i>
            <span>
              {photo.lat != null
                ? `GPS: ${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`
                : 'Ubicación no disponible'}
            </span>
          </div>
          <div className="text-neutral-400 flex items-center gap-1.5 font-mono">
            <i className="bi bi-clock"></i>
            <span>{photo.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
