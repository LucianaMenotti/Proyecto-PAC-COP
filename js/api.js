(() => {
    const puertoLiveServer = window.location.port === "5500";
    const origenBackend = puertoLiveServer
        ? "http://localhost:3000"
        : "";

    if (!origenBackend) {
        return;
    }

    const fetchOriginal = window.fetch.bind(window);

    window.fetch = (recurso, opciones) => {
        if (typeof recurso === "string" && recurso.startsWith("/api/")) {
            recurso = `${origenBackend}${recurso}`;
        }

        return fetchOriginal(recurso, opciones);
    };
})();
