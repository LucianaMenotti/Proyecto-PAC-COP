import { Link } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import { useAuth } from "../hooks/useAuth";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
import { RUTAS, ROLES_ADMIN } from "../config/rutas";
import estilosInicio from "../config/estilos/inicio";

export default function Inicio() {
  const { usuario } = useAuth();

  const { noLeidas } = useContadorNotificaciones();

  useEstilos("inicio", estilosInicio);

  const esAdmin = ROLES_ADMIN.includes(usuario.rol);
  const mensajeRol = esAdmin
    ? "Ingresaste como administrador."
    : "Ingresaste como dueño de mascota.";

  return (
    <>
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
                  to="/mis-servicios"
                  className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                >
                  <i className="bi bi-geo-alt text-accent-pac fs-1 mb-3"></i>
                  <h3 className="h5 fw-bold">Seguimiento GPS</h3>
                  <p className="text-secondary small mb-0">
                    Abrí el mapa en vivo de un paseo en curso desde tus reservas.
                  </p>
                </Link>
              </div>
              <div className="col-md-6 col-lg-3">
                <Link
                  to="/mis-servicios"
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
                    to={RUTAS.admin}
                    className="card feature-card h-100 rounded-4 p-4 shadow-sm text-decoration-none text-dark"
                  >
                    <i className="bi bi-shield-lock text-primary-pac fs-1 mb-3"></i>
                    <h3 className="h5 fw-bold">Panel de administración</h3>
                    <p className="text-secondary small mb-0">
                      Métricas, usuarios y moderación de servicios.
                    </p>
                  </Link>
                </div>
              )}
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
    </>
  );
}
