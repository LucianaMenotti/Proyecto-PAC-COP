import { useEffect, useState } from "react";
import { apiFetch } from "../../config/api";
import { validarEvidencias } from "../../helpers/reclamos";

const formatearReloj = () =>
  new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "medium" });

// Mismo formulario y mismo endpoint (POST /api/reclamos, multipart) que components/reclamos/ModalReclamo.jsx,
// pero con las clases de Tailwind del panel del prestador (en el panel no se carga Bootstrap).
export default function ModalReclamoPanel({ servicio, alCerrar, alEnviado }) {
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [vistas, setVistas] = useState([]);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reloj, setReloj] = useState(formatearReloj());

  useEffect(() => {
    const temporizador = setInterval(() => setReloj(formatearReloj()), 1000);

    return () => clearInterval(temporizador);
  }, []);

  useEffect(() => {
    const direcciones = archivos.map((archivo) => URL.createObjectURL(archivo));

    setVistas(direcciones);

    return () => direcciones.forEach((direccion) => URL.revokeObjectURL(direccion));
  }, [archivos]);

  const cambiarArchivos = (evento) => {
    setError("");

    const elegidos = Array.from(evento.target.files);
    const mensaje = validarEvidencias(elegidos);

    if (mensaje) {
      setError(mensaje);
      setArchivos([]);
      evento.target.value = "";
      return;
    }

    setArchivos(elegidos);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    const texto = descripcion.trim();

    if (texto.length < 10) {
      setError("La descripción debe tener al menos 10 caracteres.");
      return;
    }

    const mensaje = validarEvidencias(archivos);

    if (mensaje) {
      setError(mensaje);
      return;
    }

    const datos = new FormData();

    datos.append("servicioId", servicio.id);
    datos.append("descripcion", texto);
    archivos.forEach((archivo) => datos.append("evidencias", archivo));

    setEnviando(true);

    try {
      const respuesta = await apiFetch("/api/reclamos", { method: "POST", body: datos });
      let resultado = {};

      try {
        resultado = await respuesta.json();
      } catch {
        resultado = {};
      }

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo enviar el reclamo");
      }

      alEnviado();
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={enviar}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <i className="bi bi-flag-fill text-rose-500"></i> Reclamar servicio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {`${servicio.tipo} - ${servicio.mascota} (servicio #${servicio.id})`}
            </p>
          </div>
          <button type="button" onClick={alCerrar} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Fecha y hora del reclamo
          </label>
          <input
            type="text"
            value={reloj}
            readOnly
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500"
          />
          <span className="text-[11px] text-slate-400">Se registra automáticamente al enviar el reclamo.</span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Descripción</label>
          <textarea
            rows="4"
            minLength={10}
            maxLength={2000}
            required
            placeholder="Explicá el motivo del reclamo: mascota lastimada, prestador ausente, cobro indebido, daños, etc."
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
            Evidencias fotográficas (opcional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={cambiarArchivos}
            className="w-full text-xs text-slate-600"
          />
          <span className="text-[11px] text-slate-400 block mt-1">
            Hasta 5 imágenes JPG, PNG o WEBP de 5 MB cada una.
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {vistas.map((direccion) => (
              <img
                key={direccion}
                src={direccion}
                alt="Vista previa de la evidencia"
                className="w-16 h-16 object-cover rounded-lg border border-slate-200"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={alCerrar}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar reclamo"}
          </button>
        </div>
      </form>
    </div>
  );
}
