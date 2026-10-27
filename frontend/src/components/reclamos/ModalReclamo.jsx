import { useEffect, useState } from "react";
import { apiFetch } from "../../config/api";
import { validarEvidencias } from "../../helpers/reclamos";

const formatearReloj = () =>
  new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium"
  });

export default function ModalReclamo({ servicio, alCerrar, alEnviado }) {
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

    return () => {
      direcciones.forEach((direccion) => URL.revokeObjectURL(direccion));
    };
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
      const respuesta = await apiFetch("/api/reclamos", {
        method: "POST",
        body: datos
      });

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
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <form className="modal-content rounded-4 border-0 shadow" onSubmit={enviar}>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">Reclamar servicio</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              <p className="text-secondary mb-3">
                {`${servicio.tipo} - ${servicio.mascota} (servicio #${servicio.id})`}
              </p>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="reclamoFechaHora">
                  Fecha y hora del reclamo
                </label>
                <input
                  type="text"
                  id="reclamoFechaHora"
                  className="form-control"
                  value={reloj}
                  readOnly
                />
                <div className="form-text">Se registra automáticamente al enviar el reclamo.</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="reclamoDescripcion">
                  Descripción
                </label>
                <textarea
                  id="reclamoDescripcion"
                  className="form-control"
                  rows="4"
                  minLength={10}
                  maxLength={2000}
                  placeholder="Explicá el motivo del reclamo: mascota lastimada, prestador ausente, cobro indebido, daños, etc."
                  value={descripcion}
                  onChange={(evento) => setDescripcion(evento.target.value)}
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="reclamoEvidencias">
                  Evidencias fotográficas (opcional)
                </label>
                <input
                  type="file"
                  id="reclamoEvidencias"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={cambiarArchivos}
                />
                <div className="form-text">Hasta 5 imágenes JPG, PNG o WEBP de 5 MB cada una.</div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {vistas.map((direccion) => (
                    <img
                      key={direccion}
                      src={direccion}
                      alt="Vista previa de la evidencia"
                      className="rounded border"
                      style={{ width: "72px", height: "72px", objectFit: "cover" }}
                    />
                  ))}
                </div>
              </div>

              {error && <div className="alert alert-danger mb-0">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={alCerrar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar reclamo"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
