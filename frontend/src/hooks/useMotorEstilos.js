import { useLayoutEffect } from "react";
import estilosBootstrap from "../config/estilos/bootstrap";

// Bootstrap y Tailwind (panel del prestador) usan los mismos nombres para espaciado, bordes y
// sombras con valores distintos, así que nunca se cargan juntos.
// - Con Bootstrap: se inserta al INICIO del <head>, para que styles/tema.css y los estilos de cada
//   página (que van después) puedan sobrescribirlo sin pelear por la especificidad.
// - Sin Bootstrap (panel): solo queda la hoja de Tailwind que inyecta la propia página.
// El atributo data-motor del <html> permite acotar las reglas globales a uno de los dos motores.
export function useMotorEstilos(usarBootstrap) {
  useLayoutEffect(() => {
    const raiz = document.documentElement;
    raiz.setAttribute("data-motor", usarBootstrap ? "bootstrap" : "tailwind");

    if (!usarBootstrap) {
      return undefined;
    }

    const elemento = document.createElement("style");
    elemento.setAttribute("data-estilo", "bootstrap");
    elemento.textContent = estilosBootstrap;
    document.head.prepend(elemento);

    return () => {
      elemento.remove();
    };
  }, [usarBootstrap]);
}
