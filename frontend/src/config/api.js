export const apiFetch = (ruta, opciones = {}) => {
  return fetch(ruta, {
    credentials: "include",
    ...opciones
  });
};

export const apiJson = async (ruta, opciones = {}) => {
  const respuesta = await apiFetch(ruta, opciones);
  let datos = {};

  try {
    datos = await respuesta.json();
  } catch {
    datos = {};
  }

  return { respuesta, datos, ok: respuesta.ok };
};

export const enviarJson = (ruta, metodo, cuerpo) => {
  return apiJson(ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo ?? {})
  });
};
