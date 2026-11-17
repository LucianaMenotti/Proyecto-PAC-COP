# Fusión de ramas y rediseño del frontend

Este documento registra todo lo que se hizo en la rama `integracion-final`: la fusión de las dos líneas de trabajo del proyecto y el rediseño posterior del frontend. El README.md principal describe el proyecto terminado. Este describe cómo se llegó a él.

## 1. Punto de partida

| Línea | Rama | Aporte |
| --- | --- | --- |
| Luciana Menotti | `menotti-organizado` | Estructura `backend/` + `frontend/` con React y Vite, reclamos, notificaciones, chat unificado con fotos, páginas de dueño en Bootstrap. |
| Maxi Soria | `prueba-integracion` | Panel del prestador (Tailwind), precio por volumen, calificaciones, pagos con custodia, panel de administración, recuperación de contraseña, tiempo real por SSE, seguimiento GPS. |

Base elegida: `menotti-organizado`. Sobre esa estructura se incorporó lo de `prueba-integracion`. Resultado: una sola carpeta `backend/` y una sola `frontend/`. Se eliminaron las carpetas heredadas (`src`, `js`, `paginas`, `prestador-react`, etc.).

Commit de la fusión: `88fc14a` (111 archivos, +10080 −2433).

## 2. Fusión del backend

### Agregado desde `prueba-integracion`

| Área | Archivos |
| --- | --- |
| Administración | `controllers/admin.controller.js`, `routes/admin.routes.js`, `middlewares/admin.middleware.js` |
| Tiempo real (SSE) | `routes/evento.routes.js`, `helpers/realtime.helper.js` |
| Correo y recuperación de contraseña | `helpers/email.helper.js`, `helpers/email.templates.js` |
| Precio por volumen | `helpers/precio.helper.js`, `test/precio.test.js` |
| Limitación de intentos | `middlewares/rateLimit.middleware.js` |
| Calificaciones | `models/calificacion.model.js` |

### Modificado

| Archivo | Cambio |
| --- | --- |
| `app.js` | Monta las rutas nuevas (`/api/admin`, `/api/eventos`), CORS y migración idempotente de columnas al iniciar. |
| `controllers/servicio.controller.js` | Reserva con varias mascotas, traslado ida y vuelta, validación de disponibilidad, tamaños y razas excluidas, aceptar, rechazar, cancelar, check-in y check-out, calificación. |
| `controllers/pago.controller.js` | Pago con custodia. Estados pendiente, retenido, liberado, fallido, expirado y reembolsado. Liquidaciones. |
| `controllers/user.controller.js` | Recuperar y restablecer contraseña, disponibilidad, restricciones, vehículo, cuenta de cobro. |
| `controllers/notificacion.controller.js`, `mensaje.controller.js`, `reclamo.controller.js` | Envían eventos SSE. Notificaciones con los tipos nuevos. |
| `models/servicio.model.js`, `pago.model.js`, `user.model.js`, `mascota.model.js` | Columnas nuevas. Se agregan al iniciar sin perder datos. |
| `routes/servicio.routes.js`, `pago.routes.js`, `user.routes.js` | Endpoints nuevos y límite de intentos en registro, login y recuperación. |
| `.env.example`, `package.json` | Variables de correo, `FRONTEND_URL`, dependencia nueva. |

### Decisiones de resolución

1. **Notificaciones:** se conservó el modelo de Luciana (tabla `Notificaciones`). Las de reclamos también salen por SSE. La tabla `Notificacions` de la rama de Maxi no se usa.
2. **Chat:** se conservó el chat unificado de Luciana (texto, imagen o ambos). Se le agregó el aviso en tiempo real.
3. **Reservas:** el flujo real de contratación es `Servicio`. `POST /api/reservas` quedó como endpoint heredado.
4. **Sesión:** cookie httpOnly `pac_cop_session` y contraseñas con scrypt, como en la rama de Luciana.

## 3. Fusión del frontend

### Páginas nuevas

`Admin`, `Recuperar`, `Restablecer`.

### Páginas fusionadas

