// API helpers para el Dueño de Mascotas en Pac-Cop

export async function getMisReservas() {
  const res = await fetch('/api/servicios', { credentials: 'include' });
  if (!res.ok) throw new Error('No se pudieron cargar las reservas');
  const data = await res.json();
  return data.servicios || [];
}

export async function cancelarReserva(servicioId, motivo) {
  const res = await fetch(`/api/servicios/${servicioId}/cancelar`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al cancelar reserva');
  return data;
}

export async function calificarServicio(servicioId, puntuacion, comentario) {
  const res = await fetch(`/api/servicios/${servicioId}/calificacion`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puntuacion, comentario }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al enviar reseña');
  return data;
}

export async function getPrestadores() {
  const res = await fetch('/api/users', { credentials: 'include' });
  if (!res.ok) throw new Error('Error al cargar prestadores');
  const usuarios = await res.json();
  return (usuarios || []).filter((u) => u.rol === 'prestador');
}

export async function getMisMascotas(usuarioId) {
  try {
    const res = await fetch(`/api/mascotas/usuario/${usuarioId}`, {
      credentials: 'include',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.mascotas || data || [];
  } catch (err) {
    console.error('Error al cargar mascotas:', err);
    return [];
  }
}

export async function crearReserva(datos) {
  const res = await fetch('/api/servicios', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al crear reserva');
  return data;
}

export async function getDetalleServicio(servicioId) {
  const res = await fetch(`/api/servicios/${servicioId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al cargar detalle del servicio');
  return data.servicio || data;
}

export async function getPagoServicio(servicioId) {
  try {
    const res = await fetch(`/api/pagos/servicio/${servicioId}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.pago || null;
  } catch {
    return null;
  }
}

export async function procesarPago(datosPago) {
  const res = await fetch('/api/pagos/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosPago),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al procesar el pago');
  return data;
}
