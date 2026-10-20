
/* =========================================================
   paccop — camara.js
   Maneja cámara, GPS, reloj y captura de fotografías.
   ========================================================= */

(() => {
  "use strict";

  const cameraOverlay = document.getElementById("cameraOverlay");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const openCameraBtn = document.getElementById("openCameraBtn");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const flipCameraBtn = document.getElementById("flipCameraBtn");
  const shutterBtn = document.getElementById("shutterBtn");
  const cameraGps = document.getElementById("cameraGps");
  const cameraClock = document.getElementById("cameraClock");
  const cameraError = document.getElementById("cameraError");
  const fallbackInput = document.getElementById("fallbackInput");

  let stream = null;
  let facingMode = "environment";
  let clockInterval = null;
  let lastCoords = null;

  function horaActual() {
    return new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function fechaHoraCompleta() {
    return new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function openCamera() {
    cameraError.hidden = true;
    cameraOverlay.hidden = false;

    requestGps();
    startClock();
    await startStream();
  }

  async function startStream() {
    stopStream();

    try {
      const constraints = {
        video: {
          facingMode
        },
        audio: false
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      cameraVideo.srcObject = stream;
      cameraVideo.hidden = false;
      cameraError.hidden = true;

    } catch (error) {
      console.error("No se pudo acceder a la cámara:", error);

      cameraVideo.hidden = true;
      cameraError.hidden = false;
    }
  }

  function stopStream() {
    if (!stream) {
      return;
    }

    stream.getTracks().forEach((track) => {
      track.stop();
    });

    stream = null;
  }

  function closeCamera() {
    stopStream();
    stopClock();

    cameraOverlay.hidden = true;
  }

  function startClock() {
    cameraClock.textContent = horaActual();

    clockInterval = setInterval(() => {
      cameraClock.textContent = horaActual();
    }, 15000);
  }

  function stopClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }

  function requestGps() {
    cameraGps.textContent = "Obteniendo ubicación GPS...";

    if (!("geolocation" in navigator)) {
      cameraGps.textContent = "GPS no disponible en este dispositivo";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        cameraGps.textContent =
          `📍 ${lastCoords.lat.toFixed(4)}, ${lastCoords.lng.toFixed(4)}`;
      },
      () => {
        lastCoords = null;
        cameraGps.textContent = "📍 Ubicación no disponible";
      },
      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );
  }

  function abrirPreview(dataUrl) {
    const detalle = {
      dataUrl,
      lat: lastCoords ? lastCoords.lat : null,
      lng: lastCoords ? lastCoords.lng : null,
      time: fechaHoraCompleta()
    };

    window.dispatchEvent(
      new CustomEvent("fotoCapturada", {
        detail: detalle
      })
    );

    closeCamera();
  }

  openCameraBtn?.addEventListener("click", openCamera);

  closeCameraBtn?.addEventListener("click", closeCamera);

  flipCameraBtn?.addEventListener("click", () => {
    facingMode =
      facingMode === "environment"
        ? "user"
        : "environment";

    startStream();
  });

  shutterBtn?.addEventListener("click", () => {
    if (!stream) {
      return;
    }

    const width = cameraVideo.videoWidth || 720;
    const height = cameraVideo.videoHeight || 960;

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const context = cameraCanvas.getContext("2d");

    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(
      cameraVideo,
      0,
      0,
      width,
      height
    );

    const dataUrl = cameraCanvas.toDataURL(
      "image/jpeg",
      0.9
    );

    abrirPreview(dataUrl);
  });

  fallbackInput?.addEventListener("change", () => {
    const file = fallbackInput.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      abrirPreview(event.target.result);
    };

    reader.readAsDataURL(file);

    fallbackInput.value = "";
  });
})();
