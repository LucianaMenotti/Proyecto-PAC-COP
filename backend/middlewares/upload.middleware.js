import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CARPETA_EVIDENCIAS = path.join(__dirname, "..", "uploads", "reclamos");
export const RUTA_PUBLICA_EVIDENCIAS = "/uploads/reclamos";

const MAX_ARCHIVOS = 5;
const MAX_TAMANO = 5242880;

const EXTENSIONES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

fs.mkdirSync(CARPETA_EVIDENCIAS, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARPETA_EVIDENCIAS),
  filename: (req, file, cb) => {
    const nombre = `${Date.now()}-${randomBytes(6).toString("hex")}${EXTENSIONES[file.mimetype]}`;
    cb(null, nombre);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXTENSIONES[file.mimetype]) {
    cb(null, true);
    return;
  }

  cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
};

const subir = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_TAMANO,
    files: MAX_ARCHIVOS,
  },
});

export const subirEvidencias = (req, res, next) => {
  subir.array("evidencias", MAX_ARCHIVOS)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    let mensaje = error.message;

    if (error.code === "LIMIT_FILE_SIZE") {
      mensaje = "Cada imagen puede pesar hasta 5 MB";
    }

    if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      mensaje = "Podés adjuntar hasta 5 imágenes";
    }

    res.status(400).json({ mensaje });
  });
};
