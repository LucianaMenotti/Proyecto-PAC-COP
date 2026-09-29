document.addEventListener("DOMContentLoaded", () => {
  // ELEMENTOS DEL DOM
  const navButtons = document.querySelectorAll(".nav-button");
  const appViews = document.querySelectorAll(".app-view");

  const videoStream = document.getElementById("videoStream");
  const photoCanvas = document.getElementById("photoCanvas");
  const capturedPreview = document.getElementById("capturedPreview");

  const btnCapture = document.getElementById("btnCapture");
  const btnToggleCamera = document.getElementById("btnToggleCamera");
  const btnRetake = document.getElementById("btnRetake");
  const btnSubmit = document.getElementById("btnSubmit");

  const shutterContainer = document.getElementById("shutterContainer");
  const actionControls = document.getElementById("actionControls");
  const notesOverlay = document.getElementById("notesOverlay");
  const observationsInput = document.getElementById("observations");

  const emptyFeed = document.getElementById("emptyFeed");
  const reportsFeed = document.getElementById("reportsFeed");
  const feedBadge = document.getElementById("feedBadge");
  const ownerToast = document.getElementById("ownerToast");

  let activeStream = null;
  let currentFacingMode = "user"; // 'user' = frontal, 'environment' = trasera
  let capturedImageData = null;

  // 1. NAVEGACIÓN ENTRE VISTAS (CÁMARA <-> REPORTES)
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");

      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      appViews.forEach((view) => {
        if (view.id === targetId) {
          view.classList.remove("d-none");
        } else {
          view.classList.add("d-none");
        }
      });

      if (targetId === "viewFeed") {
        feedBadge.classList.add("d-none");
      }
    });
  });

  // 2. INICIALIZAR Y CAMBIAR CÁMARA
  async function initCamera() {
    // Apagar la transmisión previa si existe
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentFacingMode },
        audio: false,
      });
      videoStream.srcObject = activeStream;
    } catch (err) {
      console.warn("Error o permiso denegado en la cámara:", err);
    }
  }

  // EVENTO GIRAR CÁMARA
  btnToggleCamera.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
    initCamera();
  });

  // 3. RELOJ EN TIEMPO REAL
  function startClock() {
    const timestampElem = document.getElementById("timestampStatus");
    const updateTime = () => {
      const now = new Date();
      timestampElem.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // 4. GEOLOCALIZACIÓN
  function getGPSLocation() {
    const gpsElem = document.getElementById("gpsStatus");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4);
          const lon = pos.coords.longitude.toFixed(4);
          gpsElem.textContent = `${lat}, ${lon}`;
        },
        () => {
          gpsElem.textContent = "-26.0790, -58.2776";
        },
      );
    } else {
      gpsElem.textContent = "-26.0790, -58.2776";
    }
  }

  // 5. CAPTURAR FOTO
  btnCapture.addEventListener("click", () => {
    photoCanvas.width = videoStream.videoWidth || 640;
    photoCanvas.height = videoStream.videoHeight || 480;

    const ctx = photoCanvas.getContext("2d");
    ctx.drawImage(videoStream, 0, 0, photoCanvas.width, photoCanvas.height);

    capturedImageData = photoCanvas.toDataURL("image/jpeg");
    capturedPreview.src = capturedImageData;

    videoStream.classList.add("d-none");
    capturedPreview.classList.remove("d-none");

    shutterContainer.classList.add("d-none");
    actionControls.classList.remove("d-none");
    notesOverlay.classList.remove("d-none");
  });

  // 6. REPETIR FOTO
  btnRetake.addEventListener("click", resetCameraView);

  function resetCameraView() {
    capturedPreview.classList.add("d-none");
    videoStream.classList.remove("d-none");

    shutterContainer.classList.remove("d-none");
    actionControls.classList.add("d-none");
    notesOverlay.classList.add("d-none");
    observationsInput.value = "";
    capturedImageData = null;
  }

  // 7. GUARDAR REPORTE EN FEED
  btnSubmit.addEventListener("click", () => {
    if (!capturedImageData) return;

    const notesText =
      observationsInput.value.trim() || "Sin observaciones registradas.";
    const timeText = document.getElementById("timestampStatus").textContent;
    const gpsText = document.getElementById("gpsStatus").textContent;

    if (emptyFeed) emptyFeed.classList.add("d-none");

    const reportCard = document.createElement("div");
    reportCard.className = "report-card mb-3";
    reportCard.innerHTML = `
      <img src="${capturedImageData}" class="report-card-img" alt="Captura de servicio">
      <div class="p-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="badge bg-light text-dark border">
            <i class="bi bi-clock me-1 text-primary"></i>${timeText}
          </span>
          <span class="extra-small text-muted">
            <i class="bi bi-geo-alt me-1 text-danger"></i>${gpsText}
          </span>
        </div>
        <p class="mb-0 text-dark small fw-medium">${notesText}</p>
      </div>
    `;

    reportsFeed.prepend(reportCard);

    ownerToast.classList.add("show");
    setTimeout(() => {
      ownerToast.classList.remove("show");
    }, 3000);

    feedBadge.classList.remove("d-none");

    resetCameraView();
  });

  // Inicializar
  initCamera();
  startClock();
  getGPSLocation();
});
