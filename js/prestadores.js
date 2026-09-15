const contenedor = document.getElementById("resultados");

const filtroServicio = document.getElementById("filtroServicio");
const filtroZona = document.getElementById("filtroZona");
const btnBuscar = document.getElementById("btnBuscar");

let prestadores = [];

function obtenerServicios(servicios) {

    if (Array.isArray(servicios)) {
        return servicios;
    }

    if (typeof servicios === "string") {

        try {
            const resultado = JSON.parse(servicios);

            return Array.isArray(resultado)
                ? resultado
                : [];

        } catch (error) {
            return [];
        }
    }

    return [];
}

async function cargarPrestadores() {

    try {

        const respuesta = await fetch("/api/users");

        if (!respuesta.ok) {
            throw new Error("Error al obtener los usuarios");
        }

        const usuarios = await respuesta.json();

        prestadores = usuarios.filter(
            usuario => usuario.rol === "prestador"
        );

        mostrarPrestadores(prestadores);

    } catch (error) {

        console.error("Error al cargar prestadores:", error);

        contenedor.innerHTML = `
            <div class="alert alert-danger">
                No se pudieron cargar los prestadores.
            </div>
        `;
    }
}

function mostrarPrestadores(lista) {

    contenedor.innerHTML = "";

    if (lista.length === 0) {

        contenedor.innerHTML = `
            <div class="alert alert-info">
                No se encontraron prestadores.
            </div>
        `;

        return;
    }

    lista.forEach(prestador => {

        const servicios = obtenerServicios(
            prestador.servicios
        );

        const tarjeta = document.createElement("div");

        tarjeta.className = "col-md-6 col-lg-4";

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm border-0">

                <div class="card-body">

                    <h5 class="card-title fw-bold">
                        ${prestador.nombre}
                        ${prestador.apellido}
                    </h5>

                    <p class="card-text">
                        <strong>Zona:</strong>
                        ${prestador.zona}
                    </p>

                    <p class="card-text">
                        <strong>Servicios:</strong>
                        ${
                            servicios.length > 0
                                ? servicios.join(", ")
                                : "Sin servicios registrados"
                        }
                    </p>

                    <p class="card-text">
                        <strong>Calificación:</strong>
                        ${prestador.calificacion || 0}
                    </p>

                    <button
                        class="btn btn-primary w-100"
                        onclick="verPerfil(${prestador.id})"
                    >
                        Ver perfil
                    </button>

                </div>

            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

function buscarPrestadores() {

    const servicio = filtroServicio.value
        .trim()
        .toLowerCase();

    const zona = filtroZona.value
        .trim()
        .toLowerCase();

    const resultados = prestadores.filter(prestador => {

        const servicios = obtenerServicios(
            prestador.servicios
        );

        const coincideServicio =
            servicio === "" ||
            servicios.some(
                item =>
                    item.toLowerCase() === servicio
            );

        const coincideZona =
            zona === "" ||
            prestador.zona
                .toLowerCase()
                .includes(zona);

        return coincideServicio && coincideZona;
    });

    mostrarPrestadores(resultados);
}

function verPerfil(id) {

    window.location.href =
        `/paginas/perfil-prestador.html?id=${id}`;
}

btnBuscar.addEventListener(
    "click",
    buscarPrestadores
);

cargarPrestadores();