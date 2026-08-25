const prestadores = [

    {
        id: 1,
        nombre: "Nahuel González",
        zona: "Liborsi",
        servicios: ["Paseo", "Guarderia"],
        calificacion: 4.8,
        reseñas: 4,
        verificado: true
    },

    {
        id: 2,
        nombre: "María López",
        zona: "Centro",
        servicios: ["Paseo", "Traslado"],
        calificacion: 4.6,
        reseñas: 3,
        verificado: true
    },

    {
        id: 3,
        nombre: "Lucas Fernández",
        zona: "San Martín",
        servicios: ["Guarderia"],
        calificacion: 4.9,
        reseñas: 5,
        verificado: true
    }

];


const resultados = document.getElementById("resultados");

const filtroServicio =
    document.getElementById("filtroServicio");

const filtroZona =
    document.getElementById("filtroZona");

const btnBuscar =
    document.getElementById("btnBuscar");


function mostrarPrestadores(lista) {

    resultados.innerHTML = "";


    if (lista.length === 0) {

        resultados.innerHTML = `
            <div class="col-12">

                <div class="alert alert-info text-center">

                    No encontramos prestadores
                    con esos criterios.

                </div>

            </div>
        `;

        return;
    }


    lista.forEach(function(prestador) {

        const servicios =
            prestador.servicios.join(" · ");


        resultados.innerHTML += `

            <div class="col-md-6 col-lg-4">

                <div class="card h-100 border-0 shadow-sm">

                    <div class="card-body">

                        <div class="text-center mb-3">

                            <h4>
                                ${prestador.nombre}
                            </h4>

                        </div>


                        <p class="mb-2">

                            <strong>
                                ${prestador.calificacion}
                            </strong>

                            (${prestador.reseñas} reseñas)

                        </p>


                        <p class="text-secondary">

                            ${prestador.zona}

                        </p>


                        <p>

                            <strong>
                                Servicios:
                            </strong>

                            ${servicios}

                        </p>


                        ${
                            prestador.verificado
                            ?
                            `
                            <span class="badge text-bg-success mb-3">
                                ✓ Identidad verificada
                            </span>
                            `
                            :
                            ""
                        }


                        <a
                            href="perfil-prestador.html?id=${prestador.id}"
                            class="btn btn-primary w-100"
                        >
                            Ver perfil
                        </a>

                    </div>

                </div>

            </div>

        `;

    });

}


function buscarPrestadores() {

    const servicio =
        filtroServicio.value.toLowerCase();

    const zona =
        filtroZona.value.toLowerCase();


    const resultadosFiltrados =
        prestadores.filter(function(prestador) {

            const coincideServicio =
                servicio === "" ||
                prestador.servicios.some(function(item) {

                    return item.toLowerCase()
                        .includes(servicio);

                });


            const coincideZona =
                zona === "" ||
                prestador.zona
                    .toLowerCase()
                    .includes(zona);


            return coincideServicio && coincideZona;

        });


    mostrarPrestadores(resultadosFiltrados);

}


btnBuscar.addEventListener(
    "click",
    buscarPrestadores
);


mostrarPrestadores(prestadores);