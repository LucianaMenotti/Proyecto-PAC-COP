
/* =========================================================
   paccop — chatApp.js
   Archivo principal.
   Maneja únicamente la navegación entre las secciones.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------- ELEMENTOS ---------------- */

  const navButtons = document.querySelectorAll(".nav-btn");
  const views = document.querySelectorAll(".view");

  /* ---------------- ESTADO ---------------- */

  const state = {
    activeTab: "view-reportes"
  };

  /* ---------------- TABS ---------------- */

  function setActiveTab(targetId) {
    state.activeTab = targetId;

    views.forEach((view) => {
      view.classList.toggle("active", view.id === targetId);
    });

    navButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.target === targetId
      );
    });
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.target);
    });
  });

  /* ---------------- INIT ---------------- */

  setActiveTab(state.activeTab);
})();