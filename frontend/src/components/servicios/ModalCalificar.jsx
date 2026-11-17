import { useEffect, useState } from "react";
import { enviarJson } from "../../config/api";

// POST /api/servicios/:id/calificacion { puntuacion, comentario } (solo el dueño, una vez por servicio finalizado)
export default function ModalCalificar({ servicio, alCerrar, alCalificado }) {
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        alCerrar();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [alCerrar]);

  const enviar = async () => {
    setError("");
    setEnviando(true);

    try {
      const { ok, datos } = await enviarJson(`/api/servicios/${servicio.id}/calificacion`, "POST", {
        puntuacion: Number(puntuacion),
        comentario: comentario.trim()
      });

      if (!ok) {
        setError(datos.mensaje || "No se pudo enviar la reseña");
        return;
      }

      alCalificado();
    } catch {
      setError("No se pudo enviar la reseña");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Calificar servicio</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              <p className="text-secondary">
                ¿Cómo fue tu experiencia con <strong>{servicio.prestador}</strong> cuidando a{" "}
                <strong>{servicio.mascota}</strong>?
              </p>

              <div className="mb-3">
                <label className="form-label" htmlFor="puntuacion">
                  Puntuación
                </label>
                <select
                  className="form-select"
                  id="puntuacion"
                  value={puntuacion}
                  onChange={(evento) => setPuntuacion(evento.target.value)}
                >
                  <option value="5">5 - Excelente</option>
                  <option value="4">4 - Muy bueno</option>
                  <option value="3">3 - Bueno</option>
                  <option value="2">2 - Regular</option>
                  <option value="1">1 - Malo</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="comentarioResena">
                  Comentario (opcional)
                </label>
                <textarea
                  className="form-control"
                  id="comentarioResena"
                  rows="3"
                  maxLength="500"
                  value={comentario}
                  onChange={(evento) => setComentario(evento.target.value)}
                ></textarea>
              </div>

              {error && <div className="text-danger small">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={alCerrar}>
                Cerrar
              </button>
              <button type="button" className="btn btn-primary" disabled={enviando} onClick={enviar}>
                {enviando ? "Enviando..." : "Enviar reseña"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
