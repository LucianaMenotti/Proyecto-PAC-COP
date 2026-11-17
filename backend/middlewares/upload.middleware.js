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

// Documentación del prestador (historia de verificación de identidad).
// Se guarda fuera de la carpeta pública: solo la entrega la administración con sesión.
export const CARPETA_DOCUMENTOS = path.join(__dirname, "..", "uploads", "documentos");

const TIPOS_DOCUMENTO = {
  ...EXTENSIONES,
  "application/pdf": ".pdf",
};

// documento y selfie son imágenes; el CV admite además PDF
const CAMPOS_DOCUMENTACION = [
  { name: "documento", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "cv", maxCount: 1 },
];

fs.mkdirSync(CARPETA_DOCUMENTOS, { recursive: true });

const subirDocumentos = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, CARPETA_DOCUMENTOS),
    filename: (req, file, cb) => {
      const nombre = `${req.user.id}-${file.fieldname}-${Date.now()}-${randomBytes(6).toString("hex")}${TIPOS_DOCUMENTO[file.mimetype]}`;
      cb(null, nombre);
    },
  }),
  fileFilter: (req, file, cb) => {
    const permitido =
      file.fieldname === "cv" ? TIPOS_DOCUMENTO[file.mimetype] : EXTENSIONES[file.mimetype];

    if (permitido) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        file.fieldname === "cv"
          ? "El CV debe ser PDF, JPG, PNG o WEBP"
          : "El documento y la selfie deben ser imágenes JPG, PNG o WEBP",
      ),
    );
  },
  limits: {
    fileSize: MAX_TAMANO,
    files: CAMPOS_DOCUMENTACION.length,
  },
});

export const subirDocumentacion = (req, res, next) => {
  subirDocumentos.fields(CAMPOS_DOCUMENTACION)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const mensaje =
      error.code === "LIMIT_FILE_SIZE"
        ? "Cada archivo puede pesar hasta 5 MB"
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "Solo se aceptan los campos documento, selfie y cv"
          : error.message;

    res.status(400).json({ mensaje });
  });
};

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
