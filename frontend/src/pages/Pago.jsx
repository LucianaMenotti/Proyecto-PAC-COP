import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ComprobantePago from "../components/pago/ComprobantePago";
import FormularioTarjeta from "../components/pago/FormularioTarjeta";
import PasosPago from "../components/pago/PasosPago";
import ResumenReserva from "../components/pago/ResumenReserva";
import { apiJson, enviarJson } from "../config/api";
import { RUTAS } from "../config/rutas";
import { descargarComprobante } from "../helpers/comprobante";
import {
  formatearCvv,
  formatearNumero,
  formatearVencimiento,
  validarTarjeta
} from "../helpers/tarjeta";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosPago from "../config/estilos/pago";

const TARJETA_INICIAL = { numero: "", nombre: "", vencimiento: "", cvv: "" };

export default function Pago() {
  const [reserva, setReserva] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [paso, setPaso] = useState("metodo");
  const [estado, setEstado] = useState("previo");
  const [metodo, setMetodo] = useState("tarjeta");
  const [tarjeta, setTarjeta] = useState(TARJETA_INICIAL);
  const [errores, setErrores] = useState({});
  const [validado, setValidado] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState(null);
  const [pago, setPago] = useState(null);
  const [transaccion, setTransaccion] = useState(null);
  const cargaIniciada = useRef(false);

  useBootstrap(true);
  useEstilos("pago", estilosPago);

  useEffect(() => {
    if (cargaIniciada.current) {
      return;
    }

    cargaIniciada.current = true;

    const cargarReserva = async () => {
      try {
        const { ok, datos } = await apiJson("/api/servicios/demo", { method: "POST" });

        if (!ok) {
          throw new Error(datos.mensaje || "No se pudo cargar la reserva.");
        }

        setReserva(datos.servicio);
      } catch (error) {
        setErrorCarga(error.message || "Iniciá sesión para continuar con el pago.");
      }
    };

    cargarReserva();
  }, []);

  if (errorCarga) {
    return <div className="alert alert-danger m-4">{errorCarga}</div>;
  }

  if (!reserva) {
    return null;
  }

  const montoFormateado = reserva.monto.toLocaleString("es-AR");

  const cambiarTarjeta = (campo, valor) => {
    const formateadores = {
      numero: formatearNumero,
      vencimiento: formatearVencimiento,
      cvv: formatearCvv
    };

    const nuevoValor = formateadores[campo] ? formateadores[campo](valor) : valor;

    setTarjeta((anterior) => ({ ...anterior, [campo]: nuevoValor }));
  };

  const continuarMetodo = async () => {
    let datosLocales = null;

    if (metodo === "tarjeta") {
      const resultado = validarTarjeta(tarjeta);

      setErrores(resultado.errores);
      setValidado(true);

      if (!resultado.valido) {
        return;
      }

      datosLocales = resultado.datos;
      setDatosTarjeta(datosLocales);
    }

    try {
      const { ok, datos } = await enviarJson("/api/pagos", "POST", {
        servicioId: reserva.id,
        metodo,
        ultimosDigitos: datosLocales?.ultimosDigitos
      });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo preparar el pago.");
      }

      setPago(datos.pago);
      setEstado("previo");
      setPaso("confirmar");
    } catch (error) {
      alert(error.message);
    }
  };

  const confirmarPago = async () => {
    setEstado("procesando");

    try {
      const { ok, datos } = await apiJson(`/api/pagos/${pago.id}/confirmar`, { method: "POST" });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo confirmar el pago.");
      }

      setPago(datos.pago);
      setTransaccion({
        id: datos.pago.transaccionId,
        fecha: new Date(datos.pago.confirmadoEn),
        metodo:
          datos.pago.metodo === "tarjeta"
            ? `Tarjeta terminada en ${datos.pago.ultimosDigitos}`
            : "Billetera virtual",
        estado: "Retenido (escrow)"
      });
      setEstado("retenido");
    } catch (error) {
      alert(error.message);
      setEstado("previo");
    }
  };

  const liberarPago = async () => {
    try {
      const { ok, datos } = await apiJson(`/api/pagos/${pago.id}/liberar`, { method: "POST" });

      if (!ok) {
        throw new Error(datos.mensaje || "No se pudo liberar el pago.");
      }

      setPago(datos.pago);
      setTransaccion((anterior) => ({ ...anterior, estado: "Liberado al prestador" }));
      setEstado("liberado");
    } catch (error) {
      alert(error.message);
    }
  };

  const fechaTexto = transaccion
    ? transaccion.fecha.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";

  const metodoElegido =
    metodo === "tarjeta" && datosTarjeta
      ? `Tarjeta terminada en ${datosTarjeta.ultimosDigitos}`
      : "Billetera virtual";

  return (
    <>
      <nav className="navbar bg-white border-bottom shadow-sm mb-3">
        <div className="container py-2">
          <Link to={RUTAS.inicio} className="navbar-brand fw-bold text-primary fs-4">
            Pac-Cop
          </Link>

          <div className="d-flex gap-2">
            <Link to={RUTAS.inicio} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
              <i className="bi bi-arrow-left me-1"></i> Volver al Inicio
            </Link>
          </div>
        </div>
      </nav>

      <main className="container py-3 py-md-4 pago-wrap">
        <header className="mb-4">
          <p className="text-secondary small fw-medium mb-1">Reserva #{reserva.id}</p>
          <h1 className="h2 display-title text-brand mb-0">Pagar el servicio</h1>
        </header>

        <ResumenReserva reserva={reserva} montoFormateado={montoFormateado} />

        <div className="row g-4 align-items-start">
          <PasosPago pasoActual={paso} />

          <div className="col-12 col-md-8 col-lg-9">
            <div className="card border-line shadow-sm rounded-4 p-4 min-panel-height">
              {paso === "metodo" && (
                <section>
                  <div
                    className="btn-group p-1 bg-brand-soft rounded-pill mb-4"
                    role="tablist"
                    aria-label="Elegir método de pago"
                  >
                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill fw-semibold segmento${metodo === "tarjeta" ? " activo" : " text-brand"}`}
                      role="tab"
                      aria-selected={metodo === "tarjeta"}
                      onClick={() => setMetodo("tarjeta")}
                    >
                      <i className="bi bi-credit-card me-1"></i> Tarjeta
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm rounded-pill fw-semibold segmento${metodo === "billetera" ? " activo" : " text-brand"}`}
                      role="tab"
                      aria-selected={metodo === "billetera"}
                      onClick={() => setMetodo("billetera")}
                    >
                      <i className="bi bi-wallet2 me-1"></i> Billetera virtual
                    </button>
                  </div>

                  {metodo === "tarjeta" ? (
                    <FormularioTarjeta
                      valores={tarjeta}
                      errores={errores}
                      validado={validado}
                      alCambiar={cambiarTarjeta}
                    />
                  ) : (
                    <div>
                      <p className="text-secondary mb-3">
                        Vas a ser redirigido a tu billetera virtual para autorizar el pago de{" "}
                        <strong className="text-dark">${montoFormateado}</strong>.
                      </p>

                      <div className="p-3 bg-brand-soft rounded-3 d-flex align-items-center gap-3 mb-4">
                        <div className="badge-billetera bg-brand text-white fw-bold rounded-3 d-flex align-items-center justify-content-center">
                          MP
                        </div>

                        <div>
                          <h6 className="mb-0 fw-semibold text-dark">Billetera virtual</h6>
                          <small className="text-secondary">
                            Autorización externa · Sin cargo adicional
                          </small>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-accent px-4 py-2 fw-semibold rounded-3 shadow-sm"
                    onClick={continuarMetodo}
                  >
                    Continuar <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </section>
              )}

              {paso === "confirmar" && (
                <section>
                  {estado === "previo" && (
                    <div>
                      <p className="text-secondary mb-4">
                        El monto se retiene de forma segura al confirmar la reserva y se libera al
                        prestador recién cuando el servicio se completa.
                      </p>

                      <div className="bg-light border border-line rounded-3 p-3 mb-4">
                        <div className="d-flex justify-content-between py-1 border-bottom border-line-subtle">
                          <span className="text-secondary small">Método</span>
                          <span className="fw-semibold text-dark small">{metodoElegido}</span>
                        </div>

                        <div className="d-flex justify-content-between pt-2">
                          <span className="text-secondary small">Monto a retener</span>
                          <span className="fw-bold text-accent">${montoFormateado}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-accent px-4 py-2 fw-semibold rounded-3 shadow-sm"
                        onClick={confirmarPago}
                      >
                        <i className="bi bi-shield-lock-fill me-1"></i> Confirmar y pagar
                      </button>
                    </div>
                  )}

                  {estado === "procesando" && (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-brand mb-3"
                        style={{ width: "3rem", height: "3rem" }}
                        role="status"
                      >
                        <span className="visually-hidden">Procesando...</span>
                      </div>

                      <p className="text-secondary mb-0">
                        Procesando el pago con tu{" "}
                        {metodo === "tarjeta" ? "tarjeta" : "billetera virtual"}…
                      </p>
                    </div>
                  )}

                  {estado === "retenido" && (
                    <div>
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill fw-bold mb-3">
                        <i className="bi bi-hourglass-split me-1"></i> Pago retenido en custodia
                      </span>

                      <p className="text-secondary mb-4">
                        Tu pago de <strong className="text-dark">${montoFormateado}</strong> quedó
                        retenido de forma segura. Se liberará al prestador cuando el servicio se
                        marque como completado.
                      </p>

                      <button
                        type="button"
                        className="btn btn-brand-soft px-4 py-2 fw-semibold rounded-3 text-brand"
                        onClick={liberarPago}
                      >
                        <i className="bi bi-check2-circle me-1"></i> Marcar servicio como completado
                      </button>
                    </div>
                  )}

                  {estado === "liberado" && (
                    <div>
                      <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle px-3 py-2 rounded-pill fw-bold mb-3">
                        <i className="bi bi-check-circle-fill me-1"></i> Pago liberado al prestador
                      </span>

                      <p className="text-secondary mb-4">
                        El servicio se completó y el prestador ya recibió el pago.
                      </p>

                      <button
                        type="button"
                        className="btn btn-accent px-4 py-2 fw-semibold rounded-3 shadow-sm"
                        onClick={() => setPaso("comprobante")}
                      >
                        Ver comprobante <i className="bi bi-receipt ms-1"></i>
                      </button>
                    </div>
                  )}
                </section>
              )}

              {paso === "comprobante" && transaccion && (
                <ComprobantePago
                  reserva={reserva}
                  transaccion={transaccion}
                  montoFormateado={montoFormateado}
                  fechaTexto={fechaTexto}
                  alImprimir={() => window.print()}
                  alDescargar={() =>
                    descargarComprobante({ reserva, transaccion, fechaTexto, montoFormateado })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
