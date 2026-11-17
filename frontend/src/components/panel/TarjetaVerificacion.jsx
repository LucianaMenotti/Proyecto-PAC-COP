import { useState } from "react";
import { enviarDocumentacion, validarDocumentacion } from "../../helpers/documentacion";

const ESTADOS = {
  pendiente: {
    texto: "En revisión",
    detalle: "La administración está revisando tu documentación. Mientras tanto tu perfil no aparece en el buscador.",
    clase: "bg-amber-50 border-amber-200 text-amber-800"
  },
  aprobado: {
    texto: "Aprobado",
    detalle: "Tu identidad está verificada y tu perfil es visible para los dueños.",
    clase: "bg-emerald-50 border-emerald-200 text-emerald-800"
  },
  rechazado: {
    texto: "Rechazado",
    detalle: "Corregí la documentación y volvé a enviarla para una nueva revisión.",
    clase: "bg-rose-50 border-rose-200 text-rose-800"
  }
};

const ARCHIVOS = [
  ["documento", "Foto del documento", "image/jpeg,image/png,image/webp"],
  ["selfie", "Selfie de validación", "image/jpeg,image/png,image/webp"],
  ["cv", "CV o certificados", "application/pdf,image/jpeg,image/png,image/webp"]
];

// Estado de la verificación del prestador y carga de su documentación (PUT /api/users/me/documentacion).
// Con la identidad aprobada solo se actualizan el CV y la experiencia.
export default function TarjetaVerificacion({ usuario, alActualizar }) {
  const estado = ESTADOS[usuario.estadoAprobacion] || ESTADOS.pendiente;
  const aprobado = usuario.estadoAprobacion === "aprobado";
  const cargados = usuario.documentacion || {};
  const [archivos, setArchivos] = useState({ documento: null, selfie: null, cv: null });
  const [experiencia, setExperiencia] = useState(usuario.experiencia || "");
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const campos = aprobado ? ARCHIVOS.filter(([campo]) => campo === "cv") : ARCHIVOS;

  const enviar = async (evento) => {
    evento.preventDefault();
    setAviso(null);

    // Los archivos ya cargados no hace falta volver a subirlos
    const requerirIdentidad = !aprobado && (!cargados.documento || !cargados.selfie);
    const error = validarDocumentacion({ ...archivos, experiencia }, requerirIdentidad);

    if (error) {
      setAviso({ texto: error, error: true });
      return;
    }

    setEnviando(true);

    try {
      const datos = await enviarDocumentacion({ ...archivos, experiencia: experiencia.trim() });
      setAviso({ texto: datos.mensaje });
      setArchivos({ documento: null, selfie: null, cv: null });
      evento.target.reset();
      await alActualizar();
    } catch (fallo) {
      setAviso({ texto: fallo.message, error: true });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-person-badge text-teal-600"></i> Verificación y experiencia
        </h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${estado.clase}`}>
          {estado.texto}
        </span>
      </div>

      <p className="text-xs text-slate-500">{estado.detalle}</p>

      {usuario.estadoAprobacion === "rechazado" && usuario.motivoRechazo && (
        <p className="text-xs p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
          <strong>Motivo:</strong> {usuario.motivoRechazo}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {ARCHIVOS.map(([campo, etiqueta]) => (
          <span
            key={campo}
            className={`px-2.5 py-1 rounded-md border font-semibold ${
              cargados[campo]
                ? "bg-teal-50 border-teal-200 text-teal-800"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <i className={`bi ${cargados[campo] ? "bi-check2" : "bi-dash"} me-1`}></i>
            {etiqueta}
          </span>
        ))}
      </div>

      <form onSubmit={enviar} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {campos.map(([campo, etiqueta, tipos]) => (
            <label key={campo} className="text-xs text-slate-600 space-y-1 block">
              <span className="font-semibold block">{etiqueta}</span>
              <input
                type="file"
                accept={tipos}
                className="block w-full text-xs text-slate-600 file:mr-2 file:px-2.5 file:py-1 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-800"
                onChange={(evento) =>
                  setArchivos((anterior) => ({ ...anterior, [campo]: evento.target.files?.[0] || null }))
                }
              />
            </label>
          ))}
        </div>

        <label className="text-xs text-slate-600 space-y-1 block">
          <span className="font-semibold block">Experiencia con mascotas</span>
          <textarea
            rows="3"
            maxLength={2000}
            value={experiencia}
            onChange={(evento) => setExperiencia(evento.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Años de experiencia, cursos, tipo de mascotas que cuidaste..."
          />
        </label>

        {aviso && (
          <p className={`text-xs font-semibold ${aviso.error ? "text-rose-600" : "text-emerald-700"}`}>
            {aviso.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 px-4 py-2 rounded-lg transition"
        >
          {enviando ? "Enviando..." : aprobado ? "Guardar cambios" : "Enviar para revisión"}
        </button>
      </form>
    </div>
  );
}
