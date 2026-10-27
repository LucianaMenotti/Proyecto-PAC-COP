import { Link } from "react-router-dom";
import NavbarInicio from "../components/NavbarInicio";
import PieInicio from "../components/PieInicio";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

export default function Landing() {
  useBootstrap(true);
  useEstilos("base", estilosBase);

  return (
    <>
      <NavbarInicio />
      <section className="hero py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-primary-subtle text-primary mb-3">
                La mejor red de servicios para mascotas en Formosa
              </span>
              <h1 className="display-4 fw-bold">El cuidado que tu mascota necesita.</h1>
              <p className="lead text-secondary mt-3">
                Encontrá paseadores y prestadores de servicios confiables para cuidar a tu mascota
                cuando vos no podés.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/buscar-prestadores" className="btn btn-primary btn-lg">
                  <i className="bi bi-search me-1"></i>
                  Buscar prestadores
                </Link>
                <Link to="/registro" className="btn btn-outline-primary btn-lg">
                  <i className="bi bi-person-plus me-1"></i>
                  Registrarme
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center mt-5 mt-lg-0">
              <div className="position-relative d-inline-block">
                <img
                  src="/img/descarga (58).png"
                  alt="Mascota feliz con Pac-Cop"
                  className="img-fluid rounded-4 shadow-lg"
                  style={{ maxHeight: "420px", objectFit: "cover" }}
                />
                <div
                  id="tarjetaPaseoActivo"
                  className="d-none position-absolute bottom-0 start-0 translate-middle-y bg-white p-3 rounded-4 shadow border text-start"
                  style={{ maxWidth: "220px" }}
                >
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="spinner-grow spinner-grow-sm text-danger" role="status"></span>
                    <span className="badge bg-danger-subtle text-danger fw-bold">En paseo</span>
                  </div>
                  <p className="small fw-bold mb-0" id="paseoActivoTitulo"></p>
                  <small className="text-secondary" id="paseoActivoDetalle"></small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="como-funciona" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">¿Cómo funciona?</h2>
            <p className="text-secondary">Encontrar un servicio para tu mascota es muy sencillo.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-search fs-1 text-primary"></i>
                </div>
                <h4>Buscás</h4>
                <p className="text-secondary">
                  Encontrá prestadores según el servicio que necesitás y buscá opciones disponibles
                  en tu zona.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-person-check fs-1 text-primary"></i>
                </div>
                <h4>Elegís</h4>
                <p className="text-secondary">
                  Consultá el perfil del prestador, sus servicios y la información disponible antes
                  de contratar.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm text-center p-4">
                <div className="mb-3">
                  <i className="bi bi-heart-check fs-1 text-primary"></i>
                </div>
                <h4>Comprobás</h4>
                <p className="text-secondary">
                  Una vez contratado el servicio, podés mantenerte en contacto con el prestador y
                  consultar el estado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="servicios" className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Nuestros servicios</h2>
            <p className="text-secondary">Encontrá el servicio adecuado para tu mascota.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card service-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-person-walking fs-1 text-primary"></i>
                  <h4 className="mt-3">Paseo</h4>
                  <p className="text-secondary">
                    Encontrá paseadores para que tu mascota pueda salir, caminar y gastar energía.
                  </p>
                  <Link to="/buscar-prestadores" className="btn btn-outline-primary">
                    Buscar paseadores
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card service-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-house-heart fs-1 text-primary"></i>
                  <h4 className="mt-3">Cuidado</h4>
                  <p className="text-secondary">
                    Personas que pueden acompañar y cuidar a tu mascota mientras estás fuera.
                  </p>
                  <Link to="/buscar-prestadores" className="btn btn-outline-primary">
                    Buscar cuidadores
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card service-card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-car-front fs-1 text-primary"></i>
                  <h4 className="mt-3">Traslado</h4>
                  <p className="text-secondary">
                    Encontrá personas que puedan ayudarte con el traslado de tu mascota.
                  </p>
                  <Link to="/buscar-prestadores" className="btn btn-outline-primary">
                    Buscar prestadores
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">También contamos con</h2>
            <p className="text-secondary">Herramientas adicionales para mejorar la experiencia.</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-shield-lock fs-1 text-primary"></i>
                  <h4 className="mt-3">Pago Seguro</h4>
                  <p className="text-secondary">
                    Un flujo de pago protegido para las reservas de servicios.
                  </p>
                  <Link to="/pago" className="btn btn-outline-primary">
                    Ver módulo
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-geo-alt fs-1 text-primary"></i>
                  <h4 className="mt-3">Seguimiento GPS</h4>
                  <p className="text-secondary">
                    Seguimiento de paseos y traslados mediante un mapa en tiempo real.
                  </p>
                  <Link to="/seguimiento" className="btn btn-outline-primary">
                    Ver módulo
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <i className="bi bi-heart-pulse fs-1 text-primary"></i>
                  <h4 className="mt-3">Ficha de Salud</h4>
                  <p className="text-secondary">
                    Información de salud y datos importantes de tu mascota.
                  </p>
                  <Link to="/ficha-salud" className="btn btn-outline-primary">
                    Ver ficha
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-5">
        <div className="container">
          <div className="cta-box text-center p-5">
            <h2 className="fw-bold">¿Necesitás ayuda con tu mascota?</h2>
            <p className="mt-3">Encontrá un prestador de servicios en tu zona.</p>
            <div className="d-flex justify-content-center flex-wrap gap-2 mt-4">
              <Link to="/buscar-prestadores" className="btn btn-primary btn-lg">
                <i className="bi bi-search me-1"></i>
                Encontrar un prestador
              </Link>
              <Link to="/registro" className="btn btn-outline-primary btn-lg">
                <i className="bi bi-person-plus me-1"></i>
                Registrarme
              </Link>
            </div>
          </div>
        </div>
      </section>
      <PieInicio />
    </>
  );
}
