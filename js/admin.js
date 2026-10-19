(() => {
  const ROLES_ASIGNABLES = ["dueño", "prestador", "admin", "administrador"];
  const LIMITE = 10;

  const estadoUsuarios = { pagina: 1, buscar: "", rol: "", verificado: "" };
  const estadoServicios = { pagina: 1, estado: "" };

  const escapar = (texto) =>
    String(texto ?? "").replace(/[&<>"']/g, (caracter) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[caracter]);

  const peticion = async (url, opciones = {}) => {
    const respuesta = await fetch(url, { credentials: "include", ...opciones });
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "Ocurrió un error inesperado");
    }

    return datos;
  };

  const avisar = (texto, tipo = "success") => {
    let contenedor = document.getElementById("adminAviso");

    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = "adminAviso";
      contenedor.className =
        "position-fixed top-0 start-50 translate-middle-x mt-3";
      contenedor.style.zIndex = "1090";
      document.body.appendChild(contenedor);
    }

    contenedor.innerHTML = `<div class="alert alert-${tipo} shadow-sm mb-0 py-2 px-3">${escapar(texto)}</div>`;
    setTimeout(() => {
      contenedor.innerHTML = "";
    }, 3500);
  };

  const claseEstado = (estado) =>
    ({
      programado: "text-bg-secondary",
      aceptado: "text-bg-info",
      "en-curso": "text-bg-primary",
      finalizado: "text-bg-success",
      cancelado: "text-bg-dark",
      rechazado: "text-bg-danger",
    })[estado] || "text-bg-secondary";

  const cargarResumen = async () => {
    try {
      const datos = await peticion("/api/admin/resumen");
      const set = (id, valor) => {
        const nodo = document.getElementById(id);
        if (nodo) nodo.textContent = valor;
      };

      set("rUsuarios", datos.usuarios);
      set("rPrestadores", datos.prestadores);
      set("rVerificados", `${datos.verificados} verificados`);
      set("rServicios", datos.servicios);
      set(
        "rEnCurso",
        `${datos.serviciosPorEstado.enCurso} en curso · ${datos.serviciosPorEstado.finalizados} finalizados`,
      );
      set("rRetenidos", datos.pagos.retenidos);
      set(
        "rRecaudado",
        `$${Number(datos.pagos.recaudado).toLocaleString("es-AR")} recaudado`,
      );
    } catch (error) {
      avisar(error.message, "danger");
    }
  };

  const cargarUsuarios = async () => {
    const cuerpo = document.getElementById("usuariosBody");
    if (cuerpo) cuerpo.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Cargando...</td></tr>';

    const params = new URLSearchParams({ pagina: estadoUsuarios.pagina, limite: LIMITE });
    if (estadoUsuarios.buscar) params.set("buscar", estadoUsuarios.buscar);
    if (estadoUsuarios.rol) params.set("rol", estadoUsuarios.rol);
    if (estadoUsuarios.verificado) params.set("verificado", estadoUsuarios.verificado);

    try {
      const datos = await peticion(`/api/admin/usuarios?${params}`);
      renderUsuarios(datos);
    } catch (error) {
      avisar(error.message, "danger");
      if (cuerpo) cuerpo.innerHTML = "";
    }
  };

  const renderUsuarios = (datos) => {
    const cuerpo = document.getElementById("usuariosBody");
    if (!cuerpo) return;

    if (!datos.usuarios.length) {
      cuerpo.innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-4">Sin resultados.</td></tr>';
    } else {
      cuerpo.innerHTML = datos.usuarios
        .map((usuario) => {
          const opciones = ROLES_ASIGNABLES.map(
            (rol) =>
              `<option value="${rol}"${rol === usuario.rol ? " selected" : ""}>${rol}</option>`,
          ).join("");

          return `
          <tr data-id="${usuario.id}">
            <td>${usuario.id}</td>
            <td>${escapar(usuario.nombre)} ${escapar(usuario.apellido)}</td>
            <td>${escapar(usuario.email)}</td>
            <td>
              <select class="form-select form-select-sm rol-select" style="min-width:130px">${opciones}</select>
            </td>
            <td>
              <input type="checkbox" class="form-check-input verificado-check"${usuario.verificado ? " checked" : ""}>
            </td>
            <td class="text-end">
              <button type="button" class="btn btn-primary btn-sm guardar-usuario">Guardar</button>
            </td>
          </tr>`;
        })
        .join("");
    }

    cuerpo.querySelectorAll(".guardar-usuario").forEach((boton) => {
      boton.addEventListener("click", () => {
        const fila = boton.closest("tr");
        guardarUsuario(fila.dataset.id, fila);
      });
    });

    const info = document.getElementById("usuInfo");
    if (info) info.textContent = `Página ${datos.pagina} de ${datos.totalPaginas} (${datos.total})`;

    const prev = document.getElementById("usuPrev");
    const next = document.getElementById("usuNext");
    if (prev) prev.disabled = datos.pagina <= 1;
    if (next) next.disabled = datos.pagina >= datos.totalPaginas;
  };

  const guardarUsuario = async (id, fila) => {
    const rol = fila.querySelector(".rol-select").value;
    const verificado = fila.querySelector(".verificado-check").checked;

    try {
      await peticion(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol, verificado }),
      });
      avisar("Usuario actualizado");
      cargarResumen();
    } catch (error) {
      avisar(error.message, "danger");
    }
  };

  const cargarServicios = async () => {
    const cuerpo = document.getElementById("serviciosBody");
    if (cuerpo) cuerpo.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">Cargando...</td></tr>';

    const params = new URLSearchParams({ pagina: estadoServicios.pagina, limite: LIMITE });
    if (estadoServicios.estado) params.set("estado", estadoServicios.estado);

    try {
      const datos = await peticion(`/api/admin/servicios?${params}`);
      renderServicios(datos);
    } catch (error) {
      avisar(error.message, "danger");
      if (cuerpo) cuerpo.innerHTML = "";
    }
  };

  const nombreUsuario = (usuario) =>
    usuario ? `${usuario.nombre} ${usuario.apellido}` : "-";

  const renderServicios = (datos) => {
    const cuerpo = document.getElementById("serviciosBody");
    if (!cuerpo) return;

    if (!datos.servicios.length) {
      cuerpo.innerHTML = '<tr><td colspan="7" class="text-center text-secondary py-4">Sin resultados.</td></tr>';
    } else {
      cuerpo.innerHTML = datos.servicios
        .map((servicio) => {
          const cancelable = !["finalizado", "cancelado"].includes(servicio.estado);

          return `
          <tr data-id="${servicio.id}">
            <td>${servicio.id}</td>
            <td>${escapar(servicio.titulo || servicio.motivoTraslado || "Servicio")}</td>
            <td>${escapar(nombreUsuario(servicio.dueno))}</td>
            <td>${escapar(nombreUsuario(servicio.prestador))}</td>
            <td>$${Number(servicio.monto || 0).toLocaleString("es-AR")}</td>
            <td><span class="badge ${claseEstado(servicio.estado)}">${escapar(servicio.estado)}</span></td>
            <td class="text-end">
              ${
                cancelable
                  ? '<button type="button" class="btn btn-outline-danger btn-sm cancelar-servicio">Cancelar</button>'
                  : ""
              }
            </td>
          </tr>`;
        })
        .join("");
    }

    cuerpo.querySelectorAll(".cancelar-servicio").forEach((boton) => {
      boton.addEventListener("click", () => {
        const fila = boton.closest("tr");
        cancelarServicio(fila.dataset.id);
      });
    });

    const info = document.getElementById("servInfo");
    if (info) info.textContent = `Página ${datos.pagina} de ${datos.totalPaginas} (${datos.total})`;

    const prev = document.getElementById("servPrev");
    const next = document.getElementById("servNext");
    if (prev) prev.disabled = datos.pagina <= 1;
    if (next) next.disabled = datos.pagina >= datos.totalPaginas;
  };

  const cancelarServicio = async (id) => {
    if (!window.confirm(`¿Cancelar y reembolsar el servicio #${id}?`)) return;

    try {
      await peticion(`/api/admin/servicios/${id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: "Cancelado por administración" }),
      });
      avisar("Servicio cancelado y reembolsado");
      cargarServicios();
      cargarResumen();
    } catch (error) {
      avisar(error.message, "danger");
    }
  };

  const conectarEventos = () => {
    const buscar = document.getElementById("buscarUsuario");
    let temporizadorBusqueda = null;

    buscar?.addEventListener("input", () => {
      clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = setTimeout(() => {
        estadoUsuarios.buscar = buscar.value.trim();
        estadoUsuarios.pagina = 1;
        cargarUsuarios();
      }, 350);
    });

    document.getElementById("filtroRol")?.addEventListener("change", (evento) => {
      estadoUsuarios.rol = evento.target.value;
      estadoUsuarios.pagina = 1;
      cargarUsuarios();
    });

    document.getElementById("filtroVerificado")?.addEventListener("change", (evento) => {
      estadoUsuarios.verificado = evento.target.value;
      estadoUsuarios.pagina = 1;
      cargarUsuarios();
    });

    document.getElementById("usuPrev")?.addEventListener("click", () => {
      if (estadoUsuarios.pagina > 1) {
        estadoUsuarios.pagina -= 1;
        cargarUsuarios();
      }
    });

    document.getElementById("usuNext")?.addEventListener("click", () => {
      estadoUsuarios.pagina += 1;
      cargarUsuarios();
    });

    document.getElementById("filtroEstadoServicio")?.addEventListener("change", (evento) => {
      estadoServicios.estado = evento.target.value;
      estadoServicios.pagina = 1;
      cargarServicios();
    });

    document.getElementById("servPrev")?.addEventListener("click", () => {
      if (estadoServicios.pagina > 1) {
        estadoServicios.pagina -= 1;
        cargarServicios();
      }
    });

    document.getElementById("servNext")?.addEventListener("click", () => {
      estadoServicios.pagina += 1;
      cargarServicios();
    });

    document.getElementById("cerrarSesion")?.addEventListener("click", () => {
      window.PacCopAuth.logout();
    });
  };

  const iniciar = async () => {
    const usuario = await window.PacCopAuth.requireSession(["admin", "administrador"]);
    if (!usuario) return;

    conectarEventos();
    await Promise.all([cargarResumen(), cargarUsuarios(), cargarServicios()]);
  };

  iniciar();
})();
