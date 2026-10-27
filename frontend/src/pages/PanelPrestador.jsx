import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ContadorNotificaciones from "../components/ContadorNotificaciones";
import ServiciosActivos from "../components/panel/ServiciosActivos";
import SolicitudesPrestador from "../components/panel/SolicitudesPrestador";
import TabNiveles from "../components/panel/TabNiveles";
import TabPublicar from "../components/panel/TabPublicar";
import TabRendimiento from "../components/panel/TabRendimiento";
import TabRuta from "../components/panel/TabRuta";
import { RUTAS } from "../config/rutas";
import { leerLista, leerPrecios } from "../helpers/listas";
import { calcularNivel } from "../helpers/niveles";
import { useAuth } from "../hooks/useAuth";
import { useBootstrap } from "../hooks/useBootstrap";
import { useContadorNotificaciones } from "../hooks/useContadorNotificaciones";
import { useEstilos } from "../hooks/useEstilos";
import { useServicios } from "../hooks/useServicios";
import estilosBase from "../config/estilos/base";
import estilosPanel from "../config/estilos/panelPrestador";

const PESTANAS = [
  { id: "niveles", numero: "01", titulo: "Niveles y precio mínimo" },
  { id: "publicar", numero: "02", titulo: "Publicar servicio" },
  { id: "rendimiento", numero: "03", titulo: "Rendimiento" },
  { id: "ruta", numero: "04", titulo: "Ruta de hoy" }
];

export default function PanelPrestador() {
  const { usuario } = useAuth();
  const { servicios, fallo, recargar } = useServicios();
  const [pestana, setPestana] = useState("niveles");
  const [misServicios, setMisServicios] = useState(() => leerLista(usuario.servicios));
  const [misPrecios, setMisPrecios] = useState(() => leerPrecios(usuario.preciosServicios));

  const { noLeidas } = useContadorNotificaciones(15000);

  useBootstrap();
  useEstilos("base", estilosBase);
  useEstilos("panel-prestador", estilosPanel);

  const completados = useMemo(
    () => (servicios || []).filter((servicio) => servicio.estado === "finalizado").length,
    [servicios]
  );

  const nivelActual = calcularNivel(completados);

  const solicitudes = (servicios || []).filter(
    (servicio) => servicio.estado === "programado" && servicio.puedeGestionar === true
  );

  const activos = (servicios || []).filter(
    (servicio) => servicio.estado === "aceptado" || servicio.estado === "en-curso"
  );

  const guardado = (nuevosServicios, nuevosPrecios) => {
    setMisServicios(nuevosServicios);
    setMisPrecios(nuevosPrecios);
  };

  const inicial = (usuario.nombre || "P").charAt(0).toUpperCase();

  return (
    <>
      <nav className="navbar bg-white border-bottom shadow-sm">
        <div className="container py-2">
          <Link to={RUTAS.inicio} className="navbar-brand fw-bold pac-brand">
            Pac-Cop
          </Link>

          <div className="d-flex align-items-center gap-2">
            <Link to={RUTAS.misServicios} className="btn btn-outline-primary btn-sm">
              Mis servicios
            </Link>
            <Link to={RUTAS.notificaciones} className="btn btn-outline-primary btn-sm">
              Notificaciones
              <ContadorNotificaciones cantidad={noLeidas} />
            </Link>
            <span className="badge rounded-pill nivel-badge">Nivel: Establecido</span>

            <Link
              to={RUTAS.perfilPrestador}
              className="avatar text-decoration-none"
              title="Ver mi perfil"
              style={{ cursor: "pointer" }}
            >
              {inicial}
            </Link>
          </div>
        </div>
      </nav>

      <main className="container py-4 py-md-5">
        {servicios !== null && !fallo && (
          <>
            <SolicitudesPrestador solicitudes={solicitudes} alActualizar={recargar} />
            <ServiciosActivos servicios={activos} />
          </>
        )}

        <div className="panel-header mb-4">
          <h1 className="fw-bold mb-2">Panel del prestador</h1>

          <p className="text-secondary mb-0">Administrá tus servicios, precios y rendimiento.</p>

          <Link to={RUTAS.perfilPrestador} className="btn btn-outline-primary btn-sm mt-3">
            Mi perfil y servicios
          </Link>
        </div>

        <ul className="nav nav-tabs panel-tabs mb-4" role="tablist">
          {PESTANAS.map((item) => (
            <li className="nav-item" role="presentation" key={item.id}>
              <button
                className={`nav-link${pestana === item.id ? " active" : ""}`}
                id={`tab-${item.id}`}
                type="button"
                role="tab"
                onClick={() => setPestana(item.id)}
              >
                <span>{item.numero}</span>
                {item.titulo}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content">
          <TabNiveles
            activa={pestana === "niveles"}
            completados={completados}
            nivelActual={nivelActual}
            calificacion={usuario.calificacion}
          />

          <TabPublicar
            activa={pestana === "publicar"}
            nivelActual={nivelActual}
            misServicios={misServicios}
            misPrecios={misPrecios}
            alGuardar={guardado}
          />

          <TabRendimiento activa={pestana === "rendimiento"} />

          <TabRuta activa={pestana === "ruta"} />
        </div>
      </main>
    </>
  );
}
