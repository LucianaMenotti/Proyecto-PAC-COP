import { Link } from "react-router-dom";
import { RUTAS } from "../config/rutas";
import { formatearHora } from "../helpers/geografia";
import { useEstilos } from "../hooks/useEstilos";
import { useSeguimiento } from "../hooks/useSeguimiento";
import estilosMapa from "../config/estilos/mapa";
import estilosSeguimiento from "../config/estilos/seguimiento";

const PASOS = [
  { id: "programado", titulo: "Inicio", descripcion: "Esperando que comience" },
  { id: "en-curso", titulo: "Tracking en vivo", descripcion: "Ubicación GPS en tiempo real" },
  { id: "finalizado", titulo: "Finalización", descripcion: "Duración y resumen" }
];

const INSIGNIAS = {
  programado: { texto: "Programado", clase: "" },
  "en-curso": { texto: "En curso", clase: "en-curso" },
  finalizado: { texto: "Finalizado", clase: "finalizado" }
};

export default function Seguimiento() {
  const seguimiento = useSeguimiento();
  const { servicio, paso, error } = seguimiento;

  useEstilos("mapa", estilosMapa);
  useEstilos("seguimiento", estilosSeguimiento);

  const indicePaso = PASOS.findIndex((item) => item.id === paso);
  const insignia = INSIGNIAS[paso];
  const horaProgramada = servicio ? formatearHora(servicio.horaProgramada) : "17:00 hs";
  const duracionTotal =
    seguimiento.horaInicioReal && seguimiento.horaFinReal
      ? Math.floor((seguimiento.horaFinReal - seguimiento.horaInicioReal) / 1000)
      : 0;

  const mensajeError = error ? <p className="mensaje-error">{error}</p> : null;

  return (
    <>
      <nav className="seg-nav">
        <div className="seg-nav-container">
          <Link to={RUTAS.inicio} className="seg-nav-brand">
            Pac-Cop
          </Link>
          <Link to={RUTAS.inicio} className="seg-nav-back">
            ← Volver al Inicio
          </Link>
        </div>
      </nav>

      <div className="seg-wrap">
        <header className="seg-header">
          <p className="seg-eyebrow">Servicio #{servicio ? servicio.id : "7734"}</p>
          <h1>Seguimiento del paseo en vivo</h1>
        </header>

        <section className="resumen" aria-label="Resumen del servicio">
          <div className="resumen-prestador">
            <div className="resumen-avatar-box">JR</div>

            <div>
              <p className="resumen-nombre">{servicio ? servicio.prestador : "Julieta Ramos"}</p>
              <p className="resumen-servicio">{servicio ? servicio.tipo : "Paseo · 1 hora"}</p>
            </div>
          </div>

          <dl className="resumen-datos">
            <div>
              <dt>Mascota</dt>
              <dd>{servicio ? servicio.mascota : "Toby"}</dd>
            </div>

            <div>
              <dt>Programado</dt>
              <dd>{horaProgramada}</dd>
            </div>

            <div className="resumen-estado">
              <dt>Estado</dt>
              <dd>
                <span className={`insignia ${insignia.clase}`}>{insignia.texto}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div className="flujo">
          <nav className="pasos" aria-label="Etapas del servicio">
            <ol>
              {PASOS.map((item, indice) => {
                let clase = "paso";

                if (item.id === paso) {
                  clase += " activo";
                }

                if (indice < indicePaso) {
                  clase += " hecho";
                }

                return (
                  <li key={item.id} data-paso={item.id} className={clase}>
                    <span className="paso-marca"></span>

                    <div>
                      <p className="paso-titulo">{item.titulo}</p>
                      <p className="paso-desc">{item.descripcion}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="panel">
            {paso === "programado" && (
              <section className="paso-contenido">
                {mensajeError}

                <div className="espera">
                  <p className="espera-texto">
                    El servicio todavía no comenzó. Vas a ver la ubicación de{" "}
                    <strong>{servicio ? servicio.mascota : "Toby"}</strong> en el mapa en cuanto{" "}
                    <span>{servicio ? servicio.prestador : "el prestador"}</span> inicie el paseo.
                  </p>

                  <div className="espera-hora">
                    <span className="espera-hora-label">Horario programado</span>
                    <span className="espera-hora-valor">{horaProgramada}</span>
                  </div>

                  <button
                    type="button"
                    className="boton-primario"
                    disabled={!seguimiento.puedeIniciar}
                    onClick={seguimiento.iniciar}
                  >
                    Iniciar servicio
                  </button>
                </div>
              </section>
            )}

            {paso === "en-curso" && (
              <section className="paso-contenido">
                {mensajeError}

                <div className="tracking-datos">
                  <div className="tracking-dato">
                    <span className="tracking-dato-label">Iniciado</span>
                    <span className="tracking-dato-valor">
                      {seguimiento.horaInicioReal ? formatearHora(seguimiento.horaInicioReal) : "—"}
                    </span>
                  </div>

                  <div className="tracking-dato">
                    <span className="tracking-dato-label">Duración</span>
                    <span className="tracking-dato-valor">{seguimiento.cronometro}</span>
                  </div>

                  <div className="tracking-dato">
                    <span className="tracking-dato-label">Distancia recorrida</span>
                    <span className="tracking-dato-valor">
                      <span>{seguimiento.distancia.toFixed(2)}</span> km
                    </span>
                  </div>
                </div>

                <div
                  ref={seguimiento.contenedorVivo}
                  className="mapa"
                  aria-label="Mapa con la ubicación en tiempo real de la mascota"
                ></div>

                <button
                  type="button"
                  className="boton-secundario"
                  disabled={!seguimiento.puedeFinalizar}
                  onClick={seguimiento.finalizar}
                >
                  Finalizar servicio
                </button>
              </section>
            )}

            {paso === "finalizado" && (
              <section className="paso-contenido">
                <span className="insignia insignia-finalizado">Servicio completado</span>

                <div
                  ref={seguimiento.contenedorFinal}
                  className="mapa mapa-final"
                  aria-label="Recorrido completo del servicio"
                ></div>

                <dl className="resumen-final">
                  <div>
                    <dt>Hora de inicio</dt>
                    <dd>{formatearHora(seguimiento.horaInicioReal)}</dd>
                  </div>

                  <div>
                    <dt>Hora de finalización</dt>
                    <dd>{formatearHora(seguimiento.horaFinReal)}</dd>
                  </div>

                  <div>
                    <dt>Duración total</dt>
                    <dd>{`${Math.floor(duracionTotal / 60)} min`}</dd>
                  </div>

                  <div>
                    <dt>Distancia recorrida</dt>
                    <dd>
                      <span>{seguimiento.distancia.toFixed(2)}</span> km
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
