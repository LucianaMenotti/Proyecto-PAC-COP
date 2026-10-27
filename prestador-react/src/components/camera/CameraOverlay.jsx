import React, { useRef } from 'react';

export default function CameraOverlay({
  isOpen,
  onClose,
  videoRef,
  canvasRef,
  gpsStatus,
  clock,
  cameraError,
  onFlip,
  onShutter,
  onFallbackUpload,
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-sm animate-fade-in">
      {/* Top Bar / HUD */}
      <div className="w-full max-w-lg flex items-center justify-between text-white text-xs sm:text-sm font-medium bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
        <span className="flex items-center gap-1.5 truncate">
          <i className="bi bi-geo-alt-fill text-emerald-400"></i>
          {gpsStatus}
        </span>
        <span className="bg-white/20 px-2 py-0.5 rounded font-mono text-emerald-300">
          {clock}
        </span>
      </div>

      {/* Video Container */}
      <div className="relative w-full max-w-lg flex-1 my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraError && (
          <div className="text-center p-6 text-white max-w-xs">
            <i className="bi bi-camera-video-off text-4xl text-rose-400 mb-3 block"></i>
            <p className="font-semibold text-base mb-1">No se pudo acceder a la cámara</p>
            <p className="text-xs text-neutral-400 mb-4">
              Verificá los permisos del navegador o seleccioná una foto desde tus archivos.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow"
            >
              <i className="bi bi-upload me-1.5"></i> Subir foto del dispositivo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFallbackUpload(file);
              }}
            />
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="w-full max-w-lg flex items-center justify-around py-3 px-6 bg-black/50 rounded-2xl border border-white/10 backdrop-blur-md">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          title="Cerrar cámara"
        >
          <i className="bi bi-x-lg text-lg"></i>
        </button>

        {/* Shutter Button */}
        <button
          type="button"
          onClick={onShutter}
          disabled={cameraError}
          className={`w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 transition shadow-lg ${
            cameraError ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
          }`}
          title="Tomar foto"
        >
          <div className="w-full h-full rounded-full bg-white transition hover:bg-emerald-400"></div>
        </button>

        {/* Flip Camera Button */}
        <button
          type="button"
          onClick={onFlip}
          disabled={cameraError}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          title="Girar cámara"
        >
          <i className="bi bi-arrow-repeat text-xl"></i>
        </button>
      </div>
    </div>
  );
}
