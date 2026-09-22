
// =========================================
// PAC-COP - PANEL DEL PRESTADOR
// =========================================


// -----------------------------------------
// USUARIO LOGUEADO
// -----------------------------------------

const usuario = await window.PacCopAuth.requireSession(["prestador"]);


// -----------------------------------------
// DATOS DEL USUARIO
// -----------------------------------------

if (usuario) {

    // Avatar
    const avatar =
        document.getElementById("avatarUsuario");

    if (avatar && usuario.nombre) {

        avatar.textContent =
            usuario.nombre.charAt(0).toUpperCase();

    }


    // Nombre del prestador
    const nombrePrestador =
        document.getElementById("nombrePrestador");

    if (nombrePrestador) {

        nombrePrestador.textContent =
            `${usuario.nombre} ${usuario.apellido}`;

    }


    // Zona
    const zonaPrestador =
        document.getElementById("zonaPrestador");

    if (zonaPrestador) {

        zonaPrestador.textContent =
            usuario.zona || "Zona no especificada";

    }


    // Calificación
    const calificacion =
        document.getElementById("calificacionPrestador");

    if (calificacion) {

        calificacion.textContent =
            usuario.calificacion || "0";

    }


    // Reseñas
    const resenas =
        document.getElementById("resenasPrestador");

    if (resenas) {

        resenas.textContent =
            usuario.resenas || "0";

    }


    // -------------------------------------
// SERVICIOS DEL PRESTADOR (reales)
// -------------------------------------

const precios = {
    Paseo: { nombre: "Paseo", nuevo: 4000, establecido: 5000, top: 7000 },
    Guarderia: { nombre: "Guardería", nuevo: 7000, establecido: 9000, top: 12000 },
    Traslado: { nombre: "Traslado", nuevo: 5000, establecido: 7000, top: 10000 }
};

let misServicios = [];
let misPrecios = {};

if (usuario) {
    misServicios = Array.isArray(usuario.servicios) ? [...usuario.servicios] : [];
    misPrecios = { ...(usuario.preciosServicios || {}) };
}

const tabla = document.getElementById("tablaPrecios");
if (tabla) {
    tabla.innerHTML = "";
    Object.values(precios).forEach((servicio) => {
        tabla.innerHTML += `
            <tr>
                <td class="fw-semibold">${servicio.nombre}</td>
                <td>$${servicio.nuevo}</td>
                <td class="fw-bold text-success">$${servicio.establecido}</td>
                <td>$${servicio.top}</td>
            </tr>`;
    });
}

async function guardarServicios() {
    const respuesta = await fetch("/api/users/me/servicios", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicios: misServicios, preciosServicios: misPrecios })
    });

    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || "No se pudo guardar");

    misServicios = resultado.usuario.servicios || [];
    misPrecios = resultado.usuario.preciosServicios || {};
    renderizarServicios();
}

function renderizarServicios() {
    const contenedor = document.getElementById("serviciosPrestador");
    if (!contenedor) return;

    if (misServicios.length === 0) {
        contenedor.innerHTML = `<span class="text-secondary small">Todavía no publicaste servicios.</span>`;
        return;
    }

    contenedor.innerHTML = misServicios.map((servicio) => `
        <span class="badge bg-light text-dark border d-inline-flex align-items-center gap-2 me-1 mb-1">
            ${servicio} · $${misPrecios[servicio] ?? "-"}
            <button type="button" class="btn-close btn-close-sm" style="font-size:0.55rem"
                aria-label="Quitar" data-quitar="${servicio}"></button>
        </span>
    `).join("");

    contenedor.querySelectorAll("[data-quitar]").forEach((boton) => {
        boton.addEventListener("click", async () => {
            const servicio = boton.dataset.quitar;
            misServicios = misServicios.filter((s) => s !== servicio);
            delete misPrecios[servicio];
            try {
                await guardarServicios();
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

renderizarServicios();

// -------------------------------------
// FORMULARIO DE PUBLICACIÓN (agregar servicio)
// -------------------------------------

const formulario = document.getElementById("publishForm");
const servicioSelect = document.getElementById("servicioSelect");
const precioInput = document.getElementById("precioInput");
const precioError = document.getElementById("precioError");
const useSuggested = document.getElementById("useSuggested");

function obtenerPrecioMinimo() {
    return precios[servicioSelect.value]?.establecido ?? 0;
}

if (servicioSelect) {
    servicioSelect.addEventListener("change", () => {
        precioInput.placeholder = obtenerPrecioMinimo();
        precioError.classList.add("d-none");
    });
}

if (useSuggested) {
    useSuggested.addEventListener("click", () => {
        precioInput.value = obtenerPrecioMinimo();
        precioError.classList.add("d-none");
    });
}

if (formulario) {
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const servicio = servicioSelect.value;
        const precio = Number(precioInput.value);
        const minimo = obtenerPrecioMinimo();

        if (!precio || precio < minimo) {
            precioError.classList.remove("d-none");
            return;
        }
        precioError.classList.add("d-none");

        if (!misServicios.includes(servicio)) {
            misServicios.push(servicio);
        }
        misPrecios[servicio] = precio;

        try {
            await guardarServicios();
            formulario.reset();
        } catch (error) {
            alert(error.message);
        }
    });
}

// -------------------------------------
// RENDIMIENTO REAL (reemplaza los números fijos)
// -------------------------------------

(async () => {
    if (!usuario) return;

    let completados = 0;
    try {
        const respuesta = await fetch("/api/servicios", { credentials: "include" });
        const { servicios } = await respuesta.json();
        completados = (servicios || []).filter((s) => s.estado === "finalizado").length;
    } catch {
        completados = 0;
    }

    const nivel = completados >= 50 ? "top" : completados >= 10 ? "establecido" : "nuevo";
    const progreso = Math.min(100, Math.round((completados / 50) * 100));

    document.getElementById("barraProgresoNivel").style.width = `${progreso}%`;
    ["nuevo", "establecido", "top"].forEach((n) => {
        document.getElementById(`col-nivel-${n}`).classList.toggle("nivel-actual", n === nivel);
    });

    const faltanParaTop = Math.max(0, 50 - completados);
    document.getElementById("textoResumenNivel").innerHTML =
        `Llevás <strong>${completados} servicios</strong> con <strong>${usuario.calificacion ?? 0}★</strong> de promedio.` +
        (faltanParaTop > 0 ? ` Te faltan <strong>${faltanParaTop} servicios</strong> para alcanzar Top.` : " Ya estás en el nivel Top.");
})();