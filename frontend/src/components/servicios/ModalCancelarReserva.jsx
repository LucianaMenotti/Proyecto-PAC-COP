import { useEffect, useState } from "react";
import { enviarJson } from "../../config/api";

// POST /api/servicios/:id/cancelar { motivo }
// Reembolso total solo si el dueño cancela con 12 h o más de anticipación; si no, el pago pasa al prestador.
export default function ModalCancelarReserva({ servicio, alCerrar, alCancelada }) {
  const [motivo, setMotivo] = useState("");
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

  const confirmar = async () => {
    setError("");
    setEnviando(true);

    try {
      const { ok, datos } = await enviarJson(`/api/servicios/${servicio.id}/cancelar`, "POST", {
        motivo: motivo.trim()
      });

      if (!ok) {
        setError(datos.mensaje || "No se pudo cancelar la reserva");
        return;
      }

      alCancelada(datos.mensaje || "Reserva cancelada");
    } catch {
      setError("No se pudo cancelar la reserva");
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
              <h5 className="modal-title">Cancelar reserva</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              <p className="mb-2">
                ¿Querés cancelar la reserva de <strong>{servicio.tipo}</strong> para{" "}
                <strong>{servicio.mascota}</strong>?
              </p>

              <p className="text-secondary small">
                Si cancelás con 12 horas o más de anticipación se reintegra el pago. Si falta menos
                tiempo, no corresponde reembolso.
              </p>

              <label className="form-label" htmlFor="motivoCancelacion">
                Motivo (opcional)
              </label>
              <textarea
                className="form-control"
                id="motivoCancelacion"
                rows="3"
                maxLength="255"
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
              ></textarea>

              {error && <div className="text-danger small mt-2">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={alCerrar}>
                Volver
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={enviando}
                onClick={confirmar}
              >
                {enviando ? "Cancelando..." : "Cancelar reserva"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
