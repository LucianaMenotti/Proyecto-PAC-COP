/* =========================================================
   PawCheck — script.js
   Maneja: rol activo, tabs, cámara en vivo con GPS/hora,
   reportes fotográficos y chat REAL (sin autorrespuestas).
   ========================================================= */

(() => {
  "use strict";

  /* ---------------- ESTADO GENERAL ---------------- */

  const state = {
    role: "prestador", // 'prestador' | 'dueno'
    activeTab: "view-reportes",
    stream: null,
    facingMode: "environment", // 'environment' (trasera) | 'user' (frontal)
    pendingPhoto: null, // { dataUrl, lat, lng, time }
    reports: [],
    unread: { reportes: 0, chat: 0 },
    chat: [], // Chat vacío al iniciar, sin mensajes predeterminados
  };

  /* ---------------- ELEMENTOS ---------------- */

  const roleToggle = document.getElementById("roleToggle");
  const navButtons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");

  const captureCta = document.getElementById("captureCta");
  const openCameraBtn = document.getElementById("openCameraBtn");
  const reportsFeed = document.getElementById("reportsFeed");
  const reportsEmpty = document.getElementById("reportsEmpty");

  const cameraOverlay = document.getElementById("cameraOverlay");
  const cameraVideo = document.getElementById("cameraVideo");
  const cameraCanvas = document.getElementById("cameraCanvas");
  const closeCameraBtn = document.getElementById("closeCameraBtn");
  const flipCameraBtn = document.getElementById("flipCameraBtn");
  const shutterBtn = document.getElementById("shutterBtn");
  const cameraGps = document.getElementById("cameraGps");
  const cameraClock = document.getElementById("cameraClock");
  const cameraError = document.getElementById("cameraError");
  const fallbackInput = document.getElementById("fallbackInput");

  const previewOverlay = document.getElementById("previewOverlay");
  const previewImg = document.getElementById("previewImg");
  const previewInfo = document.getElementById("previewInfo");
  const retakeBtn = document.getElementById("retakeBtn");
  const sendReportBtn = document.getElementById("sendReportBtn");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxInfo = document.getElementById("lightboxInfo");
  const lightboxClose = document.getElementById("lightboxClose");

  const chatThread = document.getElementById("chatThread");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatAvatar = document.getElementById("chatAvatar");
  const chatContactName = document.getElementById("chatContactName");

  const badgeReportes = document.getElementById("badgeReportes");
  const badgeChat = document.getElementById("badgeChat");
  const toastContainer = document.getElementById("toastContainer");

  let clockInterval = null;

  /* ---------------- HELPERS ---------------- */

  function horaActual(offsetMinutes = 0) {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    return d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function fechaHoraCompleta() {
    return new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function showToast({ icon, title, message }) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-text">
        <strong>${title}</strong>
        <span>${message}</span>
      </div>`;
    toastContainer.appendChild(toast);

    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: message });
      }
    } catch (_e) {}

    setTimeout(() => {
      toast.classList.add("toast-out");
      setTimeout(() => toast.remove(), 320);
    }, 3600);
  }

  function updateBadges() {
    badgeReportes.hidden = state.unread.reportes === 0;
    badgeReportes.textContent = state.unread.reportes;
    badgeChat.hidden = state.unread.chat === 0;
    badgeChat.textContent = state.unread.chat;
  }

  /* ---------------- ROL (Dueño / Prestador) ---------------- */

  function applyRole() {
    roleToggle.dataset.role = state.role;

    if (state.role === "prestador") {
      captureCta.hidden = false;
      chatContactName.textContent = "Familia Pérez · Dueños de Toby";
      chatAvatar.textContent = "FP";
    } else {
      captureCta.hidden = true;
      chatContactName.textContent = "Martina G. · Prestadora";
      chatAvatar.textContent = "MG";
    }
    renderReports();
    renderChat();
  }

  roleToggle.addEventListener("click", () => {
    state.role = state.role === "prestador" ? "dueno" : "prestador";
    applyRole();
  });

  /* ---------------- TABS ---------------- */

  function setActiveTab(targetId) {
    state.activeTab = targetId;
    views.forEach((v) => v.classList.toggle("active", v.id === targetId));
    navButtons.forEach((b) =>
      b.classList.toggle("active", b.dataset.target === targetId),
    );

    if (targetId === "view-reportes") {
      state.unread.reportes = 0;
    }
    if (targetId === "view-chat") {
      state.unread.chat = 0;
      scrollChatToBottom();
    }
    updateBadges();
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.target));
  });

  /* ---------------- CÁMARA EN VIVO ---------------- */

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
        video: { facingMode: state.facingMode },
        audio: false,
      };
      state.stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraVideo.srcObject = state.stream;
      cameraVideo.hidden = false;
      cameraError.hidden = true;
    } catch (err) {
      cameraVideo.hidden = true;
      cameraError.hidden = false;
    }
  }

  function stopStream() {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
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
    }, 1000 * 15);
  }
  function stopClock() {
    clearInterval(clockInterval);
  }

  let lastCoords = null;

  function requestGps() {
    cameraGps.textContent = "Obteniendo ubicación GPS…";
    if (!("geolocation" in navigator)) {
      cameraGps.textContent = "GPS no disponible en este dispositivo";
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cameraGps.textContent = `📍 ${lastCoords.lat.toFixed(4)}, ${lastCoords.lng.toFixed(4)}`;
      },
      () => {
        lastCoords = null;
        cameraGps.textContent = "📍 Ubicación no disponible";
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  openCameraBtn.addEventListener("click", openCamera);
  closeCameraBtn.addEventListener("click", closeCamera);

  flipCameraBtn.addEventListener("click", () => {
    state.facingMode =
      state.facingMode === "environment" ? "user" : "environment";
    startStream();
  });

  shutterBtn.addEventListener("click", () => {
    if (!state.stream) {
      return;
    }
    const vw = cameraVideo.videoWidth || 720;
    const vh = cameraVideo.videoHeight || 960;
    cameraCanvas.width = vw;
    cameraCanvas.height = vh;
    const ctx = cameraCanvas.getContext("2d");

    if (state.facingMode === "user") {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(cameraVideo, 0, 0, vw, vh);

    const dataUrl = cameraCanvas.toDataURL("image/jpeg", 0.9);
    openPreview(dataUrl);
  });

  fallbackInput.addEventListener("change", () => {
    const file = fallbackInput.files && fallbackInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => openPreview(e.target.result);
    reader.readAsDataURL(file);
    fallbackInput.value = "";
  });

  function openPreview(dataUrl) {
    state.pendingPhoto = {
      dataUrl,
      lat: lastCoords ? lastCoords.lat : null,
      lng: lastCoords ? lastCoords.lng : null,
      time: fechaHoraCompleta(),
    };
    previewImg.src = dataUrl;
    const coordsText = lastCoords
      ? `📍 ${lastCoords.lat.toFixed(4)}, ${lastCoords.lng.toFixed(4)}`
      : "📍 Ubicación no disponible";
    previewInfo.innerHTML = `<span>${coordsText}</span><span>${state.pendingPhoto.time}</span>`;
    closeCamera();
    previewOverlay.hidden = false;
  }

  retakeBtn.addEventListener("click", () => {
    previewOverlay.hidden = true;
    state.pendingPhoto = null;
    openCamera();
  });

  sendReportBtn.addEventListener("click", () => {
    if (!state.pendingPhoto) return;
    state.reports.unshift({ id: Date.now(), ...state.pendingPhoto });
    previewOverlay.hidden = true;
    state.pendingPhoto = null;

    renderReports();

    if (state.activeTab !== "view-reportes") {
      state.unread.reportes += 1;
      updateBadges();
    }

    showToast({
      icon: "📸",
      title: "Reporte enviado",
      message: "El dueño fue notificado al instante con la foto de Toby.",
    });
  });

  /* ---------------- RENDER DE REPORTES ---------------- */

  function renderReports() {
    reportsFeed.innerHTML = "";
    reportsEmpty.hidden = state.reports.length > 0;

    state.reports.forEach((r) => {
      const card = document.createElement("article");
      card.className = "report-card";

      const coordsText =
        r.lat != null
          ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`
          : "ubicación no disponible";

      card.innerHTML = `
        <img class="report-photo" src="${r.dataUrl}" alt="Foto del servicio tomada el ${r.time}">
        <div class="report-body">
          <div class="report-meta-row">
            <span>📍 ${coordsText}</span>
            <span class="report-time">${r.time}</span>
          </div>
          <span class="report-tag">✓ Foto verificada en vivo</span>
        </div>`;

      card
        .querySelector(".report-photo")
        .addEventListener("click", () => openLightbox(r, coordsText));
      reportsFeed.appendChild(card);
    });
  }

  function openLightbox(r, coordsText) {
    lightboxImg.src = r.dataUrl;
    lightboxInfo.textContent = `📍 ${coordsText} · ${r.time}`;
    lightbox.hidden = false;
  }
  lightboxClose.addEventListener("click", () => {
    lightbox.hidden = true;
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.hidden = true;
  });

  /* ---------------- CHAT ---------------- */

  function renderChat() {
    chatThread.innerHTML = "";
    let lastSender = null;

    state.chat.forEach((m) => {
      const bubble = document.createElement("div");
      const mine = m.sender === state.role;
      bubble.className = `msg ${mine ? "msg-me" : "msg-them"}`;
      bubble.innerHTML = `${escapeHtml(m.text)}<span class="msg-time">${m.time}</span>`;
      chatThread.appendChild(bubble);
      lastSender = m.sender;
    });
    void lastSender;
    scrollChatToBottom();
  }

  function scrollChatToBottom() {
    chatThread.scrollTop = chatThread.scrollHeight;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 90) + "px";
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Se guarda y renderiza únicamente el mensaje enviado por el usuario activo
    state.chat.push({ sender: state.role, text, time: horaActual() });
    chatInput.value = "";
    chatInput.style.height = "auto";
    renderChat();
  });

  /* ---------------- INIT ---------------- */

  applyRole();
  setActiveTab("view-reportes");
  updateBadges();
})();
