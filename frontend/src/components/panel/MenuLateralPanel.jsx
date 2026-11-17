import { Link } from "react-router-dom";
import { RUTAS } from "../../config/rutas";

export const SECCIONES_PANEL = [
  { id: "precios", numero: "01", titulo: "Precios y publicación", icono: "bi-tag" },
  { id: "rendimiento", numero: "02", titulo: "Rendimiento y reseñas", icono: "bi-graph-up" },
  { id: "solicitudes", numero: "03", titulo: "Solicitudes y ruta", icono: "bi-calendar-check" },
  { id: "trabajo", numero: "04", titulo: "Disponibilidad y mascotas", icono: "bi-clock-history" },
  { id: "cobros", numero: "05", titulo: "Cobros y guardería", icono: "bi-wallet2" },
  { id: "vehiculo", numero: "06", titulo: "Vehículo", icono: "bi-car-front" },
  { id: "chat", numero: "07", titulo: "Chat y reportes en vivo", icono: "bi-chat-dots" },
  { id: "reclamos", numero: "08", titulo: "Reclamos", icono: "bi-flag" },
  { id: "perfil", numero: "09", titulo: "Mi perfil completo", icono: "bi-person-circle" }
];

export default function MenuLateralPanel({ seccionActual, pendientes = 0 }) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs lg:sticky lg:top-20">
        <p className="px-3 pt-2 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          Espacio Prestador
        </p>

        <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
          {SECCIONES_PANEL.map((item) => {
            const activa = seccionActual === item.id;
            const insignia = item.id === "solicitudes" && pendientes > 0 ? pendientes : null;

            return (
              <Link
                key={item.id}
                to={`${RUTAS.panelPrestador}/${item.id}`}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap text-left ${
                  activa
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                      activa ? "bg-black/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.numero}
                  </span>
                  <span>{item.titulo}</span>
                </div>

                {insignia !== null && (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    {insignia}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
