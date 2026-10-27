import { Link } from "react-router-dom";
import { RUTAS } from "../config/rutas";

export default function BarraMarca() {
  return (
    <nav className="navbar bg-white shadow-sm">
      <div className="container">
        <Link to={RUTAS.inicio} className="navbar-brand fw-bold text-primary">
          Pac-Cop
        </Link>
      </div>
    </nav>
  );
}
