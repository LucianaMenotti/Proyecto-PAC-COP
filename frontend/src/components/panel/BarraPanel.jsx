import { Link } from "react-router-dom";
import { RUTAS } from "../../config/rutas";

const NIVELES = {
  nuevo: { texto: "Nivel: Nuevo", clase: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  establecido: { texto: "Nivel: Establecido", clase: "bg-teal-100 text-teal-800 border-teal-200" },
  top: { texto: "Nivel: Top ⭐", clase: "bg-amber-100 text-amber-800 border-amber-300" }
};

export default function BarraPanel({ usuario, nivel, alCerrarSesion }) {
  const inicial = usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "P";
  const nombreCorto = usuario?.nombre ? `${usuario.nombre} ${usuario.apellido || ""}`.trim() : "Usuario";
  const insignia = NIVELES[nivel] || NIVELES.nuevo;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          <div className="flex items-center gap-4">
            <Link
              to={RUTAS.inicio}
              className="text-2xl font-bold tracking-tight text-teal-800 hover:text-teal-900 transition flex items-center gap-2"
            >
              <span className="text-rose-500">🐾</span>
              <span className="font-extrabold font-serif">Pac-Cop</span>
            </Link>

            <span className="hidden md:inline-flex bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg items-center gap-1.5">
              <i className="bi bi-briefcase"></i> Prestador
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={RUTAS.misServicios}
              className="hidden sm:inline-flex text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg transition"
            >
              Mis servicios
            </Link>

            <Link
              to={RUTAS.notificaciones}
              className="hidden sm:inline-flex text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg transition"
            >
              <i className="bi bi-bell me-1"></i> Notificaciones
            </Link>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-xs hidden sm:inline-block ${insignia.clase}`}
            >
              {insignia.texto}
            </span>

            <Link
              to={`${RUTAS.panelPrestador}/perfil`}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition group"
              title="Ver mi perfil"
            >
              <div className="w-9 h-9 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm shadow group-hover:scale-105 transition">
                {inicial}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {nombreCorto}
              </span>
            </Link>

            <button
              type="button"
              onClick={alCerrarSesion}
              className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition text-sm"
              title="Cerrar sesión"
            >
              <i className="bi bi-box-arrow-right text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
