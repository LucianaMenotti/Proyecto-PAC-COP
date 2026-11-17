import { Link } from "react-router-dom";
import { RUTAS } from "../config/rutas";

export default function PieApp() {
  return (
    <footer className="pac-pie">
      <div className="pac-pie-interior">
        <Link to={RUTAS.inicio} className="pac-marca">
          <i className="bi bi-shield-fill-check" aria-hidden="true"></i>
          <span>Pac-Cop</span>
        </Link>
        <nav className="pac-pie-enlaces" aria-label="Pie">
          <Link to={RUTAS.buscarPrestadores}>Buscar prestadores</Link>
          <Link to={RUTAS.alertas}>Alertas</Link>
          <Link to={RUTAS.fichaSalud}>Ficha de salud</Link>
        </nav>
        <span>© 2026 Pac-Cop · Cuidado, paseo y traslado de mascotas en Formosa</span>
      </div>
    </footer>
  );
}
