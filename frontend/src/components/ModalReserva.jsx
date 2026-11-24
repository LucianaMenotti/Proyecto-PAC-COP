import { useEffect, useMemo, useState } from "react";
import { enviarJson } from "../config/api";
import { configPrecioDe } from "../helpers/prestadores";
import { calcularPresupuesto, formatearPesos } from "../helpers/precios";

const MOTIVOS_TRASLADO = [
  { valor: "", texto: "Sin especificar" },
  { valor: "queda", texto: "Vuelta de un servicio (guardería)" },
  { valor: "viaje", texto: "Traslado puntual" },
  { valor: "mudanza", texto: "Cambio de domicilio" }
];

export default function ModalReserva({
  prestador,
  serviciosConPrecio,
  mascotas,
  alCerrar,
  alCrear
}) {
  const [servicio, setServicio] = useState(serviciosConPrecio[0] || "");
  const [mascotasElegidas, setMascotasElegidas] = useState(mascotas[0] ? [Number(mascotas[0].id)] : []);
  const [fecha, setFecha] = useState("");
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [solicitarVuelta, setSolicitarVuelta] = useState(false);
  const [horaRegreso, setHoraRegreso] = useState("");
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

  const esTraslado = servicio === "Traslado";
  const permiteVuelta = esTraslado && motivo === "queda";

  // El precio depende de las horas contratadas, no de la cantidad de mascotas.
  const config = useMemo(() => configPrecioDe(prestador, servicio), [prestador, servicio]);
  const presupuesto = useMemo(
    () => calcularPresupuesto(config.precioBase, duracionHoras),
    [config.precioBase, duracionHoras]
  );

  const alternarMascota = (id) => {
    setError("");
    setMascotasElegidas((anterior) =>
      anterior.includes(id) ? anterior.filter((item) => item !== id) : [...anterior, id]
    );
  };

  const cambiarMotivo = (valor) => {
    setMotivo(valor);

    if (valor !== "queda") {
      setSolicitarVuelta(false);
      setHoraRegreso("");
    }
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    setError("");

    if (mascotasElegidas.length === 0) {
      setError("Seleccioná al menos una mascota.");
      return;
    }

    if (!Number.isFinite(Number(duracionHoras)) || Number(duracionHoras) < 1 || Number(duracionHoras) > 24) {
      setError("La duración debe estar entre 1 y 24 horas.");
      return;
    }

    const cuerpo = {
      providerId: prestador.id,
      tipo: servicio,
      mascotaIds: mascotasElegidas,
      mascotaId: mascotasElegidas[0],
      horaProgramada: new Date(fecha).toISOString(),
      duracionHoras: Number(duracionHoras)
    };

    if (esTraslado) {
      if (!origen.trim() || !destino.trim()) {
        setError("Indicá el origen y el destino del traslado.");
        return;
      }

      cuerpo.origen = origen.trim();
      cuerpo.destino = destino.trim();
      cuerpo.motivoTraslado = motivo;

      if (permiteVuelta && solicitarVuelta) {
        if (!horaRegreso) {
          setError("Indicá la fecha y hora de regreso.");
          return;
        }

        cuerpo.solicitarVuelta = true;
        cuerpo.horaRegreso = new Date(horaRegreso).toISOString();
      }
    }

    setEnviando(true);

    try {
      const { ok, datos } = await enviarJson("/api/servicios", "POST", cuerpo);

      if (!ok) {
        setError(datos.mensaje || "No se pudo crear la reserva");
        return;
      }

      alCrear(datos);
    } catch {
      setError("No se pudo crear la reserva. Intentalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-scrollable">
          <form className="modal-content" onSubmit={enviar}>
            <div className="modal-header">
              <h5 className="modal-title">
                {`Reservar con ${prestador.nombre} ${prestador.apellido}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={alCerrar}
              ></button>
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="reservaServicio">
                  Servicio
                </label>
                <select
                  id="reservaServicio"
                  className="form-select"
                  required
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                >
                  {serviciosConPrecio.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1">
                  <span>Mascotas a atender</span>
                  <small className="text-secondary fw-normal">Podés elegir una o varias</small>
                </label>

                <div
                  className="border rounded p-2 bg-light d-flex flex-column gap-2"
                  style={{ maxHeight: "180px", overflowY: "auto" }}
                >
                  {mascotas.map((mascota) => (
                    <div className="form-check" key={mascota.id}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`reservaMascota${mascota.id}`}
                        checked={mascotasElegidas.includes(Number(mascota.id))}
                        onChange={() => alternarMascota(Number(mascota.id))}
                      />
                      <label className="form-check-label" htmlFor={`reservaMascota${mascota.id}`}>
                        <strong>{mascota.nombre}</strong>{" "}
                        <small className="text-secondary">
                          ({mascota.tipo || "Mascota"}
                          {mascota.tamano ? ` - ${mascota.tamano}` : ""})
                        </small>
                      </label>
                    </div>
                  ))}
                </div>

                {mascotasElegidas.length === 0 && (
                  <div className="text-danger small mt-1">
                    Seleccioná al menos una mascota para continuar.
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="duracionHoras">
                  Duración del servicio (horas)
                </label>
                <input
                  type="number"
                  id="duracionHoras"
                  className="form-control"
                  min="1"
                  max="24"
                  step="1"
                  required
                  value={duracionHoras}
                  onChange={(e) => setDuracionHoras(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="reservaFecha">
                  Fecha y hora de inicio
                </label>
                <input
                  type="datetime-local"
                  id="reservaFecha"
                  className="form-control"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              {esTraslado && (
                <div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="trasladoOrigen">
                      Dirección de origen
                    </label>
                    <input
                      id="trasladoOrigen"
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      required
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="trasladoDestino">
                      Dirección de destino
                    </label>
                    <input
                      id="trasladoDestino"
                      type="text"
                      className="form-control"
                      autoComplete="off"
                      required
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="trasladoMotivo">
                      Motivo
                    </label>
                    <select
                      id="trasladoMotivo"
                      className="form-select"
                      value={motivo}
                      onChange={(e) => cambiarMotivo(e.target.value)}
                    >
                      {MOTIVOS_TRASLADO.map((item) => (
                        <option key={item.valor} value={item.valor}>
                          {item.texto}
                        </option>
                      ))}
                    </select>
                  </div>

                  {permiteVuelta && (
                    <div className="mb-3">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="solicitarVuelta"
                          checked={solicitarVuelta}
                          onChange={(e) => setSolicitarVuelta(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="solicitarVuelta">
                          Solicitar también la vuelta de la mascota
                        </label>
                      </div>

                      {solicitarVuelta && (
                        <>
                          <label className="form-label small" htmlFor="horaRegreso">
                            Fecha y hora de regreso
                          </label>
                          <input
                            type="datetime-local"
                            id="horaRegreso"
                            className="form-control"
                            value={horaRegreso}
                            onChange={(e) => setHoraRegreso(e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="card bg-light border p-3 my-3 rounded-3">
                <h6 className="fw-bold mb-2">Desglose del presupuesto</h6>

                <div className="d-flex justify-content-between small text-secondary mb-1">
                  <span>Precio por hora:</span>
                  <strong>{formatearPesos(presupuesto.precioHora)}</strong>
                </div>

                <div className="d-flex justify-content-between small text-secondary mb-1">
                  <span>Duración:</span>
                  <strong>{presupuesto.duracionHoras} hora(s)</strong>
                </div>

                <div className="d-flex justify-content-between small text-secondary mb-1">
                  <span>Mascotas seleccionadas:</span>
                  <strong>{mascotasElegidas.length}</strong>
                </div>

                <hr className="my-2" />

                <div className="d-flex justify-content-between fs-5 fw-bold text-dark">
                  <span>Total estimado:</span>
                  <span className="text-primary">
                    {presupuesto.total > 0 ? formatearPesos(presupuesto.total) : "—"}
                  </span>
                </div>
              </div>

              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={alCerrar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={enviando}>
                {enviando ? "Reservando..." : "Confirmar reserva"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