| Página | Cómo quedó |
| --- | --- |
| `PanelPrestador` | Base de Maxi (Tailwind v4). Cada sección es una ruta `/panel-prestador/:seccion`. Se sumaron reclamos y chat unificado de Luciana. |
| `BuscarPrestadores`, `MisServicios`, `Pago`, `Seguimiento` | Bootstrap de Luciana con la lógica final de Maxi: reserva con varias mascotas y desglose de precio, pago, cancelación, calificación, reseñas, seguimiento GPS. |
| `Chat` | Usa el componente `ConversacionChat` en página completa y dentro del panel. |
| `Notificaciones` | Más la campana flotante `CampanaNotificaciones` con avisos en tiempo real. |

### Componentes nuevos

- `admin/`: `TablaUsuarios`, `TablaServiciosAdmin`.
- `panel/`: `MenuLateralPanel`, `SeccionPrecios`, `SeccionRendimiento`, `SeccionSolicitudes`, `SeccionTrabajo`, `SeccionCobros`, `SeccionVehiculo`, `SeccionChat`, `SeccionReclamos`, `SeccionPerfil`, `ModalReclamoPanel`, `EncabezadoSeccion`.
- `servicios/`: `ModalCalificar`, `ModalCancelarReserva`.
- Sueltos: `ModalResenas`, `CampanaNotificaciones`, `chat/ConversacionChat`.
- Hooks: `useTiempoReal` (SSE), `useRangosMercado`, ampliación de `useSeguimiento`, `useServicios` y `useChat`.
- Helpers: `precios.js`, `notificaciones.js`.

### Eliminado

`ServiciosActivos`, `SolicitudesPrestador`, `TabNiveles`, `TabPublicar`, `TabRendimiento`, `TabRuta`, `PerfilPrestador` (ahora redirige a `/panel-prestador/perfil`) y los estilos propios del panel anterior.

### Dependencias

Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`) solo para el panel del prestador.

## 4. Rediseño del frontend

### Problema

Al navegar, cada pantalla parecía otra aplicación: **Inicio** (`/inicio`) tenía barra verde con tipografía serif, el **Landing** (`/`) tenía otra barra con marca azul, y **Mis mascotas** solo tenía el nombre de la marca. Cada página cargaba su propia hoja de estilos, definía su propio `body` y su propia barra. Sin menú común, "Inicio" llevaba a una pantalla distinta según desde dónde se tocara.

### Solución

**Una sola estructura.** `components/LayoutApp.jsx` envuelve todas las rutas con la barra `NavbarApp`, el contenido y el pie `PieApp`. Se eliminaron `NavbarInicio`, `BarraMarca`, `PieInicio`, `BarraPanel` y las barras sueltas de `Admin`, `AdminReclamos`, `MisServicios`, `Notificaciones`, `Pago` y `Seguimiento`.

**Un solo "Inicio".** `/` es el inicio para todos: muestra el Landing a visitantes, el resumen de cuenta a dueños y administradores, y lleva al panel a los prestadores. `/inicio` redirige a `/`.

**Menú según rol** (en `NavbarApp`):

| Rol | Enlaces |
| --- | --- |
| Visitante | Inicio, Buscar prestadores, ¿Cómo funciona?, Servicios |
| Dueño | Inicio, Buscar prestadores, Mis mascotas, Mis reservas, Notificaciones |
| Prestador | Mi panel, Mis servicios, Notificaciones |
| Administrador | Inicio, Administración, Reclamos, Prestadores, Notificaciones |

El enlace de la sección actual queda resaltado. En pantallas chicas el menú se despliega con un botón.

**Tipografía.** Inter para texto e interfaz. Fraunces para títulos. Ambas instaladas por npm (`@fontsource-variable/inter` y `@fontsource-variable/fraunces`), sin depender de Google Fonts.

**Colores.** Verde azulado `#1f7a74` como color principal y coral `#ff6f52` como acento. Estados de peligro, advertencia y éxito con tonos suaves. Todo definido como variables CSS en `src/styles/tema.css`.

**Modo oscuro.** Botón sol/luna en la barra. Fondo `#262624` (gris cálido de Claude), tarjetas `#30302e`, bordes `#46453f`, texto `#e4e2d8`. Verde y coral más claros para mantener el contraste. Detalles:

