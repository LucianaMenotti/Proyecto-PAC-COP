import { useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, useParams } from "react-router-dom";
import SeccionAuditoria from "../components/admin/SeccionAuditoria";
import SeccionModeracion from "../components/admin/SeccionModeracion";
import SeccionResumenAdmin from "../components/admin/SeccionResumenAdmin";
import TablaServiciosAdmin from "../components/admin/TablaServiciosAdmin";
import TablaUsuarios from "../components/admin/TablaUsuarios";
import { apiDatos } from "../config/api";
import { RUTAS } from "../config/rutas";
import { SECCIONES_ADMIN } from "../helpers/admin";
import { useEventoTiempoReal } from "../hooks/useTiempoReal";
import { useEstilos } from "../hooks/useEstilos";
import estilosBase from "../config/estilos/base";
import AdminReclamos from "./AdminReclamos";

// Panel de administración. Cada sección es una ruta: /admin/:seccion
// (resumen, prestadores, usuarios, servicios, reclamos, moderacion, auditoria). Todas las acciones
// se validan también en el backend (authMiddleware + adminMiddleware en /api/admin).
export default function Admin() {
  const { seccion = "resumen" } = useParams();
  const [contadores, setContadores] = useState({});
  const [aviso, setAviso] = useState(null);

  useEstilos("base", estilosBase);

  const avisar = useCallback((texto, tipo = "success") => setAviso({ texto, tipo }), []);

  // Pendientes globales que se muestran como contador en la navegación
  const cargarContadores = useCallback(async () => {
    try {
      const resumen = await apiDatos("/api/admin/resumen");

      setContadores({
        prestadoresPendientes: resumen.prestadores.pendientes,
        reclamosAbiertos: resumen.moderacion.reclamosAbiertos,
        reportesPendientes: resumen.moderacion.reportesPendientes
      });
    } catch (error) {
      avisar(error.message, "danger");
    }
  }, [avisar]);

  useEffect(() => {
    cargarContadores();
  }, [cargarContadores]);

  // Un reclamo, un reporte o un prestador que envía documentación llega como notificación
  useEventoTiempoReal("notificacion", cargarContadores);

  useEffect(() => {
    if (!aviso) {
      return undefined;
    }

    const temporizador = setTimeout(() => setAviso(null), 3500);

    return () => clearTimeout(temporizador);
  }, [aviso]);

  if (!SECCIONES_ADMIN.some((item) => item.id === seccion)) {
    return <Navigate to={`${RUTAS.admin}/resumen`} replace />;
  }

  const propiedades = { alAvisar: avisar, alCambiar: cargarContadores };

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
            <p className="text-secondary mb-0">
              Supervisión de prestadores, dueños, servicios, reclamos y moderación.
            </p>
          </div>

          <span className="badge bg-white text-primary-pac border px-3 py-2 rounded-pill">
            <i className="bi bi-shield-check me-1"></i> Rol administrador
          </span>
        </div>

        <nav className="nav nav-pills flex-nowrap overflow-auto gap-2 mb-4 pb-1" aria-label="Secciones">
          {SECCIONES_ADMIN.map((item) => {
            const cantidad = item.contador ? contadores[item.contador] : 0;

            return (
              <NavLink
                key={item.id}
                to={`${RUTAS.admin}/${item.id}`}
                className={({ isActive }) =>
                  `nav-link rounded-pill text-nowrap${isActive || (item.id === "resumen" && !seccion) ? " active" : ""}`
                }
              >
                <i className={`bi ${item.icono} me-1`}></i>
                {item.texto}
                {cantidad > 0 && <span className="badge text-bg-warning ms-2">{cantidad}</span>}
              </NavLink>
            );
          })}
        </nav>

        {seccion === "resumen" && <SeccionResumenAdmin {...propiedades} />}
        {seccion === "usuarios" && <TablaUsuarios {...propiedades} />}
        {seccion === "servicios" && <TablaServiciosAdmin {...propiedades} />}
        {seccion === "reclamos" && <AdminReclamos {...propiedades} />}
        {seccion === "moderacion" && <SeccionModeracion {...propiedades} />}
        {seccion === "auditoria" && <SeccionAuditoria {...propiedades} />}
      </main>
    </div>
  );
}
