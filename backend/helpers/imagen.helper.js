import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const directorioActual = path.dirname(fileURLToPath(import.meta.url));

export const DIRECTORIO_IMAGENES = path.join(
    directorioActual,
    "..",
    "uploads",
    "chat"
);

const TIPOS_PERMITIDOS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
};

const TAMANO_MAXIMO = 6 * 1024 * 1024;

export const guardarImagenDesdeDataUrl = (dataUrl) => {
    const coincidencia = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
        String(dataUrl || "")
    );

    if (!coincidencia) {
        return { error: "La imagen debe ser JPG, PNG o WEBP" };
    }

    const extension = TIPOS_PERMITIDOS[coincidencia[1]];
    const contenido = Buffer.from(coincidencia[2], "base64");

    if (contenido.length === 0 || contenido.length > TAMANO_MAXIMO) {
        return { error: "La imagen debe pesar hasta 6 MB" };
    }

    fs.mkdirSync(DIRECTORIO_IMAGENES, { recursive: true });

    const nombre = `${crypto.randomUUID()}.${extension}`;

    fs.writeFileSync(path.join(DIRECTORIO_IMAGENES, nombre), contenido);

    return { nombre };
};

export const rutaDeImagen = (nombre) => {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(String(nombre || ""))) {
        return null;
    }

    const ruta = path.join(DIRECTORIO_IMAGENES, nombre);

    return fs.existsSync(ruta) ? ruta : null;
};
