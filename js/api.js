(() => {
    const puertoLiveServer = window.location.port === "5500";
    const hostnameLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const origenBackend = puertoLiveServer && hostnameLocal
        ? `http://${window.location.hostname}:3000`
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
