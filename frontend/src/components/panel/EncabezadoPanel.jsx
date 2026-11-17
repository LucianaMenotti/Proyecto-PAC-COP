const NIVELES = {
  nuevo: { texto: "Nivel: Nuevo", clase: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  establecido: { texto: "Nivel: Establecido", clase: "bg-teal-100 text-teal-800 border-teal-200" },
  top: { texto: "Nivel: Top ⭐", clase: "bg-amber-100 text-amber-800 border-amber-300" }
};

// Cabecera del panel. La navegación global vive en la barra única de la aplicación (NavbarApp).
export default function EncabezadoPanel({ usuario, nivel }) {
  const nombre = usuario?.nombre ? `${usuario.nombre} ${usuario.apellido || ""}`.trim() : "Prestador";
  const insignia = NIVELES[nivel] || NIVELES.nuevo;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <p className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-1">
          Espacio prestador
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">{nombre}</h1>
      </div>

      <span className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-xs ${insignia.clase}`}>
        {insignia.texto}
      </span>
    </div>
  );
}
