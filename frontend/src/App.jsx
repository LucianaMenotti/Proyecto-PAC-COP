import { Navigate, Route, Routes } from "react-router-dom";
import CampanaNotificaciones from "./components/CampanaNotificaciones";
import LayoutApp from "./components/LayoutApp";
import RutaProtegida from "./components/RutaProtegida";
import { ROLES_ADMIN, RUTAS } from "./config/rutas";
import { useAuth } from "./hooks/useAuth";
import Admin from "./pages/Admin";
import AdminReclamos from "./pages/AdminReclamos";
import Alertas from "./pages/Alertas";
import BuscarPrestadores from "./pages/BuscarPrestadores";
import Chat from "./pages/Chat";
import FichaSalud from "./pages/FichaSalud";
import Inicio from "./pages/Inicio";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Mach from "./pages/Mach";
import MisMascotas from "./pages/MisMascotas";
import MisServicios from "./pages/MisServicios";
import Notificaciones from "./pages/Notificaciones";
import Numero from "./pages/Numero";
import Pago from "./pages/Pago";
import PanelPrestador from "./pages/PanelPrestador";
import Recuperar from "./pages/Recuperar";
import Registro from "./pages/Registro";
import RegistroMascota from "./pages/RegistroMascota";
import Restablecer from "./pages/Restablecer";
import Seguimiento from "./pages/Seguimiento";

// "/" es el único inicio: presenta el sitio a los visitantes, lleva al panel a los prestadores
// y muestra el resumen de la cuenta a dueños y administradores.
function Inicial() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return null;
  }

  if (!usuario) {
    return <Landing />;
  }

  if (usuario.rol === "prestador") {
    return <Navigate to={RUTAS.panelPrestador} replace />;
  }

  return <Inicio />;
}

function protegida(elemento, roles = []) {
  return <RutaProtegida roles={roles}>{elemento}</RutaProtegida>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<LayoutApp />}>
          <Route path={RUTAS.inicio} element={<Inicial />} />
          <Route path={RUTAS.inicioAnterior} element={<Navigate to={RUTAS.inicio} replace />} />
          <Route path={RUTAS.login} element={<Login />} />
          <Route path={RUTAS.registro} element={<Registro />} />
          <Route path={RUTAS.recuperar} element={<Recuperar />} />
          <Route path={RUTAS.restablecer} element={<Restablecer />} />
          <Route path={RUTAS.buscarPrestadores} element={<BuscarPrestadores />} />
          <Route path={RUTAS.alertas} element={<Alertas />} />
          <Route path={RUTAS.mach} element={<Mach />} />
          <Route path={RUTAS.numero} element={<Numero />} />

          <Route path={RUTAS.pago} element={protegida(<Pago />)} />
          <Route path={RUTAS.seguimiento} element={protegida(<Seguimiento />)} />
          <Route path={RUTAS.misMascotas} element={protegida(<MisMascotas />, ["dueño"])} />
          <Route path={RUTAS.registroMascota} element={protegida(<RegistroMascota />, ["dueño"])} />
          <Route path={RUTAS.fichaSalud} element={protegida(<FichaSalud />, ["dueño"])} />
          <Route
            path={RUTAS.misServicios}
            element={protegida(<MisServicios />, ["dueño", "prestador"])}
          />
          <Route
            path={`${RUTAS.panelPrestador}/:seccion?`}
            element={protegida(<PanelPrestador />, ["prestador"])}
          />
          <Route
            path={RUTAS.perfilPrestador}
            element={protegida(
              <Navigate to={`${RUTAS.panelPrestador}/perfil`} replace />,
              ["prestador"]
            )}
          />
          <Route path={RUTAS.chat} element={protegida(<Chat />)} />
          <Route path={RUTAS.notificaciones} element={protegida(<Notificaciones />)} />
          <Route path={RUTAS.admin} element={protegida(<Admin />, ROLES_ADMIN)} />
          <Route path={RUTAS.adminReclamos} element={protegida(<AdminReclamos />, ROLES_ADMIN)} />
        </Route>

        <Route path="*" element={<Navigate to={RUTAS.inicio} replace />} />
      </Routes>

      <CampanaNotificaciones />
    </>
  );
}
