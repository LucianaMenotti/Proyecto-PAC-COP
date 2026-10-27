import { Navigate, Route, Routes } from "react-router-dom";
import RutaProtegida from "./components/RutaProtegida";
import { ROLES_ADMIN, RUTAS } from "./config/rutas";
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
import PerfilPrestador from "./pages/PerfilPrestador";
import Registro from "./pages/Registro";
import RegistroMascota from "./pages/RegistroMascota";
import Seguimiento from "./pages/Seguimiento";

export default function App() {
  return (
    <Routes>
      <Route path={RUTAS.inicio} element={<Landing />} />
      <Route path={RUTAS.login} element={<Login />} />
      <Route path={RUTAS.registro} element={<Registro />} />
      <Route path={RUTAS.buscarPrestadores} element={<BuscarPrestadores />} />
      <Route path={RUTAS.pago} element={<Pago />} />
      <Route path={RUTAS.seguimiento} element={<Seguimiento />} />
      <Route path={RUTAS.alertas} element={<Alertas />} />
      <Route path={RUTAS.mach} element={<Mach />} />
      <Route path={RUTAS.numero} element={<Numero />} />

      <Route
        path={RUTAS.cuenta}
        element={
          <RutaProtegida>
            <Inicio />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.misMascotas}
        element={
          <RutaProtegida roles={["dueño"]}>
            <MisMascotas />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.registroMascota}
        element={
          <RutaProtegida roles={["dueño"]}>
            <RegistroMascota />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.fichaSalud}
        element={
          <RutaProtegida roles={["dueño"]}>
            <FichaSalud />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.misServicios}
        element={
          <RutaProtegida roles={["dueño", "prestador"]}>
            <MisServicios />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.panelPrestador}
        element={
          <RutaProtegida roles={["prestador"]}>
            <PanelPrestador />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.perfilPrestador}
        element={
          <RutaProtegida roles={["prestador"]}>
            <PerfilPrestador />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.chat}
        element={
          <RutaProtegida>
            <Chat />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.notificaciones}
        element={
          <RutaProtegida>
            <Notificaciones />
          </RutaProtegida>
        }
      />

      <Route
        path={RUTAS.adminReclamos}
        element={
          <RutaProtegida roles={ROLES_ADMIN}>
            <AdminReclamos />
          </RutaProtegida>
        }
      />

      <Route path="*" element={<Navigate to={RUTAS.inicio} replace />} />
    </Routes>
  );
}
