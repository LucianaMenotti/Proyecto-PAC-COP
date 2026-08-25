document.addEventListener('DOMContentLoaded', () => {
    // 1. Capturamos los elementos del DOM
    const checkboxes = document.querySelectorAll('.alerta-cb');
    const contenedorAlertas = document.getElementById('contenedor-alertas');

    // 2. Función principal que actualiza la pantalla del prestador
    const actualizarVistaPrestador = () => {
        // Limpiamos el contenedor antes de reescribirlo
        contenedorAlertas.innerHTML = '';
        let hayAlertas = false;

        // Recorremos todos los checkboxes
        checkboxes.forEach(cb => {
            if (cb.checked) {
                hayAlertas = true;
                
                // Obtenemos la info guardada en los atributos data-* del HTML
                const tipo = cb.dataset.tipo; // ej: peligro-critico
                const icono = cb.dataset.icono; // ej: bi-shield-slash-fill
                const texto = cb.dataset.texto;

                // Creamos el elemento HTML de la alerta
                const divAlerta = document.createElement('div');
                divAlerta.className = `tarjeta-alerta alerta-${tipo} shadow-sm`;
                
                divAlerta.innerHTML = `
                    <i class="bi ${icono}"></i>
                    <span>${texto}</span>
                `;

                // Lo inyectamos en la pantalla del prestador
                contenedorAlertas.appendChild(divAlerta);
            }
        });

        // Si no hay ninguna alerta activa, mostramos un mensaje por defecto
        if (!hayAlertas) {
            contenedorAlertas.innerHTML = '<div class="text-muted fst-italic p-3 text-center border rounded">Sin alertas activas.</div>';
        }
    };

    // 3. Asignamos el evento 'change' a cada checkbox para que reaccione en tiempo real
    checkboxes.forEach(cb => {
        cb.addEventListener('change', actualizarVistaPrestador);
    });

    // Llamamos a la función al cargar la página por si hay algún checkbox pre-marcado
    actualizarVistaPrestador();
});