// API de Prestador de Servicios de Pac-Cop

export async function getServicios() {
  const res = await fetch('/api/servicios', { credentials: 'include' });
  if (!res.ok) throw new Error('No se pudieron cargar los servicios');
  return res.json();
}

export async function updateMisServicios(servicios, preciosServicios) {
  const res = await fetch('/api/users/me/servicios', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servicios, preciosServicios }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al guardar servicios');
  return data;
}

export async function accionServicio(id, accion) {
  const res = await fetch(`/api/servicios/${id}/${accion}`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || `Error al ${accion} el servicio`);
  return data;
}

export async function getLiquidaciones() {
  const res = await fetch('/api/pagos/liquidaciones', { credentials: 'include' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al cargar liquidaciones');
  return data;
}

export async function updateCuentaCobro(datos) {
  const res = await fetch('/api/users/me/cuenta-cobro', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al guardar cuenta');
  return data;
}

export async function updateDisponibilidad(disponibilidad) {
  const res = await fetch('/api/users/me/disponibilidad', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disponibilidad }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al guardar disponibilidad');
  return data;
}

export async function updateRestricciones(tamanosAceptados, restricciones) {
  const res = await fetch('/api/users/me/restricciones', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tamanosAceptados, restricciones }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al guardar restricciones');
  return data;
}

export async function updateVehiculo(vehiculo) {
  const res = await fetch('/api/users/me/vehiculo', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehiculo: vehiculo || null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al guardar vehículo');
  return data;
}

export async function registrarGuarderia(servicioId, accion) {
  // accion: 'check-in' o 'check-out'
  const res = await fetch(`/api/servicios/${servicioId}/${accion}`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || `Error en ${accion}`);
  return data;
}

export async function getResenas(prestadorId) {
  const res = await fetch(`/api/servicios/prestador/${prestadorId}/resenas`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al obtener reseñas');
  return data;
}

export async function getRutaHoy() {
  const res = await fetch('/api/servicios/prestador/ruta', {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al obtener ruta');
  return data;
}

export async function getMensajes(servicioId) {
  const res = await fetch(`/api/mensajes/${servicioId}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al obtener mensajes');
  return data;
}

export async function postMensaje(servicioId, texto) {
  const res = await fetch(`/api/mensajes/${servicioId}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al enviar mensaje');
  return data;
}
