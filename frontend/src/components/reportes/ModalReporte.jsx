import { useEffect } from "react";
import FormularioReporte from "./FormularioReporte";

// Reporte de la otra parte de un servicio (historia "Reporte de usuario").
// El reporte llega al panel de moderación del administrador.
export default function ModalReporte({ persona, alCerrar, alEnviado }) {
  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        alCerrar();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [alCerrar]);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{`Reportar a ${persona.nombre}`}</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={alCerrar}></button>
            </div>

            <div className="modal-body">
              <p className="text-secondary small">
                La administración revisa cada reporte y puede contactar a las partes o suspender la
                cuenta. Para problemas con un servicio puntual, también podés abrir un reclamo.
              </p>

              <FormularioReporte
                tipo="usuario"
                destino={{ reportadoId: persona.id }}
                alEnviado={alEnviado}
                alCancelar={alCerrar}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
