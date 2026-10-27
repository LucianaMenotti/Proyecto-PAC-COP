import React from 'react';

export default function Sidebar({
  currentSection,
  onSelectSection,
  pendingCount = 0,
}) {
  const menuItems = [
    { id: 'precios', num: '01', title: 'Precios y publicación', icon: 'bi-tag' },
    { id: 'rendimiento', num: '02', title: 'Rendimiento y reseñas', icon: 'bi-graph-up' },
    {
      id: 'solicitudes',
      num: '03',
      title: 'Solicitudes y ruta',
      icon: 'bi-calendar-check',
      badge: pendingCount > 0 ? pendingCount : null,
    },
    { id: 'trabajo', num: '04', title: 'Disponibilidad y mascotas', icon: 'bi-clock-history' },
    { id: 'cobros', num: '05', title: 'Cobros y guardería', icon: 'bi-wallet2' },
    { id: 'vehiculo', num: '06', title: 'Vehículo', icon: 'bi-car-front' },
    { id: 'chat', num: '07', title: 'Chat y reportes en vivo', icon: 'bi-chat-dots' },
    { id: 'perfil', num: '08', title: 'Mi perfil completo', icon: 'bi-person-circle' },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs sticky top-20">
        <p className="px-3 pt-2 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Secciones del panel
        </p>

        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none">
          {menuItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap text-left ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-teal-900 hover:bg-teal-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-teal-800/80 text-teal-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span>{item.title}</span>
                </div>

                {item.badge != null && (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
