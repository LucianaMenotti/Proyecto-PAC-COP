const getCurrentSession = async () => {
    const response = await fetch("/api/users/me", {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Sesión no válida");
    }

    const { usuario } = await response.json();

    localStorage.setItem("usuario", JSON.stringify(usuario));

    return usuario;
};

const requireSession = async (roles = []) => {
    try {
        const usuario = await getCurrentSession();

        if (roles.length > 0 && !roles.includes(usuario.rol)) {
            window.location.replace("inicio.html");
            return null;
        }

        return usuario;
    } catch {
        localStorage.removeItem("usuario");
        window.location.replace("login.html");
        return null;
    }
};

const logout = async () => {
    try {
        await fetch("/api/users/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }

    localStorage.removeItem("usuario");

    window.location.replace("/index.html");
};

window.PacCopAuth = {
    getCurrentSession,
    requireSession,
    logout
};