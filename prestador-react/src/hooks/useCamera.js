import { useState, useRef, useEffect, useCallback } from 'react';

export function useCamera() {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Buscando señal GPS...');
  const [clock, setClock] = useState('');
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const updateClock = useCallback(() => {
    const now = new Date();
    setClock(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const requestGps = useCallback(() => {
    setGpsStatus('Obteniendo ubicación GPS...');
    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS no disponible en este dispositivo');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsCoords(coords);
        setGpsStatus(`📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      },
      () => {
        setGpsCoords(null);
        setGpsStatus('📍 Ubicación no disponible');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startStream = useCallback(async (facing = facingMode) => {
    stopStream();
    try {
      const constraints = {
        video: { facingMode: facing },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraError(false);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setCameraError(true);
    }
  }, [facingMode, stopStream]);

  const openCamera = useCallback(async () => {
    setIsOpen(true);
    setCameraError(false);
    updateClock();
    requestGps();
    await startStream();
  }, [updateClock, requestGps, startStream]);

  const closeCamera = useCallback(() => {
    stopStream();
    setIsOpen(false);
  }, [stopStream]);

  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await startStream(nextMode);
  }, [facingMode, startStream]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, [isOpen, updateClock]);

  // Capturar foto desde video usando canvas con sello de agua GPS + Fecha/Hora
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 960;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const now = new Date();
    const timeFormatted = now.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    closeCamera();

    return {
      dataUrl,
      lat: gpsCoords?.lat ?? null,
      lng: gpsCoords?.lng ?? null,
      time: timeFormatted,
    };
  }, [facingMode, gpsCoords, closeCamera]);

  const captureFallbackFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const now = new Date();
        const timeFormatted = now.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        closeCamera();
        resolve({
          dataUrl: e.target.result,
          lat: gpsCoords?.lat ?? null,
          lng: gpsCoords?.lng ?? null,
          time: timeFormatted,
        });
      };
      reader.readAsDataURL(file);
    });
  }, [gpsCoords, closeCamera]);

  return {
    isOpen,
    stream,
    videoRef,
    canvasRef,
    gpsCoords,
    gpsStatus,
    clock,
    cameraError,
    openCamera,
    closeCamera,
    flipCamera,
    capturePhoto,
    captureFallbackFile,
  };
}
