import { useState } from "react";
import { Link } from "react-router-dom";
import { RUTAS } from "../config/rutas";
import { formatearHora } from "../helpers/geografia";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";
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

function FormularioCalificacion({ calificacion, alEnviar }) {
  const [puntuacion, setPuntuacion] = useState("");
  const [comentario, setComentario] = useState("");

  const enviar = (evento) => {
    evento.preventDefault();
    alEnviar({ puntuacion: Number(puntuacion), comentario: comentario.trim() });
  };

  return (
    <section className="panel-calificacion">
      <h2>Calificá el servicio</h2>

      <p>Contanos cómo fue la experiencia con el prestador.</p>

      <form onSubmit={enviar}>
        <label htmlFor="puntuacion">Puntuación</label>

        <select
          id="puntuacion"
          required
          value={puntuacion}
          onChange={(evento) => setPuntuacion(evento.target.value)}
        >
          <option value="">Seleccionar</option>
          <option value="1">1 estrella</option>
          <option value="2">2 estrellas</option>
          <option value="3">3 estrellas</option>
          <option value="4">4 estrellas</option>
          <option value="5">5 estrellas</option>
        </select>

        <label htmlFor="comentario">Comentario</label>

        <textarea
          id="comentario"
          rows="4"
          maxLength="500"
          placeholder="Escribí un comentario opcional"
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
        ></textarea>

        <button type="submit" className="boton-primario" disabled={calificacion.enviando}>
          Enviar calificación
        </button>

        <p>{calificacion.mensaje}</p>
      </form>
    </section>
  );
}

export default function Seguimiento() {
  const { usuario } = useAuth();
  const seguimiento = useSeguimiento();
  const { servicio, paso, error, calificacion } = seguimiento;

  useEstilos("mapa", estilosMapa);
  useEstilos("seguimiento", estilosSeguimiento);
  useEstilos("base", estilosBase);

  const indicePaso = PASOS.findIndex((item) => item.id === paso);
  const insignia = INSIGNIAS[paso];
  const horaProgramada = servicio ? formatearHora(servicio.horaProgramada) : "—";
  const duracionTotal =
    seguimiento.horaInicioReal && seguimiento.horaFinReal
      ? Math.floor((seguimiento.horaFinReal - seguimiento.horaInicioReal) / 1000)
      : 0;

  const rutaVolver = usuario?.rol === "prestador" ? RUTAS.panelPrestador : RUTAS.misServicios;
  const mensajeError = error ? <p className="mensaje-error">{error}</p> : null;
  const iniciales = servicio?.prestador
    ? servicio.prestador
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("")
    : "—";

  return (
    <>
      <nav className="seg-nav">
        <div className="seg-nav-container">
          <Link to={RUTAS.inicio} className="seg-nav-brand">
            Pac-Cop
          </Link>
          <Link to={rutaVolver} className="seg-nav-back">
            ← Volver
          </Link>
        </div>
      </nav>

      <div className="seg-wrap">
        <header className="seg-header">
          <p className="seg-eyebrow">Servicio #{servicio ? servicio.id : "—"}</p>
          <h1>Seguimiento del paseo en vivo</h1>
        </header>

        <section className="resumen" aria-label="Resumen del servicio">
          <div className="resumen-prestador">
            <div className="resumen-avatar-box">{iniciales}</div>

            <div>
              <p className="resumen-nombre">{servicio ? servicio.prestador : "—"}</p>
              <p className="resumen-servicio">{servicio ? servicio.tipo : "—"}</p>
            </div>
          </div>

          <dl className="resumen-datos">
            <div>
              <dt>Mascota</dt>
              <dd>{servicio ? servicio.mascota : "—"}</dd>
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
                    <strong>{servicio ? servicio.mascota : "la mascota"}</strong> en el mapa en cuanto{" "}
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

                {servicio?.puedeGestionar && (
                  <button
                    type="button"
                    className="boton-secundario"
                    disabled={!seguimiento.puedeFinalizar}
                    onClick={seguimiento.finalizar}
                  >
                    Finalizar servicio
                  </button>
                )}
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

                {calificacion.visible && (
                  <FormularioCalificacion calificacion={calificacion} alEnviar={seguimiento.calificar} />
                )}

                {!calificacion.visible && calificacion.mensaje && (
                  <p className="mensaje-calificacion">{calificacion.mensaje}</p>
                )}

                <dl className="resumen-final">
                  <div>
                    <dt>Hora de inicio</dt>
                    <dd>
                      {seguimiento.horaInicioReal ? formatearHora(seguimiento.horaInicioReal) : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Hora de finalización</dt>
                    <dd>{seguimiento.horaFinReal ? formatearHora(seguimiento.horaFinReal) : "—"}</dd>
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
