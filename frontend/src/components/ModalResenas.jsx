import { useEffect, useState } from "react";
import { apiJson } from "../config/api";
import { ROLES_ADMIN } from "../config/rutas";
import { useAuth } from "../hooks/useAuth";
import FormularioReporte from "./reportes/FormularioReporte";

// Reseñas públicas de un prestador: GET /api/servicios/prestador/:id/resenas
// Con sesión, cada reseña se puede reportar a la moderación (POST /api/reportes).
export default function ModalResenas({ prestador, alCerrar }) {
  const { usuario } = useAuth();
  const [resenas, setResenas] = useState(null);
  const [error, setError] = useState("");
  const [reportando, setReportando] = useState(null);
  const [reportadas, setReportadas] = useState({});

  const puedeReportar = Boolean(usuario) && !ROLES_ADMIN.includes(usuario.rol);

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        alCerrar();
      }
    };

    document.addEventListener("keydown", manejarTecla);

    return () => document.removeEventListener("keydown", manejarTecla);
  }, [alCerrar]);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const { ok, datos } = await apiJson(`/api/servicios/prestador/${prestador.id}/resenas`);

        if (!ok) {
          throw new Error(datos.mensaje || "No se pudieron cargar las reseñas");
        }

        if (activo) {
          setResenas(datos.resenas || []);
        }
      } catch (fallo) {
        if (activo) {
          setError(fallo.message);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [prestador.id]);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{`Reseñas de ${prestador.nombre} ${prestador.apellido}`}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              {error && <p className="text-danger mb-0">{error}</p>}

              {!error && resenas === null && (
                <p className="text-secondary mb-0">Cargando reseñas...</p>
              )}

              {resenas !== null && resenas.length === 0 && (
                <p className="text-secondary mb-0">Este prestador todavía no tiene reseñas.</p>
              )}

              {(resenas || []).map((resena) => (
                <div className="border-bottom py-2" key={resena.id}>
                  <div className="d-flex justify-content-between">
                    <strong>{resena.autor}</strong>
                    <span className="text-warning">
                      {"★".repeat(resena.puntuacion)}
                      {"☆".repeat(5 - resena.puntuacion)}
                    </span>
                  </div>

                  {resena.comentario && <p className="mb-0 small">{resena.comentario}</p>}

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-secondary">
                      {new Date(resena.fecha).toLocaleDateString("es-AR")}
                    </small>

                    {puedeReportar && !reportadas[resena.id] && reportando !== resena.id && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-secondary p-0"
                        onClick={() => setReportando(resena.id)}
                      >
                        Reportar
                      </button>
                    )}

                    {reportadas[resena.id] && <small className="text-success">{reportadas[resena.id]}</small>}
                  </div>

                  {reportando === resena.id && (
                    <div className="border rounded-3 p-2 mt-2">
                      <FormularioReporte
                        tipo="resena"
                        destino={{ calificacionId: resena.id }}
                        alCancelar={() => setReportando(null)}
                        alEnviado={(mensaje) => {
                          setReportando(null);
                          setReportadas((anteriores) => ({ ...anteriores, [resena.id]: mensaje }));
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
