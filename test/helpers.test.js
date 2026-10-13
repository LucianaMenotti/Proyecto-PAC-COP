import test from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_SECRET = "clave-de-prueba-con-una-longitud-superior-a-32";

const { hashPassword, verifyPassword } = await import("../src/helpers/password.helper.js");
const { createAuthToken, verifyAuthToken, parseCookies } = await import("../src/helpers/auth.helper.js");

test("hash de contraseña valida la clave correcta y rechaza otra", async () => {
    const hash = await hashPassword("ClaveSegura123");

    assert.equal((await verifyPassword("ClaveSegura123", hash)).valid, true);
    assert.equal((await verifyPassword("clave-incorrecta", hash)).valid, false);
    assert.match(hash, /^scrypt\$/);
});

test("token de sesión se firma y se puede leer", () => {
    const token = createAuthToken({ id: 12, rol: "dueño" });
    const payload = verifyAuthToken(token);

    assert.equal(payload.userId, 12);
    assert.equal(payload.role, "dueño");
});

test("las cookies se separan y decodifican correctamente", () => {
    const cookies = parseCookies("pac_cop_session=abc%20123; theme=light");

    assert.equal(cookies.pac_cop_session, "abc 123");
    assert.equal(cookies.theme, "light");
});
