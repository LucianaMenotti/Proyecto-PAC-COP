import { verifyAuthToken, parseCookies } from "../helpers/auth.helper.js";
import User from "../models/user.model.js";
import Mascota from "../models/mascota.model.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const token = cookies.pac_cop_session;

        if (!token) {
            return res.status(401).json({ mensaje: "Necesitás iniciar sesión" });
        }

        const payload = verifyAuthToken(token);
        const user = await User.findByPk(payload.userId);

        if (!user) {
            return res.status(401).json({ mensaje: "La sesión ya no es válida" });
        }

        req.user = user;
        next();
    } catch {
        return res.status(401).json({ mensaje: "La sesión no es válida o expiró" });
    }
};

export const ownerOrAdminMiddleware = (req, res, next) => {
    const requestedUserId = Number(req.params.userId ?? req.params.id ?? req.body?.userId);
    const isOwner = requestedUserId === Number(req.user.id);
    const isAdmin = req.user.rol === "admin" || req.user.rol === "administrador";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ mensaje: "No tenés permisos para este recurso" });
    }

    next();
};

export const mascotaOwnerMiddleware = async (req, res, next) => {
    const mascota = await Mascota.findByPk(req.params.id);

    if (!mascota) {
        return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    const isOwner = Number(mascota.userId) === Number(req.user.id);
    const isAdmin = req.user.rol === "admin" || req.user.rol === "administrador";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ mensaje: "No tenés permisos para esta mascota" });
    }

    req.mascota = mascota;
    next();
};
