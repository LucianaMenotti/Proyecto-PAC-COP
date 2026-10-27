export const leerGuardado = (clave) => {
  try {
    const valor = localStorage.getItem(clave);
    return valor === null ? null : valor;
  } catch {
    return null;
  }
};

export const guardar = (clave, valor) => {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    return;
  }
};

export const borrarGuardado = (clave) => {
  try {
    localStorage.removeItem(clave);
  } catch {
    return;
  }
};
