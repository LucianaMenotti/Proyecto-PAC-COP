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

// Variantes que lanzan Error con el mensaje del backend cuando la respuesta no es ok.
export const apiDatos = async (ruta, opciones = {}, mensajeError = "Ocurrió un error inesperado") => {
  const { ok, datos } = await apiJson(ruta, opciones);

  if (!ok) {
    throw new Error(datos.mensaje || mensajeError);
  }

  return datos;
};

export const enviarDatos = (ruta, metodo, cuerpo, mensajeError) =>
  apiDatos(
    ruta,
    {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo ?? {})
    },
    mensajeError
  );
