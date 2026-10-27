export function leerLista(valor) {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    try {
      const resultado = JSON.parse(valor);

      return Array.isArray(resultado) ? resultado : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function leerPrecios(valor) {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    try {
      const resultado = JSON.parse(valor);

      if (resultado && typeof resultado === "object" && !Array.isArray(resultado)) {
        return resultado;
      }
    } catch {
      return {};
    }
  }

  return {};
}
