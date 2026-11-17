import { useCallback, useSyncExternalStore } from "react";

const CLAVE = "pac-tema";
const oyentes = new Set();

function preferido() {
  try {
    const forzado = new URLSearchParams(window.location.search).get("tema");
    if (forzado === "dark" || forzado === "light") return forzado;
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "dark" || guardado === "light") return guardado;
  } catch {
    // almacenamiento no disponible: se usa la preferencia del sistema
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function aplicarTema(tema) {
  const raiz = document.documentElement;
  raiz.setAttribute("data-theme", tema);
  raiz.setAttribute("data-bs-theme", tema);
}

// Se aplica una vez al cargar el módulo (el script de index.html ya lo hizo antes del primer pintado).
if (typeof document !== "undefined") {
  aplicarTema(preferido());
}

function suscribir(avisar) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

function leer() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

export function useTema() {
  const tema = useSyncExternalStore(suscribir, leer, () => "light");

  const alternar = useCallback(() => {
    const siguiente = leer() === "dark" ? "light" : "dark";
    aplicarTema(siguiente);
    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // sin persistencia
    }
    oyentes.forEach((avisar) => avisar());
  }, []);

  return { tema, oscuro: tema === "dark", alternar };
}
