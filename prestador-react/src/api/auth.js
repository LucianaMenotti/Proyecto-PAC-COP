// API de autenticación y sesión de Pac-Cop

export async function getCurrentUser() {
  try {
    const res = await fetch('/api/users/me', {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.usuario || data;
  } catch (err) {
    console.error('Error al obtener usuario actual:', err);
    return null;
  }
}

export async function logoutUser() {
  try {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
}
