import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ROLES_ADMIN, RUTAS } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import { useTema } from "../hooks/useTema";

// Enlaces por rol. Es la única barra de navegación de la aplicación: todas las páginas
// la comparten, así "Inicio" y las demás secciones se ven y se comportan igual en todos lados.
function enlacesPara(usuario) {
  if (!usuario) {
    return [
      { to: RUTAS.inicio, texto: "Inicio", icono: "bi-house", exacto: true },
      { to: RUTAS.buscarPrestadores, texto: "Buscar prestadores", icono: "bi-search" },
      { to: "/#como-funciona", texto: "¿Cómo funciona?", icono: "bi-question-circle", hash: true },
      { to: "/#servicios", texto: "Servicios", icono: "bi-grid", hash: true }
    ];
  }

  if (usuario.rol === "prestador") {
    return [
      { to: RUTAS.panelPrestador, texto: "Mi panel", icono: "bi-speedometer2" },
      { to: RUTAS.misServicios, texto: "Mis servicios", icono: "bi-calendar-check" },
      { to: RUTAS.notificaciones, texto: "Notificaciones", icono: "bi-bell" }
    ];
  }

  if (ROLES_ADMIN.includes(usuario.rol)) {
    return [
      { to: RUTAS.admin, texto: "Panel de administración", icono: "bi-shield-lock" },
      { to: RUTAS.notificaciones, texto: "Notificaciones", icono: "bi-bell" }
    ];
  }

  return [
    { to: RUTAS.inicio, texto: "Inicio", icono: "bi-house", exacto: true },
    { to: RUTAS.buscarPrestadores, texto: "Buscar prestadores", icono: "bi-search" },
    { to: RUTAS.misMascotas, texto: "Mis mascotas", icono: "bi-heart" },
    { to: RUTAS.misServicios, texto: "Mis reservas", icono: "bi-calendar-check" },
    { to: RUTAS.notificaciones, texto: "Notificaciones", icono: "bi-bell" }
  ];
}

export default function NavbarApp() {
  const { usuario, cerrarSesion } = useAuth();
  const { oscuro, alternar } = useTema();
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const ubicacion = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    setAbierto(false);
  }, [ubicacion.pathname, ubicacion.hash]);

  const enlaces = enlacesPara(usuario);

  const salir = async () => {
    setCerrando(true);
    await cerrarSesion();
    setCerrando(false);
    navegar(RUTAS.inicio);
  };

  const inicial = (usuario?.nombre || "?").charAt(0).toUpperCase();
  const destinoCuenta = ROLES_ADMIN.includes(usuario?.rol)
    ? `${RUTAS.admin}/resumen`
    : usuario?.rol === "prestador"
      ? `${RUTAS.panelPrestador}/perfil`
      : RUTAS.inicio;

  return (
    <header className="pac-nav">
      <div className="pac-nav-interior">
        <Link to={RUTAS.inicio} className="pac-marca" aria-label="Pac-Cop, ir al inicio">
          <i className="bi bi-shield-fill-check" aria-hidden="true"></i>
          <span>Pac-Cop</span>
        </Link>

        <button
          type="button"
          className="pac-icono-boton pac-hamburguesa"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="pac-menu"
          onClick={() => setAbierto((valor) => !valor)}
        >
          <i className={`bi ${abierto ? "bi-x-lg" : "bi-list"}`} aria-hidden="true"></i>
        </button>

        <div id="pac-menu" className={`pac-panel-movil${abierto ? " abierto" : ""}`}>
          <nav className="pac-enlaces" aria-label="Principal">
            {enlaces.map((enlace) =>
              enlace.hash ? (
                <Link key={enlace.to} to={enlace.to} className="pac-enlace">
                  <i className={`bi ${enlace.icono}`} aria-hidden="true"></i>
                  {enlace.texto}
                </Link>
              ) : (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  end={Boolean(enlace.exacto)}
                  className={({ isActive }) => `pac-enlace${isActive ? " activo" : ""}`}
                >
                  <i className={`bi ${enlace.icono}`} aria-hidden="true"></i>
                  {enlace.texto}
                </NavLink>
              )
            )}
          </nav>

          <div className="pac-acciones">
            <button
              type="button"
              className="pac-icono-boton"
              onClick={alternar}
              aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={oscuro ? "Modo claro" : "Modo oscuro"}
            >
              <i className={`bi ${oscuro ? "bi-sun" : "bi-moon-stars"}`} aria-hidden="true"></i>
            </button>

            {usuario ? (
              <>
                <Link to={destinoCuenta} className="pac-usuario" title="Mi cuenta">
                  <span className="pac-avatar" aria-hidden="true">
                    {inicial}
                  </span>
                  <span>{usuario.nombre}</span>
                </Link>
                <button type="button" className="pac-boton-salir" onClick={salir} disabled={cerrando}>
                  <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
                  {cerrando ? "Saliendo..." : "Salir"}
                </button>
              </>
            ) : (
              <>
                <Link to={RUTAS.login} className="pac-boton-secundario">
                  Iniciar sesión
                </Link>
                <Link to={RUTAS.registro} className="pac-boton-principal">
                  Registrarme
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
