export default function EncabezadoSeccion({ etiqueta, titulo, descripcion, children }) {
  return (
    <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
          {etiqueta}
        </span>
        <h2 className="text-2xl font-bold font-serif text-slate-800">{titulo}</h2>
        {descripcion && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{descripcion}</p>}
      </div>

      {children}
    </div>
  );
}
