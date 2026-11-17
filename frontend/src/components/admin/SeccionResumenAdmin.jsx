import { useCallback, useEffect, useState } from "react";
import { apiDatos } from "../../config/api";
import {
  ESTADOS_SERVICIO,
  NOMBRE_TIPO,
  TIPOS_SERVICIO,
  fechaInput,
  formatearMonto
} from "../../helpers/admin";

const DIAS_POR_DEFECTO = 30;

const rangoInicial = () => {
  const hasta = new Date();
  const desde = new Date(hasta.getTime() - (DIAS_POR_DEFECTO - 1) * 86400000);

  return { desde: fechaInput(desde), hasta: fechaInput(hasta), tipo: "" };
};

function Indicador({ titulo, valor, detalle, icono }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <p className="text-secondary small mb-1">
            <i className={`bi ${icono} me-1`}></i>
            {titulo}
          </p>
          <p className="fs-3 fw-bold mb-0">{valor}</p>
          {detalle && <small className="text-secondary">{detalle}</small>}
        </div>
      </div>
    </div>
  );
}

// Historia "Panel de métricas": indicadores en un rango de fechas configurable,
// filtrables por tipo de servicio. GET /api/admin/resumen?desde=&hasta=&tipo=
export default function SeccionResumenAdmin({ alAvisar }) {
  const [filtros, setFiltros] = useState(rangoInicial);
  const [aplicados, setAplicados] = useState(filtros);
  const [datos, setDatos] = useState(null);

  const cargar = useCallback(async () => {
    const parametros = new URLSearchParams({ desde: aplicados.desde, hasta: aplicados.hasta });

    if (aplicados.tipo) parametros.set("tipo", aplicados.tipo);

    try {
      setDatos(await apiDatos(`/api/admin/resumen?${parametros}`));
    } catch (error) {
      alAvisar(error.message, "danger");
    }
  }, [aplicados, alAvisar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo) => (evento) =>
    setFiltros((anterior) => ({ ...anterior, [campo]: evento.target.value }));

  const aplicar = (evento) => {
    evento.preventDefault();
    setAplicados(filtros);
  };

  const reservas = datos?.reservas;
  const maximo = Math.max(...(reservas?.porTipo || []).map((item) => item.cantidad), 1);

  return (
    <>
      <form className="card border-0 shadow-sm mb-4" onSubmit={aplicar}>
        <div className="card-body row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label small text-secondary" htmlFor="metricas-desde">Desde</label>
            <input
              id="metricas-desde"
              type="date"
              className="form-control"
              value={filtros.desde}
              max={filtros.hasta}
              onChange={cambiar("desde")}
            />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small text-secondary" htmlFor="metricas-hasta">Hasta</label>
            <input
              id="metricas-hasta"
              type="date"
              className="form-control"
              value={filtros.hasta}
              min={filtros.desde}
              onChange={cambiar("hasta")}
            />
          </div>
          <div className="col-8 col-md-4">
            <label className="form-label small text-secondary" htmlFor="metricas-tipo">Tipo de servicio</label>
            <select id="metricas-tipo" className="form-select" value={filtros.tipo} onChange={cambiar("tipo")}>
              <option value="">Todos</option>
              {TIPOS_SERVICIO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {NOMBRE_TIPO[tipo]}
                </option>
              ))}
            </select>
          </div>
          <div className="col-4 col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              Aplicar
            </button>
          </div>
        </div>
      </form>

      {!datos ? (
        <p className="text-secondary">Cargando métricas...</p>
      ) : (
        <>
          <p className="small text-secondary mb-2">
            Reservas creadas entre el {new Date(datos.rango.desde).toLocaleDateString("es-AR")} y el{" "}
            {new Date(datos.rango.hasta).toLocaleDateString("es-AR")}
            {datos.rango.tipo ? ` · ${NOMBRE_TIPO[datos.rango.tipo]}` : ""}.
          </p>

          <section className="row g-3 mb-3">
            <Indicador
              titulo="Reservas"
              icono="bi-calendar-check"
              valor={reservas.total}
              detalle={`${reservas.porEstado.finalizado || 0} finalizadas · ${reservas.porEstado.cancelado || 0} canceladas`}
            />
            <Indicador
              titulo="Ingresos liberados"
              icono="bi-cash-coin"
              valor={formatearMonto(datos.ingresos.liberado)}
              detalle={`${datos.ingresos.pagosConfirmados} pagos confirmados`}
            />
            <Indicador
              titulo="En custodia"
              icono="bi-safe"
              valor={formatearMonto(datos.ingresos.retenido)}
              detalle={`${formatearMonto(datos.ingresos.reembolsado)} reembolsado`}
            />
            <Indicador
              titulo="Prestadores activos"
              icono="bi-person-workspace"
              valor={datos.prestadores.activosEnRango}
              detalle={`${datos.prestadores.aprobados} aprobados en total`}
            />
          </section>

          <section className="row g-3 mb-4">
            <Indicador
              titulo="Usuarios"
              icono="bi-people"
              valor={datos.usuarios.total}
              detalle={`${datos.usuarios.nuevosEnRango} nuevos en el rango`}
            />
            <Indicador
              titulo="Pendientes de aprobación"
              icono="bi-hourglass-split"
              valor={datos.prestadores.pendientes}
              detalle={`${datos.prestadores.rechazados} rechazados`}
            />
            <Indicador
              titulo="Cuentas suspendidas"
              icono="bi-person-slash"
              valor={datos.usuarios.suspendidos}
            />
            <Indicador
              titulo="Reclamos abiertos"
              icono="bi-flag"
              valor={datos.moderacion.reclamosAbiertos}
            />
          </section>

          <div className="row g-3">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h6 fw-bold mb-3">Servicios más solicitados</h2>

                  {reservas.porTipo.length === 0 && (
                    <p className="text-secondary small mb-0">Sin reservas en el rango elegido.</p>
                  )}

                  {reservas.porTipo.map((item) => (
                    <div key={item.tipo} className="mb-3">
                      <div className="d-flex justify-content-between small mb-1">
                        <strong>{NOMBRE_TIPO[item.tipo] || item.tipo}</strong>
                        <span className="text-secondary">
                          {item.cantidad} reservas · {item.finalizados} finalizadas ·{" "}
                          {formatearMonto(item.montoReservado)}
                        </span>
                      </div>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${(item.cantidad / maximo) * 100}%` }}
                          aria-valuenow={item.cantidad}
                          aria-valuemin="0"
                          aria-valuemax={maximo}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h6 fw-bold mb-3">Reservas por estado</h2>
                  <ul className="list-group list-group-flush">
                    {Object.entries(ESTADOS_SERVICIO).map(([estado, { texto, clase }]) => (
                      <li
                        key={estado}
                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                      >
                        {texto}
                        <span className={`badge ${clase}`}>{reservas.porEstado[estado] || 0}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
