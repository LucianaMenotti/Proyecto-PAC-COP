import { Link, Navigate, useNavigate } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
import { RUTAS, ROLES_ADMIN } from "../config/rutas";
import estilosBase from "../config/estilos/base";
import estilosInicio from "../config/estilos/inicio";

export default function Inicio() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const { noLeidas } = useContadorNotificaciones();

  useBootstrap(true);
  useEstilos("base", estilosBase);
  useEstilos("inicio", estilosInicio);

  if (!usuario) {
    return <Navigate to={RUTAS.login} replace />;
  }

  if (usuario.rol === "prestador") {
    return <Navigate to={RUTAS.panelPrestador} replace />;
  }

  const esAdmin = ROLES_ADMIN.includes(usuario.rol);
  const etiquetaRol = esAdmin ? "Cuenta de administrador" : "Cuenta de dueño";
  const mensajeRol = esAdmin
    ? "Ingresaste como administrador."
    : "Ingresaste como dueño de mascota.";

  const manejarCierre = async () => {
    await cerrarSesion();
    navegar(RUTAS.inicio);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand navbar-brand-pac d-flex align-items-center gap-2">
            <i className="bi bi-shield-fill-check fs-3"></i>
            <span>Pac-Cop</span>
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCuenta"
            aria-controls="navbarCuenta"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCuenta">
            <ul className="navbar-nav me-auto ms-lg-4 gap-lg-2">
              <li className="nav-item">
                <Link to="/" className="nav-link">
                  Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/buscar-prestadores" className="nav-link">
                  Buscar prestadores
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/mis-mascotas" className="nav-link">
                  Mis mascotas
                </Link>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              <span className="profile-chip rounded-pill px-3 py-2 small fw-semibold">
                {etiquetaRol}
              </span>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm rounded-pill px-3"
                onClick={manejarCierre}
              >
                <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <section className="hero-cuenta py-5">
          <div className="container py-3 py-lg-5">
            <div className="row align-items-center g-5">
              <div className="col-lg-7">
                <span className="badge bg-white text-primary-pac border px-3 py-2 rounded-pill mb-3">
                  <i className="bi bi-person-check-fill me-1"></i> Cuenta activa
                </span>
                <h1 className="font-display display-4 fw-bold text-dark">{`¡Bienvenido, ${usuario.nombre}!`}</h1>
                <p className="lead text-secondary mb-4">{mensajeRol}</p>
                <div className="d-flex flex-wrap gap-3">
                  <Link
                    to="/buscar-prestadores"
                    className="btn btn-primary btn-lg rounded-pill px-4"
                  >
                    <i className="bi bi-search me-1"></i> Buscar prestadores
                  </Link>
                  <Link
                    to="/mis-mascotas"
                    className="btn btn-outline-primary btn-lg rounded-pill px-4"
                  >
                    <i className="bi bi-heart-fill me-1"></i> Mis mascotas
                  </Link>
                </div>
              </div>
              <div className="col-lg-5 text-center">
                <div className="bg-white rounded-4 shadow-sm p-5">
                  <i
                    className="bi bi-shield-check text-primary-pac"
                    style={{ fontSize: "5rem" }}
                  ></i>
                  <h2 className="font-display h3 mt-3 mb-2">Todo en un solo lugar</h2>
                  <p className="text-secondary mb-0">
                    Encontrá servicios, cuidá la salud de tu mascota y seguí cada paseo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="py-5 bg-white">
          <div className="container">
            <div className="text-center mb-5">
              <span className="badge bg-primary-subtle text-primary-pac px-3 py-2 rounded-pill mb-2">
                Herramientas de tu cuenta
              </span>
              <h2 className="font-display display-6 fw-bold">¿Qué querés hacer?</h2>
              <p className="text-secondary mb-0">
                Accedé rápidamente a las funciones principales de Pac-Cop.
              </p>
            </div>
            <div className="row g-4">
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/buscar-prestadores"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-search text-primary-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Buscar prestadores</h3>
                  <p className="text-secondary small mb-0">
                    Encontrá paseadores, cuidadores y servicios para tu mascota.
                  </p>
                </Link>
              </div>
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/mis-mascotas"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-heart-pulse text-accent-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Mis mascotas</h3>
                  <p className="text-secondary small mb-0">
                    Consultá y actualizá la ficha de salud de tus mascotas.
                  </p>
                </Link>
              </div>
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/mis-servicios"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-calendar-check text-primary-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Mis servicios</h3>
                  <p className="text-secondary small mb-0">
                    Consultá tus reservas y accedé al chat con tu prestador.
                  </p>
                </Link>
              </div>
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/seguimiento"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-geo-alt text-accent-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Seguimiento GPS</h3>
                  <p className="text-secondary small mb-0">
                    Visualizá el recorrido de un paseo en curso.
                  </p>
                </Link>
              </div>
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/pago"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-shield-lock text-primary-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Pago seguro</h3>
                  <p className="text-secondary small mb-0">
                    Consultá y gestioná el pago de tu reserva.
                  </p>
                </Link>
              </div>
              {esAdmin && (
                <div className="col-md-6 col-lg-3">
                  <Link
                    to="/admin-reclamos"
                    className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                  >
                    <i className="bi bi-flag text-accent-pac fs-1 mb-3"></i>
                    <h3 className="h5 fw-bold">Gestionar reclamos</h3>
                    <p className="text-secondary small mb-0">
                      Revisá y resolvé los reclamos de los usuarios.
                    </p>
                  </Link>
                </div>
              )}
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/notificaciones"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-bell text-primary-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">
                    Notificaciones <ContadorNotificaciones cantidad={noLeidas} />
                  </h3>
                  <p className="text-secondary small mb-0">
                    Consultá avisos sobre tus servicios y reclamos.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-4 bg-dark text-white">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <span className="font-display text-primary-pac fs-4">
            <i className="bi bi-shield-fill-check me-1"></i> Pac-Cop
          </span>
          <span className="text-white-50 small">Cuidado, paseo y traslado de mascotas.</span>
        </div>
      </footer>
    </>
  );
}
