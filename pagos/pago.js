/* ============================================
   Pago del servicio
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  /* ---------- Datos de la reserva ---------- */
  let reserva;
  let pago = null;

  try {
    const respuesta = await fetch('/api/servicios/demo', {
      method: 'POST',
      credentials: 'include'
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo cargar la reserva.');
    reserva = resultado.servicio;
  } catch (error) {
    const aviso = document.createElement('div');
    aviso.className = 'alert alert-danger m-4';
    aviso.textContent = error.message || 'Iniciá sesión para continuar con el pago.';
    document.body.prepend(aviso);
    return;
  }

  // Renderizar datos de la reserva
  document.getElementById('reservaId').textContent = reserva.id;
  document.getElementById('prestadorNombre').textContent = reserva.prestador;
  document.getElementById('servicioNombre').textContent = reserva.tipo;
  document.getElementById('servicioFecha').textContent = new Date(reserva.horaProgramada)
    .toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  document.getElementById('mascotaNombre').textContent = reserva.mascota;

  const montoFormateado = reserva.monto.toLocaleString('es-AR');
  document.querySelectorAll('.montoTexto, #montoTotal').forEach(el => {
    el.textContent = montoFormateado;
  });

  /* ---------- Estado del flujo ---------- */
  let metodoActual = 'tarjeta';
  let datosTarjeta = null;
  let transaccion = null;

  /* ---------- Navegación entre pasos ---------- */
  const pasos = ['metodo', 'confirmar', 'comprobante'];

  function irAPaso(nombrePaso) {
    pasos.forEach(p => {
      const panel = document.getElementById(`panel-${p}`);
      if (p === nombrePaso) {
        panel.classList.remove('d-none');
      } else {
        panel.classList.add('d-none');
      }
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

  /* ---------- Paso 1: Selección de método ---------- */
  const segmentos = document.querySelectorAll('.segmento');
  const formTarjeta = document.getElementById('formTarjeta');
  const formBilletera = document.getElementById('formBilletera');

  segmentos.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentos.forEach(b => {
        b.classList.remove('activo');
        b.classList.add('text-brand');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('activo');
      btn.classList.remove('text-brand');
      btn.setAttribute('aria-selected', 'true');

      metodoActual = btn.dataset.metodo;
      if (metodoActual === 'tarjeta') {
        formTarjeta.classList.remove('d-none');
        formBilletera.classList.add('d-none');
      } else {
        formTarjeta.classList.add('d-none');
        formBilletera.classList.remove('d-none');
      }
    });
  });

  // Formateo del número de tarjeta: 0000 0000 0000 0000
  const inputNumero = document.getElementById('numTarjeta');
  inputNumero.addEventListener('input', () => {
    let valor = inputNumero.value.replace(/\D/g, '').slice(0, 16);
    inputNumero.value = valor.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  // Formateo de fecha de vencimiento: MM/AA
  const inputVenc = document.getElementById('vencTarjeta');
  inputVenc.addEventListener('input', () => {
    let valor = inputVenc.value.replace(/\D/g, '').slice(0, 4);
    if (valor.length > 2) valor = valor.slice(0, 2) + '/' + valor.slice(2);
    inputVenc.value = valor;
  });

  const inputCvv = document.getElementById('cvvTarjeta');
  inputCvv.addEventListener('input', () => {
    inputCvv.value = inputCvv.value.replace(/\D/g, '').slice(0, 4);
  });

  // Validación con clases nativas de Bootstrap
  function marcarError(idInput, mensaje) {
    const input = document.getElementById(idInput);
    const error = document.getElementById(`err-${idInput}`);
    if (mensaje) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      error.textContent = mensaje;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      error.textContent = '';
    }
  }

  function validarTarjeta() {
    let valido = true;

    const numero = inputNumero.value.replace(/\s/g, '');
    if (numero.length < 16) {
      marcarError('numTarjeta', 'Ingresá los 16 dígitos de la tarjeta.');
      valido = false;
    } else {
      marcarError('numTarjeta', '');
    }

    const nombre = document.getElementById('nombreTitular').value.trim();
    if (nombre.length < 3) {
      marcarError('nombreTitular', 'Ingresá el nombre completo del titular.');
      valido = false;
    } else {
      marcarError('nombreTitular', '');
    }

    const venc = inputVenc.value;
    const coincideFormato = /^(0[1-9]|1[0-2])\/\d{2}$/.test(venc);
    if (!coincideFormato) {
      marcarError('vencTarjeta', 'Formato inválido (MM/AA).');
      valido = false;
    } else {
      const [mes, anio] = venc.split('/').map(Number);
      const hoy = new Date();
      const vencimiento = new Date(2000 + anio, mes - 1, 1);
      const limite = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      if (vencimiento < limite) {
        marcarError('vencTarjeta', 'La tarjeta está vencida.');
        valido = false;
      } else {
        marcarError('vencTarjeta', '');
      }
    }

    if (inputCvv.value.length < 3) {
      marcarError('cvvTarjeta', 'CVV de 3 o 4 dígitos.');
      valido = false;
    } else {
      marcarError('cvvTarjeta', '');
    }

    if (valido) {
      datosTarjeta = {
        numero,
        ultimosDigitos: numero.slice(-4),
        nombre,
        venc
      };
    }

    return valido;
  }

  document.getElementById('btnContinuarMetodo').addEventListener('click', async () => {
    if (metodoActual === 'tarjeta') {
      if (!validarTarjeta()) return;
      document.getElementById('metodoElegido').textContent =
        `Tarjeta terminada en ${datosTarjeta.ultimosDigitos}`;
    } else {
      document.getElementById('metodoElegido').textContent = 'Billetera virtual';
    }

    try {
      const respuesta = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          servicioId: reserva.id,
          metodo: metodoActual,
          ultimosDigitos: datosTarjeta?.ultimosDigitos
        })
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo preparar el pago.');
      pago = resultado.pago;
      mostrarEstado('estado-previo');
      irAPaso('confirmar');
    } catch (error) {
      alert(error.message);
    }
  });

  /* ---------- Paso 2: Confirmar y Escrow ---------- */
  const estados = ['estado-previo', 'estado-procesando', 'estado-retenido', 'estado-liberado'];

  function mostrarEstado(idEstado) {
    estados.forEach(id => {
      const el = document.getElementById(id);
      if (id === idEstado) {
        el.classList.remove('d-none');
      } else {
        el.classList.add('d-none');
      }
    });
  }

  document.getElementById('btnConfirmarPago').addEventListener('click', async () => {
    document.getElementById('procesandoMetodo').textContent =
      metodoActual === 'tarjeta' ? 'tarjeta' : 'billetera virtual';
    mostrarEstado('estado-procesando');

    try {
      const respuesta = await fetch(`/api/pagos/${pago.id}/confirmar`, {
        method: 'POST',
        credentials: 'include'
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo confirmar el pago.');
      pago = resultado.pago;
      transaccion = {
        id: pago.transaccionId,
        fecha: new Date(pago.confirmadoEn),
        metodo: pago.metodo === 'tarjeta'
          ? `Tarjeta terminada en ${pago.ultimosDigitos}`
          : 'Billetera virtual',
        estado: 'Retenido (escrow)'
      };
      mostrarEstado('estado-retenido');
    } catch (error) {
      alert(error.message);
      mostrarEstado('estado-previo');
    }
  });

  document.getElementById('btnLiberarPago').addEventListener('click', async () => {
    try {
      const respuesta = await fetch(`/api/pagos/${pago.id}/liberar`, {
        method: 'POST',
        credentials: 'include'
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo liberar el pago.');
      pago = resultado.pago;
      transaccion.estado = 'Liberado al prestador';
      mostrarEstado('estado-liberado');
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById('btnVerComprobante').addEventListener('click', () => {
    completarComprobante();
    irAPaso('comprobante');
  });

  /* ---------- Paso 3: Comprobante ---------- */
  function completarComprobante() {
    document.getElementById('compTransaccion').textContent = transaccion.id;
    document.getElementById('compFecha').textContent =
      transaccion.fecha.toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    document.getElementById('compServicio').textContent = reserva.tipo;
    document.getElementById('compPrestador').textContent = reserva.prestador;
    document.getElementById('compMetodo').textContent = transaccion.metodo;
    document.getElementById('compEstado').textContent = transaccion.estado;
  }

  document.getElementById('btnImprimir').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btnDescargar').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [100, 150] });

    const turquesa = [31, 122, 116];
    const coral = [255, 111, 82];
    const tintaSuave = [91, 107, 106];
    const linea = [220, 213, 196];

    let y = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...turquesa);
    doc.text('Pac-Cop', 50, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...tintaSuave);
    doc.text('Comprobante de pago', 50, y, { align: 'center' });

    y += 4;
    doc.setDrawColor(...linea);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(8, y, 92, y);

    const filas = [
      ['N.º de transacción', transaccion.id],
      ['Fecha de pago', document.getElementById('compFecha').textContent],
      ['Reserva', `#${reserva.id}`],
      ['Servicio', reserva.tipo],
      ['Prestador', reserva.prestador],
      ['Mascota', reserva.mascota],
      ['Método de pago', transaccion.metodo],
      ['Estado', transaccion.estado]
    ];

    y += 8;
    doc.setFontSize(9);
    filas.forEach(([etiqueta, valor]) => {
      doc.setTextColor(...tintaSuave);
      doc.text(etiqueta, 8, y);
      doc.setTextColor(30, 40, 40);
      doc.text(String(valor), 92, y, { align: 'right' });
      y += 6;
    });

    y += 2;
    doc.setDrawColor(...linea);
    doc.line(8, y, 92, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...tintaSuave);
    doc.text('Total pagado', 8, y);
    doc.setFontSize(14);
    doc.setTextColor(...coral);
    doc.text(`$${montoFormateado}`, 92, y, { align: 'right' });

    doc.save(`comprobante-pac-cop-${transaccion.id}.pdf`);
  });

});
