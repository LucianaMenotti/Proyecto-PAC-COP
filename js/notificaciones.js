// Widget global de notificaciones persistentes.
// Se inyecta solo si hay sesión activa. No requiere HTML previo.
(() => {
  if (window.__pacNotificaciones) return;
  window.__pacNotificaciones = true;

  const INTERVALO = 30000;
  let abierto = false;
  let temporizador = null;

  const formatearFecha = (valor) => {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inyectarEstilos = () => {
    if (document.getElementById("notifEstilos")) return;
    const style = document.createElement("style");
    style.id = "notifEstilos";
    style.textContent = `
      #notifWidget{position:fixed;right:1rem;bottom:1rem;z-index:1080;font-family:"Inter",system-ui,sans-serif}
      #notifToggle{position:relative;width:52px;height:52px;border:0;border-radius:50%;background:#1f7a74;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center}
      #notifToggle:hover{background:#155551}
      #notifToggle svg{width:24px;height:24px}
      #notifBadge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#ff6f52;color:#fff;font-size:.7rem;font-weight:700;display:none;align-items:center;justify-content:center}
      #notifPanel{position:absolute;right:0;bottom:64px;width:min(340px,86vw);max-height:420px;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 18px 40px rgba(0,0,0,.22);display:none;color:#2c3e50}
      #notifPanel.visible{display:block}
      #notifPanel header{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-bottom:1px solid #eef2f1;position:sticky;top:0;background:#fff;border-radius:16px 16px 0 0}
      #notifPanel header button{border:0;background:transparent;color:#1f7a74;font-size:.8rem;font-weight:600;cursor:pointer}
      .notif-item{padding:.7rem 1rem;border-bottom:1px solid #f2f5f4;font-size:.85rem}
      .notif-item.no-leida{background:#f4fbf9}
      .notif-item h6{margin:0 0 .15rem;font-size:.85rem;font-weight:700}
      .notif-item p{margin:0;color:#5b6b69;font-size:.8rem}
      .notif-item time{color:#93a3a1;font-size:.7rem}
      .notif-vacio{padding:1.2rem 1rem;text-align:center;color:#93a3a1;font-size:.85rem}
      .notif-footer{display:block;width:100%;border:0;border-top:1px solid #e2e8f0;background:#f4fbf9;color:#1f7a74;font-weight:600;font-size:.82rem;padding:.65rem;cursor:pointer}
      .notif-footer:hover{background:#e4f3f1}
      .notif-footer.d-none{display:none}
      #notifToasts{position:fixed;right:1rem;bottom:5rem;z-index:1079;display:flex;flex-direction:column;gap:.5rem;max-width:min(320px,86vw)}
      .notif-toast{background:#155551;color:#fff;border-radius:12px;padding:.7rem .9rem;box-shadow:0 10px 24px rgba(0,0,0,.22);font-size:.82rem;transition:opacity .3s,transform .3s}
      .notif-toast strong{display:block;margin-bottom:.1rem;font-size:.85rem}
      .notif-toast p{margin:0;opacity:.9;font-size:.78rem}
      .notif-toast.saliendo{opacity:0;transform:translateY(8px)}
    `;
    document.head.appendChild(style);
  };

  const abrirSolicitudes = () => {
    const tab = document.getElementById("tab-solicitudes");
    if (!tab) return;
    if (typeof window.bootstrap !== "undefined" && window.bootstrap.Tab) {
      window.bootstrap.Tab.getOrCreateInstance(tab).show();
    } else {
      tab.click();
    }
    tab.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const crearWidget = () => {
    if (document.getElementById("notifWidget")) return;
    inyectarEstilos();

    const widget = document.createElement("div");
    widget.id = "notifWidget";
    widget.innerHTML = `
      <div id="notifPanel" role="dialog" aria-label="Notificaciones">
        <header>
          <strong>Notificaciones</strong>
          <button type="button" id="notifLeerTodas">Marcar leídas</button>
        </header>
        <div id="notifLista"><div class="notif-vacio">Cargando…</div></div>
        <button type="button" id="notifVerSolicitudes" class="notif-footer d-none">Ver solicitudes pendientes</button>
      </div>
      <button type="button" id="notifToggle" aria-label="Ver notificaciones" aria-expanded="false">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7a5.002 5.002 0 0 0-4.005-4.901z"/>
        </svg>
        <span id="notifBadge">0</span>
      </button>
    `;
    document.body.appendChild(widget);

    widget
      .querySelector("#notifToggle")
      .addEventListener("click", () => alternarPanel(!abierto));
    widget
      .querySelector("#notifLeerTodas")
      .addEventListener("click", marcarTodas);

    const verSolicitudes = widget.querySelector("#notifVerSolicitudes");
    if (verSolicitudes && document.getElementById("tab-solicitudes")) {
      verSolicitudes.classList.remove("d-none");
      verSolicitudes.addEventListener("click", () => {
        alternarPanel(false);
        abrirSolicitudes();
      });
    }
  };

  const alternarPanel = (valor) => {
    abierto = valor;
    const panel = document.getElementById("notifPanel");
    const toggle = document.getElementById("notifToggle");
    if (panel) panel.classList.toggle("visible", abierto);
    if (toggle) toggle.setAttribute("aria-expanded", String(abierto));
    if (abierto) cargar();
  };

  const escapar = (texto) =>
    String(texto || "").replace(/[&<>"']/g, (caracter) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[caracter]);

  const cargar = async () => {
    try {
      const respuesta = await fetch("/api/notificaciones", {
        credentials: "include",
      });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      mostrarBadge(datos.noLeidas || 0);
      if (abierto) renderizar(datos.notificaciones || []);
    } catch {
      /* silencioso */
    }
  };

  const mostrarBadge = (cantidad) => {
    const badge = document.getElementById("notifBadge");
    if (!badge) return;
    if (cantidad > 0) {
      badge.textContent = cantidad;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  };

  const renderizar = (lista) => {
    const contenedor = document.getElementById("notifLista");
    if (!contenedor) return;

    if (!lista.length) {
      contenedor.innerHTML =
        '<div class="notif-vacio">No tenés notificaciones.</div>';
      return;
    }

    contenedor.innerHTML = lista
      .map(
        (item) => `
        <div class="notif-item${item.leida ? "" : " no-leida"}" data-id="${item.id}" data-tipo="${escapar(item.tipo || "")}">
          <h6>${escapar(item.titulo)}</h6>
          ${item.mensaje ? `<p>${escapar(item.mensaje)}</p>` : ""}
          <time>${formatearFecha(item.creadoEn)}</time>
        </div>`,
      )
      .join("");

    contenedor.querySelectorAll(".notif-item").forEach((nodo) => {
      nodo.addEventListener("click", () => {
        if (nodo.classList.contains("no-leida")) marcarLeida(nodo.dataset.id);
        const tipo = nodo.dataset.tipo || "";
        if (
          tipo.startsWith("reserva") &&
          document.getElementById("tab-solicitudes")
        ) {
          alternarPanel(false);
          abrirSolicitudes();
        }
      });
    });
  };

  const marcarLeida = async (id) => {
    try {
      await fetch(`/api/notificaciones/${id}/leer`, {
        method: "POST",
        credentials: "include",
      });
      await cargar();
    } catch {
      /* silencioso */
    }
  };

  const marcarTodas = async () => {
    try {
      await fetch("/api/notificaciones/leer-todas", {
        method: "POST",
        credentials: "include",
      });
      await cargar();
    } catch {
      /* silencioso */
    }
  };

  const mostrarToast = (titulo, cuerpo = "") => {
    let contenedor = document.getElementById("notifToasts");
    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = "notifToasts";
      document.body.appendChild(contenedor);
    }

    const toast = document.createElement("div");
    toast.className = "notif-toast";
    toast.innerHTML = `<strong>${escapar(titulo)}</strong>${cuerpo ? `<p>${escapar(cuerpo)}</p>` : ""}`;
    contenedor.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("saliendo");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const urlEventos = () => {
    const puertoLive = window.location.port === "5500";
    const hostLocal = ["localhost", "127.0.0.1"].includes(
      window.location.hostname,
    );
    return puertoLive && hostLocal
      ? `http://${window.location.hostname}:3000/api/eventos`
      : "/api/eventos";
  };

  const parsear = (evento) => {
    try {
      return JSON.parse(evento.data || "{}");
    } catch {
      return {};
    }
  };

  const conectarTiempoReal = () => {
    if (typeof EventSource === "undefined") return null;

    try {
      const fuente = new EventSource(urlEventos(), { withCredentials: true });

      fuente.addEventListener("notificacion", (evento) => {
        const datos = parsear(evento);
        cargar();
        mostrarToast(datos.titulo || "Nueva notificación", datos.mensaje);
        document.dispatchEvent(
          new CustomEvent("pac:notificacion", { detail: datos }),
        );
      });

      fuente.addEventListener("mensaje", (evento) => {
        const datos = parsear(evento);
        mostrarToast("Nuevo mensaje", datos.texto);
        document.dispatchEvent(new CustomEvent("pac:mensaje", { detail: datos }));
      });

      fuente.addEventListener("ubicacion", (evento) => {
        document.dispatchEvent(
          new CustomEvent("pac:ubicacion", { detail: parsear(evento) }),
        );
      });

      window.addEventListener("beforeunload", () => fuente.close());
      return fuente;
    } catch {
      return null;
    }
  };

  const iniciar = async () => {
    let usuario = null;

    try {
      const sesion = await fetch("/api/users/me", { credentials: "include" });
      if (!sesion.ok) return;
      const datos = await sesion.json();
      usuario = datos.usuario;
    } catch {
      return;
    }

    crearWidget();
    await cargar();
    conectarTiempoReal();

    if (usuario && ["admin", "administrador"].includes(usuario.rol)) {
      document
        .querySelectorAll("[data-admin]")
        .forEach((nodo) => nodo.classList.remove("d-none"));
    }

    temporizador = setInterval(cargar, INTERVALO);
    window.addEventListener("beforeunload", () => clearInterval(temporizador));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
