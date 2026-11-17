import { useCallback, useEffect, useState } from "react";
import TablaServiciosAdmin from "../components/admin/TablaServiciosAdmin";
import TablaUsuarios from "../components/admin/TablaUsuarios";
import { apiDatos } from "../config/api";
import { useBootstrap } from "../hooks/useBootstrap";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";

function Tarjeta({ titulo, valor, detalle, claseDetalle = "text-secondary" }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <p className="text-secondary small mb-1">{titulo}</p>
          <p className="fs-3 fw-bold mb-0">{valor}</p>
          {detalle && <small className={claseDetalle}>{detalle}</small>}
        </div>
      </div>
    </div>
  );
}

// Panel de administración (rol admin): métricas, gestión de usuarios y moderación de servicios.
// API: /api/admin/resumen, /api/admin/usuarios, /api/admin/servicios
export default function Admin() {
  const [resumen, setResumen] = useState(null);
  const [pestana, setPestana] = useState("usuarios");
  const [aviso, setAviso] = useState(null);

  useBootstrap(true);
  useEstilos("base", estilosBase);

  const avisar = useCallback((texto, tipo = "success") => setAviso({ texto, tipo }), []);

  const cargarResumen = useCallback(async () => {
    try {
      setResumen(await apiDatos("/api/admin/resumen"));
    } catch (error) {
      avisar(error.message, "danger");
    }
  }, [avisar]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    if (!aviso) {
      return undefined;
    }

    const temporizador = setTimeout(() => setAviso(null), 3500);

    return () => clearTimeout(temporizador);
  }, [aviso]);

  return (
    <div className="pac-seccion">
      {aviso && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 1090 }}
        >
          <div className={`alert alert-${aviso.tipo} shadow-sm mb-0 py-2 px-3`}>{aviso.texto}</div>
        </div>
      )}

      <main className="container py-4 py-lg-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <h1 className="mb-1">Panel de administración</h1>
            <p className="text-secondary mb-0">Métricas, usuarios y moderación de servicios.</p>
          </div>

          <span className="badge bg-white text-primary-pac border px-3 py-2 rounded-pill">
            <i className="bi bi-shield-check me-1"></i> Rol administrador
          </span>
        </div>

        <section className="row g-3 mb-4">
          <Tarjeta titulo="Usuarios" valor={resumen ? resumen.usuarios : "-"} />
          <Tarjeta
            titulo="Prestadores"
            valor={resumen ? resumen.prestadores : "-"}
            detalle={resumen ? `${resumen.verificados} verificados` : "-"}
            claseDetalle="text-success"
          />
          <Tarjeta
            titulo="Servicios"
            valor={resumen ? resumen.servicios : "-"}
            detalle={
              resumen
                ? `${resumen.serviciosPorEstado.enCurso} en curso · ${resumen.serviciosPorEstado.finalizados} finalizados`
                : "-"
            }
          />
          <Tarjeta
            titulo="Pagos retenidos"
            valor={resumen ? resumen.pagos.retenidos : "-"}
            detalle={
              resumen ? `$${Number(resumen.pagos.recaudado).toLocaleString("es-AR")} recaudado` : "-"
            }
          />
        </section>

        <ul className="nav nav-pills gap-2 mb-3">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link rounded-pill${pestana === "usuarios" ? " active" : ""}`}
              onClick={() => setPestana("usuarios")}
            >
              Usuarios
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={`nav-link rounded-pill${pestana === "servicios" ? " active" : ""}`}
              onClick={() => setPestana("servicios")}
            >
              Servicios
            </button>
          </li>
        </ul>

        {pestana === "usuarios" ? (
          <TablaUsuarios alAvisar={avisar} alCambiar={cargarResumen} />
        ) : (
          <TablaServiciosAdmin alAvisar={avisar} alCambiar={cargarResumen} />
        )}
      </main>
    </div>
  );
}
