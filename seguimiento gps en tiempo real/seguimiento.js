/* ============================================
   WoofPal — Tracking GPS en vivo
   Frontend puro. Los puntos donde este proyecto se
   conecta a la API real (Express/Sequelize) o a un
   canal en tiempo real (WebSocket) están marcados
   con "TODO backend".
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Datos del servicio ----------
     TODO backend: reemplazar por los datos reales del
     servicio (ej. GET /api/servicios/:id) en vez de este mock. */
  const servicio = {
    id: 7734,
    prestador: 'Julieta Ramos',
    tipo: 'Paseo · 1 hora',
    mascota: 'Toby',
    horaProgramada: '17:00 hs'
  };

  document.getElementById('servicioId').textContent = servicio.id;
  document.getElementById('prestadorNombre').textContent = servicio.prestador;
  document.getElementById('servicioNombre').textContent = servicio.tipo;
  document.getElementById('mascotaNombre').textContent = servicio.mascota;
  document.getElementById('horaProgramada').textContent = servicio.horaProgramada;
  document.getElementById('mascotaNombreEspera').textContent = servicio.mascota;
  document.getElementById('prestadorNombreEspera').textContent = servicio.prestador;
  document.getElementById('horaProgramadaGrande').textContent = servicio.horaProgramada;

  /* ---------- Recorrido simulado (Formosa capital) ----------
     TODO backend: en producción estos puntos llegan en tiempo real
     por WebSocket o por polling a GET /api/servicios/:id/ubicacion,
     uno por uno, a medida que se mueve el dispositivo del prestador.
     Para "traslado" en vez de "paseo", el mismo mecanismo sirve:
     alcanza con marcar origen y destino como los extremos del array. */
  const recorrido = [
    [-26.1849, -58.1731],
    [-26.1839, -58.1738],
    [-26.1831, -58.1750],
    [-26.1826, -58.1765],
    [-26.1833, -58.1780],
    [-26.1845, -58.1788],
    [-26.1858, -58.1782],
    [-26.1866, -58.1768],
    [-26.1861, -58.1750],
    [-26.1852, -58.1738],
    [-26.1849, -58.1731]
  ];

  /* ---------- Estado del flujo ---------- */
  const pasos = ['programado', 'en-curso', 'finalizado'];
  let horaInicioReal = null;
  let horaFinReal = null;
  let indiceActual = 0;
  let distanciaTotal = 0;
  let intervaloMovimiento = null;
  let intervaloCronometro = null;

  let mapaVivo = null;
  let marcadorVivo = null;
  let lineaRecorrida = null;

  function irAPaso(nombrePaso) {
    pasos.forEach(p => {
      document.getElementById(`panel-${p}`).hidden = (p !== nombrePaso);
    });

    document.querySelectorAll('.paso').forEach(li => {
      const p = li.dataset.paso;
      li.classList.remove('activo', 'hecho');
      if (p === nombrePaso) {
        li.classList.add('activo');
      } else if (pasos.indexOf(p) < pasos.indexOf(nombrePaso)) {
        li.classList.add('hecho');
      }
    });
  }

  function actualizarInsignia(texto, clase) {
    const insignia = document.getElementById('insigniaEstado');
    insignia.textContent = texto;
    insignia.className = 'insignia' + (clase ? ` ${clase}` : '');
  }

  /* ---------- Distancia entre dos coordenadas (fórmula de Haversine) ---------- */
  function distanciaHaversine([lat1, lon1], [lat2, lon2]) {
    const R = 6371; // radio de la Tierra en km
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatearCronometro(segundos) {
    const m = String(Math.floor(segundos / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function formatearHora(fecha) {
    return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Etapa 1 → 2: iniciar servicio ---------- */

  document.getElementById('btnIniciarDemo').addEventListener('click', () => {
    horaInicioReal = new Date();
    indiceActual = 0;
    distanciaTotal = 0;

    document.getElementById('horaInicioReal').textContent = formatearHora(horaInicioReal);
    actualizarInsignia('En curso', 'en-curso');
    irAPaso('en-curso');

    inicializarMapaVivo();
    iniciarCronometro();
    iniciarMovimientoSimulado();
  });

  function inicializarMapaVivo() {
    mapaVivo = L.map('mapaVivo', { zoomControl: false }).setView(recorrido[0], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapaVivo);

    const iconoMascota = L.divIcon({
      className: '',
      html: '<div class="marcador-mascota"></div>',
      iconSize: [18, 18]
    });

    marcadorVivo = L.marker(recorrido[0], { icon: iconoMascota }).addTo(mapaVivo);
    lineaRecorrida = L.polyline([recorrido[0]], { color: '#1F7A74', weight: 4 }).addTo(mapaVivo);
  }

  function iniciarCronometro() {
    intervaloCronometro = setInterval(() => {
      const segundos = Math.floor((new Date() - horaInicioReal) / 1000);
      document.getElementById('cronometro').textContent = formatearCronometro(segundos);
    }, 1000);
  }

  function iniciarMovimientoSimulado() {
    /* TODO backend: reemplazar este setInterval por el listener del
       canal en tiempo real (WebSocket) que recibe la posición real
       del dispositivo del prestador. */
    intervaloMovimiento = setInterval(() => {
      if (indiceActual >= recorrido.length - 1) {
        clearInterval(intervaloMovimiento);
        return;
      }

      const anterior = recorrido[indiceActual];
      indiceActual++;
      const actual = recorrido[indiceActual];

      distanciaTotal += distanciaHaversine(anterior, actual);
      document.getElementById('distanciaRecorrida').textContent = distanciaTotal.toFixed(1);

      marcadorVivo.setLatLng(actual);
      lineaRecorrida.addLatLng(actual);
      mapaVivo.panTo(actual);
    }, 2200);
  }

  /* ---------- Etapa 2 → 3: finalizar servicio ---------- */

  document.getElementById('btnFinalizarDemo').addEventListener('click', () => {
    horaFinReal = new Date();
    clearInterval(intervaloMovimiento);
    clearInterval(intervaloCronometro);

    actualizarInsignia('Finalizado', 'finalizado');

    const duracionSegundos = Math.floor((horaFinReal - horaInicioReal) / 1000);
    const horas = Math.floor(duracionSegundos / 3600);
    const minutos = Math.floor((duracionSegundos % 3600) / 60);
    const duracionTexto = horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`;

    document.getElementById('finHoraInicio').textContent = formatearHora(horaInicioReal);
    document.getElementById('finHoraFin').textContent = formatearHora(horaFinReal);
    document.getElementById('finDuracion').textContent = duracionTexto;
    document.getElementById('finDistancia').textContent = distanciaTotal.toFixed(1);

    irAPaso('finalizado');
    inicializarMapaFinal();
  });

  function inicializarMapaFinal() {
    const mapaFinal = L.map('mapaFinal', { zoomControl: false, dragging: false, scrollWheelZoom: false });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapaFinal);

    const recorridoCompleto = recorrido.slice(0, indiceActual + 1);
    const linea = L.polyline(recorridoCompleto, { color: '#FF6F52', weight: 4 }).addTo(mapaFinal);

    L.marker(recorridoCompleto[0]).addTo(mapaFinal);
    L.marker(recorridoCompleto[recorridoCompleto.length - 1]).addTo(mapaFinal);

    mapaFinal.fitBounds(linea.getBounds(), { padding: [24, 24] });
  }

});
