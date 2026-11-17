import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import EncabezadoPanel from "../components/panel/EncabezadoPanel";
import MenuLateralPanel, { SECCIONES_PANEL } from "../components/panel/MenuLateralPanel";
import SeccionChat from "../components/panel/SeccionChat";
import SeccionCobros from "../components/panel/SeccionCobros";
import SeccionPerfil from "../components/panel/SeccionPerfil";
import SeccionPrecios from "../components/panel/SeccionPrecios";
import SeccionReclamos from "../components/panel/SeccionReclamos";
import SeccionRendimiento from "../components/panel/SeccionRendimiento";
import SeccionSolicitudes from "../components/panel/SeccionSolicitudes";
import SeccionTrabajo from "../components/panel/SeccionTrabajo";
import SeccionVehiculo from "../components/panel/SeccionVehiculo";
import { RUTAS } from "../config/rutas";
import { calcularNivel } from "../helpers/niveles";
import { useAuth } from "../hooks/useAuth";
import { useEstilos } from "../hooks/useEstilos";
import { useRangosMercado } from "../hooks/useRangosMercado";
import { useServicios } from "../hooks/useServicios";
import estilosTailwind from "../config/estilos/panelTailwind";

const INTERVALO_ACTUALIZACION = 20000;

// Panel del prestador (base: panel de Maxi con Tailwind v4). Cada sección es una ruta:
// /panel-prestador/:seccion (precios, rendimiento, solicitudes, trabajo, cobros, vehiculo, chat, reclamos, perfil)
// Solo carga Tailwind y los íconos mientras está montado; el resto de la app usa Bootstrap.
export default function PanelPrestador({ seccionFija = null }) {
  const { usuario, refrescar } = useAuth();
  const { seccion: seccionRuta } = useParams();
  const { servicios, recargar } = useServicios(INTERVALO_ACTUALIZACION);
  const rangos = useRangosMercado(usuario.zona);

  useEstilos("panel-tailwind", estilosTailwind);

  const seccion = seccionFija || seccionRuta || "precios";

  const completados = useMemo(
    () => (servicios || []).filter((servicio) => servicio.estado === "finalizado").length,
    [servicios]
  );

  const pendientes = (servicios || []).filter(
    (servicio) => servicio.estado === "programado" && servicio.puedeGestionar !== false
  ).length;

  const nivel = calcularNivel(completados, usuario.calificacion);

  if (!SECCIONES_PANEL.some((item) => item.id === seccion)) {
    return <Navigate to={`${RUTAS.panelPrestador}/precios`} replace />;
  }

  return (
    <div className="panel-tw flex flex-col text-slate-800">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <EncabezadoPanel usuario={usuario} nivel={nivel} />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <MenuLateralPanel seccionActual={seccion} pendientes={pendientes} />

          <div className="flex-1 w-full min-w-0">
            {seccion === "precios" && (
              <SeccionPrecios
                usuario={usuario}
                nivel={nivel}
                completados={completados}
                rangos={rangos}
                alActualizar={refrescar}
              />
            )}

            {seccion === "rendimiento" && (
              <SeccionRendimiento usuario={usuario} servicios={servicios} rangos={rangos} />
            )}

            {seccion === "solicitudes" && (
              <SeccionSolicitudes
                servicios={servicios}
                cargando={servicios === null}
                alActualizar={recargar}
              />
            )}

            {seccion === "trabajo" && <SeccionTrabajo usuario={usuario} alActualizar={refrescar} />}

            {seccion === "cobros" && (
              <SeccionCobros
                usuario={usuario}
                servicios={servicios}
                alActualizar={refrescar}
                alActualizarServicios={recargar}
              />
            )}

            {seccion === "vehiculo" && <SeccionVehiculo usuario={usuario} alActualizar={refrescar} />}

            {seccion === "chat" && <SeccionChat usuario={usuario} servicios={servicios} />}

            {seccion === "reclamos" && <SeccionReclamos servicios={servicios} />}

            {seccion === "perfil" && <SeccionPerfil usuario={usuario} alActualizar={refrescar} />}
          </div>
        </div>
      </main>

    </div>
  );
}
