export const leerArchivo = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();

    lector.onload = () => resolver(lector.result);
    lector.onerror = () => rechazar(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(archivo);
  });

export const reducirImagen = (dataUrl, ladoMaximo = 1280, calidad = 0.82) =>
  new Promise((resolver, rechazar) => {
    const imagen = new Image();

    imagen.onload = () => {
      const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
      const ancho = Math.round(imagen.width * escala);
      const alto = Math.round(imagen.height * escala);

      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      lienzo.getContext("2d").drawImage(imagen, 0, 0, ancho, alto);

      resolver(lienzo.toDataURL("image/jpeg", calidad));
    };

    imagen.onerror = () => rechazar(new Error("El archivo no es una imagen válida"));
    imagen.src = dataUrl;
  });

export const formatearHoraMensaje = (fecha) =>
  new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatearFechaHora = () =>
  new Date().toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
