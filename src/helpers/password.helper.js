import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const PREFIX = "scrypt";

export const hashPassword = async (password) => {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);

    return `${PREFIX}$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
};

export const verifyPassword = async (password, storedPassword) => {
    if (!storedPassword?.startsWith(`${PREFIX}$`)) {
        return {
            valid: password === storedPassword,
            needsUpgrade: password === storedPassword
        };
    }

    const [, salt, expectedHex] = storedPassword.split("$");
    const expected = Buffer.from(expectedHex, "hex");
    const actual = Buffer.from(await scrypt(password, salt, KEY_LENGTH));

    return {
        valid: expected.length === actual.length && timingSafeEqual(expected, actual),
        needsUpgrade: false
    };
};