- Se guarda en `localStorage` (`pac-tema`). Sin preferencia guardada, sigue la del sistema.
- Un script en `index.html` aplica el tema antes del primer pintado, sin parpadeo.
- Se puede forzar con `?tema=dark` o `?tema=light` en la URL. Sirve para pruebas y capturas.
- Aplica a Bootstrap (`data-bs-theme`), a las hojas por página y al panel del prestador con Tailwind.

### Cómo conviven Bootstrap y Tailwind

Los dos usan los mismos nombres de clase para espaciado, bordes y sombras con valores distintos, así que no pueden estar cargados a la vez. El hook `useMotorEstilos` inyecta Bootstrap al inicio del `<head>` en todas las rutas menos `/panel-prestador`, y marca el `<html>` con `data-motor="bootstrap"` o `"tailwind"`. `tema.css` limita las reglas que podrían pisar a Tailwind al motor Bootstrap.

### Estilos por página

Las hojas de `src/config/estilos/` tenían reglas globales (`body`, `*`, `h1`, `p`, `label`, `.btn`, `.modal-*`) que cambiaban toda la pantalla. Cambios:

1. Se quitaron los `body` y `*` de `alertas`, `fichaSalud`, `mach`, `numero`, `pago` y `seguimiento`.
2. Las reglas genéricas de `alertas`, `fichaSalud`, `mach` y `numero` se acotaron a un contenedor propio (`.pagina-alertas`, `.ficha-pagina`, `.pagina-mach`, `.pagina-numero`).
3. Los colores fijos pasaron a variables del tema. Por eso cambian solos en el modo oscuro.
4. `base.js` e `inicio.js` quedaron solo con los componentes de contenido (hero, tarjetas). El resto vive en `tema.css`.
5. El panel del prestador remapea la escala de colores de Tailwind en modo oscuro, sin tocar `white` y `black`.

### Otros ajustes

- El chat y el panel descuentan la altura de la barra. El chat no lleva pie.
- El botón de emergencia de `/numero` pasó a la izquierda para no tapar la campana de notificaciones.
- Los avisos vacíos de `/pago` quedaron dentro de un contenedor con ancho máximo.
- `PanelPrestador` usa `EncabezadoPanel` (nombre y nivel) en lugar de una barra propia.

### Archivos nuevos del rediseño

```text
frontend/src/styles/tema.css
frontend/src/hooks/useTema.js
frontend/src/hooks/useMotorEstilos.js
frontend/src/components/LayoutApp.jsx
frontend/src/components/NavbarApp.jsx
frontend/src/components/PieApp.jsx
frontend/src/components/panel/EncabezadoPanel.jsx
```

## 5. Cómo probarlo

```text
cd backend
npm install
npm run dev
```

```text
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173 y alternar el modo oscuro con el botón de la barra. Para recorrer cada rol, iniciar sesión como dueño, prestador y administrador.

## 6. Verificación y límites

Verificado:

1. `npm run build` del frontend sin errores.
2. ESLint sobre `frontend/src` sin errores.
3. Capturas en Edge, modo claro y oscuro, con un backend simulado (no se usó la base real): Landing, Login, Registro (modo claro), Buscar prestadores, Inicio de dueño, Mis mascotas, Mis reservas, Ficha de salud, Chat, Seguimiento, Mach, Número, panel del prestador (Precios y Solicitudes) y panel de administración. Pago solo se vio sin reserva.

No verificado:

1. Recorrido completo con sesión real contra MySQL en todos los roles.
2. Pantallas que no llegué a ver renderizadas: gestión de reclamos (`/admin-reclamos`), notificaciones, recuperar y restablecer contraseña, alertas, pago con una reserva real, comprobante, secciones del panel distintas de Precios y Solicitudes, y los modales (reserva, reseñas, calificar, cancelar, reclamo).
3. Impresión del comprobante en modo oscuro.
4. Navegadores distintos de Edge.

## 7. Pendientes conocidos

1. Algunos componentes tienen colores fijos en estilos en línea (`ComprobantePago`, `ModalReserva`, `SeccionPrecios` y otros). Pueden verse claros sobre fondo oscuro. Conviene revisarlos con datos reales.
2. El bundle de producción pesa más de 1 MB. Se puede dividir por ruta con `import()` dinámico.
3. `frontend/src/hooks/useBootstrap.js` quedó como hook vacío para no tocar cada página. Se puede borrar junto con sus llamadas.
