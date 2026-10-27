import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavbarInicio() {
  const { usuario, cerrarSesion } = useAuth();
  const [cerrando, setCerrando] = useState(false);
  const navegar = useNavigate();

  const manejarCierre = async () => {
    setCerrando(true);
    await cerrarSesion();
    navegar("/");
    setCerrando(false);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold text-primary">
          <i className="bi bi-shield-fill-check me-1"></i> Pac-Cop
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarPrincipal"
          aria-controls="navbarPrincipal"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarPrincipal">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="#como-funciona">
                {" "}
                ¿Cómo funciona?{" "}
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#servicios">
                {" "}
                Servicios{" "}
              </a>
            </li>
            <li className="nav-item">
              <Link to="/panel-prestador" className="nav-link fw-medium">
                <i className="bi bi-speedometer2 me-1"></i> Panel Prestador
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/buscar-prestadores" className="nav-link fw-medium">
                <i className="bi bi-search me-1"></i> Buscar
              </Link>
            </li>
          </ul>
          {!usuario && (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-outline-primary">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-primary">
                Registrarse
              </Link>
            </div>
          )}
          {usuario && (
            <div className="d-flex gap-2 align-items-center">
              <Link to="/inicio" className="btn btn-outline-primary">
                <i className="bi bi-person-circle me-1"></i>
                <span>{usuario?.nombre || "Mi cuenta"}</span>
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={manejarCierre}
                disabled={cerrando}
              >
                <i className="bi bi-box-arrow-right me-1"></i>{" "}
                {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
