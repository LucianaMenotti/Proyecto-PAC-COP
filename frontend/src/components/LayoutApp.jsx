import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { RUTAS } from "../config/rutas";
import { useMotorEstilos } from "../hooks/useMotorEstilos";
import NavbarApp from "./NavbarApp";
import PieApp from "./PieApp";

// Rutas que ocupan toda la pantalla y no llevan pie.
const SIN_PIE = [RUTAS.chat];

// Estructura común de todas las páginas: una barra, el contenido y un pie.
export default function LayoutApp() {
  const { pathname, hash } = useLocation();

  // El panel del prestador usa Tailwind; todo lo demás, Bootstrap.
  useMotorEstilos(!pathname.startsWith(RUTAS.panelPrestador));

  useEffect(() => {
    if (hash) {
      const destino = document.getElementById(hash.slice(1));
      if (destino) {
        destino.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="pac-app">
      <NavbarApp />
      <div className="pac-contenido">
        <Outlet />
      </div>
      {!SIN_PIE.includes(pathname) && <PieApp />}
    </div>
  );
}
