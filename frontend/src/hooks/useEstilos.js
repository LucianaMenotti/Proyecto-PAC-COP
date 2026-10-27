import { useEffect } from "react";

export function useEstilos(identificador, css) {
  useEffect(() => {
    const elemento = document.createElement("style");
    elemento.setAttribute("data-estilo", identificador);
    elemento.textContent = css;
    document.head.appendChild(elemento);

    return () => {
      elemento.remove();
    };
  }, [identificador, css]);
}
