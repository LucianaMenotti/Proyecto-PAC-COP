import React from 'react';

export default function Navbar({
  user,
  nivel,
  activeRole = 'prestador', // 'prestador' | 'dueno'
  onToggleRole,
  onSelectSection,
  onLogout,
}) {
  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'P';
  const nombreCorto = user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Usuario';

  const badgeConfig = {
    nuevo: { text: 'Nivel: Nuevo', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    establecido: { text: 'Nivel: Establecido', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
    top: { text: 'Nivel: Top ⭐', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  }[nivel] || { text: 'Nivel: Nuevo', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <a
              href="/index.html"
              className="text-2xl font-bold tracking-tight text-teal-800 hover:text-teal-900 transition flex items-center gap-2"
            >
              <span className="text-rose-500">🐾</span>
              <span className="font-extrabold font-serif">Pac-Cop</span>
            </a>

            {/* Role Switcher Pill */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => onToggleRole?.('prestador')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeRole === 'prestador'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="bi bi-briefcase"></i> Prestador
              </button>
              <button
                type="button"
                onClick={() => onToggleRole?.('dueno')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeRole === 'dueno'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <i className="bi bi-heart"></i> Dueño de Mascota
              </button>
            </div>
          </div>

          {/* User Details & Actions */}
          <div className="flex items-center gap-3">
            {activeRole === 'prestador' && (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-xs hidden sm:inline-block ${badgeConfig.bg}`}
              >
                {badgeConfig.text}
              </span>
            )}

            {/* Profile Avatar / Trigger */}
            <button
              type="button"
              onClick={() => onSelectSection(activeRole === 'prestador' ? 'perfil' : 'mis-reservas')}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition group"
              title="Ver perfil o reservas"
            >
              <div
                className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-sm shadow group-hover:scale-105 transition ${
                  activeRole === 'prestador' ? 'bg-teal-700' : 'bg-rose-500'
                }`}
              >
                {inicial}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {nombreCorto}
              </span>
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition text-sm"
                title="Cerrar sesión"
              >
                <i className="bi bi-box-arrow-right text-lg"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
