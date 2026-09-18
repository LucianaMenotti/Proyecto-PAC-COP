import { createHmac, randomBytes } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 8;

const getSecret = () => {
    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET debe tener al menos 32 caracteres");
    }

    return secret;
};

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const sign = (value) => createHmac("sha256", getSecret()).update(value).digest("base64url");

export const createAuthToken = (user) => {
    const payload = encode({
        userId: user.id,
        role: user.rol,
        exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
        nonce: randomBytes(8).toString("hex")
    });

    return `${payload}.${sign(payload)}`;
};

export const verifyAuthToken = (token) => {
    const [payload, signature] = token?.split(".") ?? [];

    if (!payload || !signature || sign(payload) !== signature) {
        throw new Error("Token inválido");
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!data.exp || data.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error("Token expirado");
    }

    return data;
};

export const parseCookies = (header = "") => Object.fromEntries(
    header.split(";").filter(Boolean).map((part) => {
        const index = part.indexOf("=");
        const key = index >= 0 ? part.slice(0, index).trim() : part.trim();
        const value = index >= 0 ? part.slice(index + 1).trim() : "";
        return [key, decodeURIComponent(value)];
    })
);

export const setAuthCookie = (res, token) => {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
        "Set-Cookie",
        `pac_cop_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TOKEN_LIFETIME_SECONDS}${secure}`
    );
};

export const clearAuthCookie = (res) => {
    res.setHeader(
        "Set-Cookie",
        "pac_cop_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
    );
};
