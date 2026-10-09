/* =========================================================
   paccop — reportes.js
   Maneja reportes fotográficos, preview y lightbox.
   ========================================================= */

(() => {
  "use strict";

  const state = {
    pendingPhoto: null,
    reports: []
  };

  const reportsFeed = document.getElementById("reportsFeed");
  const reportsEmpty = document.getElementById("reportsEmpty");

  const previewOverlay = document.getElementById("previewOverlay");
  const previewImg = document.getElementById("previewImg");
  const previewInfo = document.getElementById("previewInfo");

  const retakeBtn = document.getElementById("retakeBtn");
  const sendReportBtn = document.getElementById("sendReportBtn");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxInfo = document.getElementById("lightboxInfo");
  const lightboxClose = document.getElementById("lightboxClose");

  function renderReports() {
    reportsFeed.innerHTML = "";

    reportsEmpty.hidden =
      state.reports.length > 0;

    state.reports.forEach((report) => {
      const card = document.createElement("article");

      card.className = "report-card";

      const coordsText =
        report.lat != null
          ? `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`
          : "ubicación no disponible";

      card.innerHTML = `
        <img
          class="report-photo"
          src="${report.dataUrl}"
          alt="Foto del servicio tomada el ${report.time}"
        >

        <div class="report-body">

          <div class="report-meta-row">
            <span>📍 ${coordsText}</span>
            <span class="report-time">
              ${report.time}
            </span>
          </div>

          <span class="report-tag">
            ✓ Foto verificada en vivo
          </span>

        </div>
      `;

      card
        .querySelector(".report-photo")
        .addEventListener("click", () => {
          openLightbox(report, coordsText);
        });

      reportsFeed.appendChild(card);
    });
  }

  function openPreview(photo) {
    state.pendingPhoto = photo;

    previewImg.src = photo.dataUrl;

    const coordsText =
      photo.lat != null
        ? `📍 ${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`
        : "📍 Ubicación no disponible";

    previewInfo.innerHTML = `
      <span>${coordsText}</span>
      <span>${photo.time}</span>
    `;

    previewOverlay.hidden = false;
  }

  function openLightbox(report, coordsText) {
    lightboxImg.src = report.dataUrl;

    lightboxInfo.textContent =
      `📍 ${coordsText} · ${report.time}`;

    lightbox.hidden = false;
  }

  window.addEventListener("fotoCapturada", (event) => {
    openPreview(event.detail);
  });

  retakeBtn?.addEventListener("click", () => {
    state.pendingPhoto = null;
    previewOverlay.hidden = true;

    document
      .getElementById("openCameraBtn")
      ?.click();
  });

  sendReportBtn?.addEventListener("click", () => {
    if (!state.pendingPhoto) {
      return;
    }

    state.reports.unshift({
      id: Date.now(),
      ...state.pendingPhoto
    });

    state.pendingPhoto = null;
    previewOverlay.hidden = true;

    renderReports();
  });

  lightboxClose?.addEventListener("click", () => {
    lightbox.hidden = true;
  });

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      lightbox.hidden = true;
    }
  });

  renderReports();
})();
