import { Link } from "react-router-dom";

export default function PieInicio() {
  return (
    <footer className="py-4 bg-dark text-white">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-6">
            <h5 className="fw-bold">
              <i className="bi bi-shield-fill-check me-1"></i>
              Pac-Cop
            </h5>
            <p className="text-white-50 mb-0">
              Plataforma de servicios para el cuidado, paseo y traslado de mascotas en Formosa.
            </p>
          </div>
          <div className="col-md-3">
            <h6 className="fw-bold">Plataforma</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/buscar-prestadores" className="text-white-50 text-decoration-none">
                  Buscar prestadores
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-white-50 text-decoration-none">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-white-50 text-decoration-none">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link to="/panel-prestador" className="text-white-50 text-decoration-none">
                  Panel del Prestador
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h6 className="fw-bold">Herramientas</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/pago" className="text-white-50 text-decoration-none">
                  Pago Seguro
                </Link>
              </li>
              <li>
                <Link to="/seguimiento" className="text-white-50 text-decoration-none">
                  Seguimiento GPS
                </Link>
              </li>
              <li>
                <Link to="/ficha-salud" className="text-white-50 text-decoration-none">
                  Ficha de Salud
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <p className="text-center text-white-50 mb-0">© 2026 Pac-Cop · Proyecto Grupal</p>
      </div>
    </footer>
  );
}
