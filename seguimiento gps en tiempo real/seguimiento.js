/* Seguimiento GPS conectado al backend. */

document.addEventListener("DOMContentLoaded", async () => {
    let servicio = null;
    let horaInicioReal = null;
    let horaFinReal = null;
    let intervaloCronometro = null;
    let intervaloUbicacion = null;
    let watchId = null;
    let mapaVivo = null;
    let marcadorVivo = null;
    let lineaRecorrida = null;
    let mapaFinal = null;
    let distanciaTotal = 0;
    let ultimaPosicion = null;
    const recorridoReal = [];
    const pasos = ["programado", "en-curso", "finalizado"];

    const mostrarTexto = (id, texto) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto ?? "—";
    };

    const mostrarError = (texto) => {
        const panel = document.getElementById("panel-programado");
        if (panel) {
            const mensaje = document.createElement("p");
            mensaje.className = "mensaje-error";
            mensaje.textContent = texto;
            panel.prepend(mensaje);
        }
    };

    const formatearHora = (fecha) => new Date(fecha).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const formatearCronometro = (segundos) => {
        const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
        const segundosRestantes = String(segundos % 60).padStart(2, "0");
        return `${minutos}:${segundosRestantes}`;
    };

    const distanciaHaversine = ([lat1, lon1], [lat2, lon2]) => {
        const radioTierra = 6371;
        const toRad = (grados) => grados * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const irAPaso = (nombrePaso) => {
        pasos.forEach((paso) => {
            const panel = document.getElementById(`panel-${paso}`);
            if (panel) panel.hidden = paso !== nombrePaso;
        });

        document.querySelectorAll(".paso").forEach((elemento) => {
            const paso = elemento.dataset.paso;
            elemento.classList.remove("activo", "hecho");
            if (paso === nombrePaso) elemento.classList.add("activo");
            if (pasos.indexOf(paso) < pasos.indexOf(nombrePaso)) elemento.classList.add("hecho");
        });
    };

    const actualizarInsignia = (texto, clase) => {
        const insignia = document.getElementById("insigniaEstado");
        insignia.textContent = texto;
        insignia.className = `insignia ${clase || ""}`;
    };

    const actualizarDatosServicio = () => {
        mostrarTexto("servicioId", servicio.id);
        mostrarTexto("prestadorNombre", servicio.prestador);
        mostrarTexto("servicioNombre", servicio.tipo);
        mostrarTexto("mascotaNombre", servicio.mascota);
        mostrarTexto("horaProgramada", formatearHora(servicio.horaProgramada));
        mostrarTexto("mascotaNombreEspera", servicio.mascota);
        mostrarTexto("prestadorNombreEspera", servicio.prestador);
        mostrarTexto("horaProgramadaGrande", formatearHora(servicio.horaProgramada));
    };

    const cargarServicio = async () => {
        const respuesta = await fetch("/api/servicios/demo", {
            method: "POST",
            credentials: "include"
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo cargar el servicio");
        servicio = resultado.servicio;
        actualizarDatosServicio();
    };

    const agregarPosicionAlMapa = (posicion) => {
        const punto = [Number(posicion.latitud), Number(posicion.longitud)];
        if (ultimaPosicion) distanciaTotal += distanciaHaversine(ultimaPosicion, punto);
        ultimaPosicion = punto;
        recorridoReal.push(punto);
        mostrarTexto("distanciaRecorrida", distanciaTotal.toFixed(2));
        if (marcadorVivo) marcadorVivo.setLatLng(punto);
        if (lineaRecorrida) lineaRecorrida.addLatLng(punto);
        if (mapaVivo) mapaVivo.panTo(punto);
    };

    const inicializarMapaVivo = () => {
        const puntoInicial = ultimaPosicion || [-26.1849, -58.1731];
        mapaVivo = L.map("mapaVivo", { zoomControl: false }).setView(puntoInicial, 16);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(mapaVivo);
        marcadorVivo = L.marker(puntoInicial).addTo(mapaVivo);
        lineaRecorrida = L.polyline([puntoInicial], { color: "#1F7A74", weight: 4 }).addTo(mapaVivo);
    };

    const enviarUbicacion = async (latitud, longitud) => {
        const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ latitud, longitud })
        });
        if (!respuesta.ok) throw new Error("No se pudo guardar la ubicación");
        agregarPosicionAlMapa({ latitud, longitud });
    };

    const consultarUbicacion = async () => {
        const respuesta = await fetch(`/api/servicios/${servicio.id}/ubicacion`, {
            credentials: "include"
        });
        if (!respuesta.ok) return;
        const { ubicacion } = await respuesta.json();
        if (ubicacion && (!ultimaPosicion ||
            Number(ubicacion.latitud) !== ultimaPosicion[0] ||
            Number(ubicacion.longitud) !== ultimaPosicion[1])) {
            agregarPosicionAlMapa(ubicacion);
        }
    };

    const iniciarGeolocalizacion = () => {
        if (!navigator.geolocation) {
            mostrarError("Este navegador no permite obtener la ubicación del dispositivo.");
            return;
        }
        watchId = navigator.geolocation.watchPosition(
            ({ coords }) => enviarUbicacion(coords.latitude, coords.longitude).catch(console.error),
            () => mostrarError("No se pudo obtener la ubicación. Revisá el permiso del navegador."),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    };

    const iniciarCronometro = () => {
        intervaloCronometro = setInterval(() => {
            const segundos = Math.floor((Date.now() - horaInicioReal.getTime()) / 1000);
            mostrarTexto("cronometro", formatearCronometro(segundos));
        }, 1000);
    };

    const detenerSeguimiento = () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        clearInterval(intervaloCronometro);
        clearInterval(intervaloUbicacion);
    };

    document.getElementById("btnIniciarDemo").addEventListener("click", async () => {
        try {
            const respuesta = await fetch(`/api/servicios/${servicio.id}/iniciar`, {
                method: "POST",
                credentials: "include"
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.mensaje);
            servicio = resultado.servicio;
            horaInicioReal = new Date(servicio.iniciadoEn);
            mostrarTexto("horaInicioReal", formatearHora(horaInicioReal));
            actualizarInsignia("En curso", "en-curso");
            irAPaso("en-curso");
            inicializarMapaVivo();
            iniciarCronometro();
            iniciarGeolocalizacion();
            intervaloUbicacion = setInterval(consultarUbicacion, 5000);
        } catch (error) {
            mostrarError(error.message || "No se pudo iniciar el servicio");
        }
    });

    document.getElementById("btnFinalizarDemo").addEventListener("click", async () => {
        try {
            const respuesta = await fetch(`/api/servicios/${servicio.id}/finalizar`, {
                method: "POST",
                credentials: "include"
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.mensaje);
            servicio = resultado.servicio;
            horaFinReal = new Date(servicio.finalizadoEn);
            detenerSeguimiento();
            actualizarInsignia("Finalizado", "finalizado");
            mostrarTexto("finHoraInicio", formatearHora(horaInicioReal));
            mostrarTexto("finHoraFin", formatearHora(horaFinReal));
            const duracion = Math.floor((horaFinReal - horaInicioReal) / 1000);
            mostrarTexto("finDuracion", `${Math.floor(duracion / 60)} min`);
            mostrarTexto("finDistancia", distanciaTotal.toFixed(2));
            irAPaso("finalizado");
            inicializarMapaFinal();
        } catch (error) {
            mostrarError(error.message || "No se pudo finalizar el servicio");
        }
    });

    const inicializarMapaFinal = () => {
        if (mapaFinal || !document.getElementById("mapaFinal")) return;
        const puntos = recorridoReal.length > 0 ? recorridoReal : [[-26.1849, -58.1731]];
        mapaFinal = L.map("mapaFinal", { zoomControl: false, dragging: false, scrollWheelZoom: false });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(mapaFinal);
        const linea = L.polyline(puntos, { color: "#FF6F52", weight: 4 }).addTo(mapaFinal);
        L.marker(puntos[0]).addTo(mapaFinal);
        if (puntos.length > 1) L.marker(puntos[puntos.length - 1]).addTo(mapaFinal);
        mapaFinal.fitBounds(linea.getBounds(), { padding: [24, 24] });
    };

    try {
        await cargarServicio();
    } catch (error) {
        mostrarError(error.message || "Iniciá sesión para usar el seguimiento");
    }
});
