# CONTEXTO TÉCNICO — PAC-COP

Este documento contiene el contexto técnico que debe conocer cualquier persona o asistente de IA antes de modificar el proyecto PAC-COP.

Su objetivo es evitar duplicar funcionalidades existentes, romper relaciones entre módulos o implementar soluciones incompatibles con la arquitectura actual.

El proyecto resulta de integrar la rama menotti-organizado (estructura backend y frontend, reclamos, reservas, chat unificado) con la rama prueba-integracion (precio por volumen, calificaciones, administración, recuperación de contraseña, tiempo real, pagos con estados nuevos). La descripción de instalación y la lista de funcionalidades están en README.md.

---

# 1. Estructura y tecnologías

El repositorio tiene exactamente dos aplicaciones:

```text
backend/    API
frontend/   Interfaz
```

No deben crearse otras carpetas de código en la raíz ni duplicar el backend o el frontend.

Backend:

* Node.js 20 o superior.
* Express 5.
* Sequelize con MySQL.
* ES Modules (`"type": "module"`).
* Cookies `httpOnly`.
* `scrypt` para contraseñas.
* `multer` para las imágenes de evidencia de reclamos.
* `nodemailer` para el correo de recuperación (carga diferida).

Frontend:

* React 18 y React Router 6.
* Vite 5. El proxy envía `/api` y `/uploads` a `http://localhost:3000`.
* Bootstrap 5 y Bootstrap Icons por npm, en todas las páginas salvo el panel del prestador.
* Tailwind 4 solo en el panel del prestador, con hoja propia inyectada mientras ese panel está montado (`src/config/estilos/tailwind.css`, `panelTailwind.js`). No importar Tailwind de forma global: su Preflight rompería las páginas de Bootstrap.
* Leaflet para mapas y jsPDF para comprobantes.
* Los estilos de cada página son módulos JavaScript en `src/config/estilos` que un hook (`useEstilos`) inyecta mientras la página está montada.

El servidor Express no sirve el frontend. En desarrollo, el navegador usa `http://localhost:5173` y Vite reenvía la API a `http://localhost:3000`.

---

# 2. Autenticación

La autenticación está centralizada.

Backend:

```text
backend/middlewares/auth.middleware.js
backend/helpers/auth.helper.js
backend/helpers/password.helper.js
backend/middlewares/admin.middleware.js
```

Frontend:

```text
frontend/src/hooks/useAuth.jsx          (ProveedorAuth y useAuth)
frontend/src/components/RutaProtegida.jsx
frontend/src/config/api.js              (apiFetch, apiJson, enviarJson, apiDatos, enviarDatos)
```

La sesión utiliza la cookie:

```text
pac_cop_session
```

Todas las llamadas del frontend usan `credentials: "include"` mediante `config/api.js`.

Para proteger una página por rol:

```jsx
<RutaProtegida roles={["prestador"]}>...</RutaProtegida>
```

No crear otro sistema de login o sesión.

El backend siempre debe verificar los permisos. El frontend no es suficiente para proteger recursos.

Recuperación de contraseña:

```text
POST /api/users/recuperar     { email }
POST /api/users/restablecer   { token, password }   (mínimo 8 caracteres)
```

El enlace enviado es `FRONTEND_URL + PASSWORD_RESET_PATH + ?token=...`, que abre la página `/restablecer`. Sin SMTP configurado, el enlace se imprime en la consola del backend. El token se guarda con hash (`resetTokenHash`) y con vencimiento (`resetExpira`).

Limitación de intentos (en memoria, por IP, ventana de 15 minutos): registro 30, login 60, recuperación y restablecimiento 10. Responde 429 con `Retry-After`. Está definida en `backend/routes/user.routes.js` con `backend/middlewares/rateLimit.middleware.js`.

---

# 3. Roles

Los roles actuales son:

```text
dueño
prestador
admin
administrador
```

Los roles `admin` y `administrador` se consideran administrativos en las validaciones existentes (`ROLES_ADMIN` en `frontend/src/config/rutas.js` y en `backend/middlewares/admin.middleware.js`, que también exporta `esAdministrador`).

No cambiar los nombres de los roles sin revisar todas las partes del proyecto.

Además del rol, cada usuario tiene dos estados (`backend/helpers/cuenta.helper.js`):

* `estadoCuenta`: `activa` o `suspendida`. Una cuenta suspendida no inicia sesión y `authMiddleware` responde 403 y borra la cookie en cualquier ruta protegida.
* `estadoAprobacion` (solo prestadores): `pendiente`, `aprobado` o `rechazado`. Solo un prestador aprobado y activo aparece en `GET /api/users`, recibe reservas y entra en el rango de precios de mercado. Para filtrar prestadores visibles usar `condicionPrestadorVisible()` en lugar de `{ rol: "prestador" }`.

El registro solo crea dueños y prestadores. El primer administrador se habilita con `npm run crear-admin -- correo@ejemplo.com` en `backend/`.

---

# 4. Servicio como entidad central

El concepto más importante para conectar las funcionalidades del proyecto es el **servicio**.

Un servicio relaciona:

```text
Dueño
  │
  ├── Mascota(s)
  │
  ├── Prestador
  │
  ├── Pago (custodia)
  │
  ├── Ubicación GPS
  │
  ├── Chat
  │
  ├── Calificación
  │
  └── Reclamo
```

Por esto, el `servicioId` es muy importante.

Si se modifica la estructura o el flujo de servicios, hay que revisar las funcionalidades que dependen de él.

---

# 5. Modelo Servicio

Archivo:

```text
backend/models/servicio.model.js
```

Campos principales:

```text
id, ownerId, providerId, mascotaId, prestadorNombre, tipo, mascotaNombre, monto,
estado, horaProgramada, iniciadoEn, finalizadoEn,
canceladoEn, motivoCancelacion, reembolso,
origen, destino, motivoTraslado, servicioVueltaId, horaRegreso,
checkIn, checkOut, calificacion, comentarioCalificacion
```

Los tipos válidos son `Paseo`, `Guarderia` (sin tilde) y `Traslado`. Se usan exactamente esos textos en el backend (`validation.middleware.js`, `servicio.controller.js`) y en el frontend (`helpers/niveles.js`, `helpers/servicios.js`).

Estados utilizados actualmente:

```text
programado
aceptado
en-curso
finalizado
rechazado
cancelado
```

Transiciones:

```text
programado → aceptado | rechazado | cancelado
aceptado   → en-curso | cancelado
en-curso   → finalizado
```

No cambiar estos valores solamente en el frontend.

Si se modifica un estado, revisar:

* Controladores de servicios, pagos, mensajes y reclamos.
* Panel del prestador (solicitudes, trabajo en curso, cobros).
* Mis servicios.
* Chat y seguimiento.
* Cualquier condición que compare `estado`.

Los servicios se crean con `POST /api/servicios` (rol dueño). Acepta `mascotaIds` (varias mascotas) o `mascotaId`, `providerId`, `tipo`, `horaProgramada` y, para traslados, `origen`, `destino`, `motivoTraslado`, `solicitarVuelta` y `horaRegreso`. El monto lo calcula el backend (ver sección 7). No confiar en un monto enviado por el frontend.

---

# 6. Servicios según el rol

Archivo principal:

```text
backend/controllers/servicio.controller.js
```

`GET /api/servicios` determina qué servicios devuelve según el usuario autenticado.

Dueño:

```text
ownerId = usuario.id
```

Prestador:

```text
providerId = usuario.id
```

Administrador:

```text
todos los servicios
```

Por lo tanto, una pantalla de dueño no necesita enviar manualmente el `userId` para obtener sus propios servicios.

La respuesta es `{ servicios, total, pagina, limite, totalPaginas }`. La paginación es opcional (`?limite=&pagina=`) y se puede filtrar por `estado` y `servicio`. Cada servicio incluye `puedeGestionar` y, para finalizados, `calificado`.

---

# 7. Precios, disponibilidad y restricciones

Precio:

```text
backend/helpers/precio.helper.js
frontend/src/helpers/precios.js     (copia del cálculo para mostrar el desglose)
```

Cada prestador guarda en `User.preciosServicios` un valor por tipo de servicio. El valor puede ser un número o un objeto `{ precioBase, tipoDescuento, valorDescuento }`. `tipoDescuento` es `ninguno`, `porcentaje` o `fijoIncremental` y se aplica desde la segunda mascota. Si se cambia la fórmula en el backend, cambiar también la copia del frontend y la prueba `backend/test/precio.test.js`.

El rango de mercado para sugerir precios sale de `GET /api/servicios/precios/sugerido`. No hay un precio mínimo obligatorio: el nivel solo orienta la sugerencia.

Niveles del prestador (nuevo, establecido, top) se calculan en `frontend/src/helpers/niveles.js` con servicios finalizados y calificación.

Al reservar, el backend valida `User.disponibilidad` (días y horarios), `User.tamanosAceptados` y `User.restricciones` (razas excluidas) frente a la mascota. Responde 409 si no se cumplen. `Mascota.tamano` alimenta esa validación. También responde 409 si el prestador ya tiene un paseo o traslado activo a menos de una hora (`horarioOcupado`), y valida la vuelta de un traslado antes de crear la ida.

---

# 8. Pagos con custodia

Archivos:

```text
backend/controllers/pago.controller.js
backend/models/pago.model.js
frontend/src/pages/Pago.jsx
```

Estados del pago: `pendiente`, `retenido`, `liberado`, `fallido`, `expirado`, `reembolsado`.

Reglas:

* `POST /api/pagos` crea o reabre el pago de un servicio. Responde 409 si ya está retenido o liberado, o si el servicio está cancelado, rechazado o finalizado.
* Un pago pendiente expira a los 15 minutos.
* `POST /api/pagos/:id/confirmar` retiene el pago. Una tarjeta cuyos últimos cuatro dígitos son `0000` simula un rechazo (402, estado `fallido`).
* Al finalizar el servicio se libera el pago al prestador. `POST /api/pagos/:id/liberar` solo lo acepta con el servicio finalizado, salvo que lo haga un administrador.
* Al cancelar, el dueño recibe reembolso si faltan 12 horas o más (`HORAS_REEMBOLSO_COMPLETO` en `servicio.controller.js`). Si cancela con menos tiempo, el pago se libera al prestador. Si cancela el prestador o un administrador, siempre hay reembolso.
* `GET /api/pagos/liquidaciones` alimenta la sección Cobros del panel del prestador.

Los datos de la tarjeta no se guardan: solo los últimos cuatro dígitos.

---

# 9. Seguimiento GPS

Archivos:

```text
backend/models/ubicacion.model.js
backend/controllers/servicio.controller.js     (iniciar, finalizar, ubicacion)
frontend/src/hooks/useSeguimiento.js
frontend/src/pages/Seguimiento.jsx
```

Ruta: `/seguimiento?servicioId=ID`. El prestador inicia el servicio (debe estar `aceptado`), su navegador envía la posición con `POST /api/servicios/:id/ubicacion` y el dueño la ve por SSE (evento `ubicacion`) y por sondeo cada 5 segundos. Al finalizar, el dueño puede calificar.

Calificaciones: `POST /api/servicios/:id/calificacion` (`puntuacion`, `comentario`), una por servicio y dueño (índice único). Las reseñas del prestador se leen con `GET /api/servicios/prestador/:id/resenas`.

---

# 10. Arquitectura del chat

Esta es una de las partes más importantes del proyecto.

**Existe un único chat por servicio.**

El chat no pertenece directamente al dueño ni directamente al prestador.

Pertenece al:

```text
servicioId
```

Ejemplo:

```text
Servicio #2
    │
    └── Chat del servicio #2
```

El dueño y el prestador entran al mismo chat:

```text
/chat?servicioId=2
```

No deben existir chats separados por rol.

Archivos:

```text
backend/models/mensaje.model.js
backend/controllers/mensaje.controller.js
backend/routes/mensaje.routes.js
backend/helpers/imagen.helper.js

frontend/src/pages/Chat.jsx
frontend/src/components/chat/ConversacionChat.jsx   (compartido con el panel del prestador)
frontend/src/components/panel/SeccionChat.jsx       (chat dentro del panel)
frontend/src/hooks/useChat.js
```

---

# 11. Modelo Mensaje y endpoints del chat

Campos:

```text
id, servicioId, remitenteId, texto, imagenArchivo, latitud, longitud, creadoEn
```

`texto` admite cadena vacía cuando el mensaje solo trae imagen. El `remitenteId` se obtiene de la sesión en el backend. No confiar en un `remitenteId` enviado por el frontend.

Rutas:

```text
GET  /api/mensajes/:servicioId               (parámetro desde=ID para pedir solo los nuevos)
POST /api/mensajes/:servicioId
GET  /api/mensajes/:servicioId/imagen/:archivo
```

Enviar un mensaje:

```json
{
    "texto": "Hola",
    "imagen": "data:image/jpeg;base64,...",
    "latitud": -27.36,
    "longitud": -55.9
}
```

El backend acepta imágenes jpeg, png y webp de hasta 6 MB, las guarda en `backend/uploads/chat` con nombre aleatorio y las entrega solo con sesión y permiso sobre el servicio. El cliente reduce la imagen a 1280 píxeles antes de enviarla.

Al guardar un mensaje, el backend crea una notificación para la otra parte y emite los eventos SSE `notificacion` y `mensaje`.

---

# 12. Permisos y estados del chat

El usuario puede acceder al chat si:

```text
usuario.id === servicio.ownerId
```

o:

```text
usuario.id === servicio.providerId
```

o:

```text
usuario es administrador
```

El chat solamente permite acceso cuando el servicio está:

```text
aceptado
en-curso
```

Por ejemplo:

```text
programado → no disponible
aceptado    → disponible
en-curso    → disponible
rechazado   → no disponible
```

El backend realiza esta comprobación. No eliminarla para solucionar problemas del frontend. Si se cambia la regla, modificar el backend y los botones del frontend (`chatDisponible` en `frontend/src/helpers/servicios.js`) de manera coherente.

Excepción: un administrador puede leer (`GET`) el chat en cualquier estado para mediar en reclamos. Escribir sigue limitado a aceptado y en curso. La página `/chat` muestra la conversación en modo lectura en ese caso.

La conversación se actualiza por SSE y, como respaldo, por sondeo cada 3 segundos.

---

# 13. Reclamos

Archivos:

```text
backend/models/reclamo.model.js
backend/controllers/reclamo.controller.js
backend/routes/reclamo.routes.js
backend/middlewares/upload.middleware.js
frontend/src/components/reclamos/ModalReclamo.jsx          (Mis servicios)
frontend/src/components/panel/ModalReclamoPanel.jsx        (panel del prestador)
frontend/src/components/panel/SeccionReclamos.jsx
frontend/src/pages/AdminReclamos.jsx
frontend/src/helpers/reclamos.js
```

Reglas:

* Solo se reclaman servicios finalizados. Dueño y prestador pueden reclamar y el reclamo va dirigido a la otra parte.
* Un reclamo por usuario y servicio. Descripción de 10 a 2000 caracteres. Hasta 5 imágenes jpeg, png o webp de hasta 5 MB.
* El administrador no abre reclamos. Es el único que cambia el estado.
* Estados: `pendiente`, `en-revision`, `finalizado`, en ese orden. Pasar a `finalizado` exige una `resolucion` (columna `Reclamo.resolucion`) que reciben las dos partes.
* Cada alta o cambio de estado genera notificaciones para las partes (y para los administradores en el alta) y las emite por SSE.
* `POST /api/reclamos/:id/contactar` (solo administrador) envía un mensaje a una o ambas partes como notificación `reclamo-mensaje` y por correo (`plantillaMensajeAdmin`).
* El email y el teléfono de las partes solo se devuelven cuando quien consulta es administrador.

Las imágenes se guardan en `backend/uploads/reclamos` y se entregan en `/uploads/reclamos/:archivo` sin pedir sesión.

---

# 14. Notificaciones y tiempo real

Archivos:

```text
backend/models/notificacion.model.js          (tabla Notificaciones, columna userId)
backend/controllers/notificacion.controller.js
backend/helpers/realtime.helper.js
backend/routes/evento.routes.js
frontend/src/hooks/useTiempoReal.jsx
frontend/src/components/CampanaNotificaciones.jsx
frontend/src/pages/Notificaciones.jsx
frontend/src/helpers/notificaciones.js
```

* El modelo usa `userId`, `tipo`, `titulo`, `mensaje`, `reclamoId`, `servicioId` y `leida`.
* Para crear una notificación desde un controlador, usar `crearNotificacion({ usuarioId | userId, tipo, titulo, mensaje, servicioId, reclamoId })`. Guarda y emite el evento SSE. Si se insertan notificaciones con `bulkCreate`, llamar después a `emitirNotificacion(userId, notificacion)`.
* `GET /api/eventos` es un canal SSE por usuario (requiere sesión). Eventos: `conectado`, `notificacion`, `mensaje`, `ubicacion`. El frontend abre una sola conexión (`ProveedorTiempoReal` en `main.jsx`) y las pantallas se suscriben con `useEventoTiempoReal`.
* El canal vive en la memoria del proceso. Con varias instancias del backend haría falta un bus compartido.
* Las pantallas conservan un sondeo periódico como respaldo.
* Tipos de notificación: reserva, reserva-aceptada, reserva-rechazada, reserva-cancelada, mensaje, pago-confirmado, pago-fallido, pago-liberado, resena, reclamo-nuevo, reclamo-estado, reclamo-mensaje, prestador-pendiente, cuenta-aprobada, cuenta-rechazada, cuenta-reactivada, reporte-nuevo, reporte-revisado y resena-moderada. El destino de cada una al tocarla se define en `frontend/src/helpers/notificaciones.js`.

---

# 15. Panel del prestador

Archivos:

```text
frontend/src/pages/PanelPrestador.jsx          (estructura y datos)
frontend/src/components/panel/BarraPanel.jsx
frontend/src/components/panel/MenuLateralPanel.jsx
frontend/src/components/panel/Seccion*.jsx
```

Ruta: `/panel-prestador/:seccion`. Secciones:

```text
precios       SeccionPrecios       niveles, precio base y descuento por volumen
rendimiento   SeccionRendimiento   finalizados, calificación y reseñas
solicitudes   SeccionSolicitudes   aceptar o rechazar, servicios activos, ruta de hoy
trabajo       SeccionTrabajo       disponibilidad, tamaños y razas excluidas
cobros        SeccionCobros        cuenta de cobro, liquidaciones, check-in y check-out de guardería
vehiculo      SeccionVehiculo      vehículo (requerido para traslados)
chat          SeccionChat          chat unificado del servicio
reclamos      SeccionReclamos      reclamos emitidos y recibidos
perfil        SeccionPerfil        datos de la cuenta, servicios ofrecidos y verificación (TarjetaVerificacion)
```

Mientras el prestador no está aprobado, el panel muestra un aviso arriba de cada sección. La documentación se carga con `PUT /api/users/me/documentacion` (multipart) desde el registro o desde `TarjetaVerificacion`.

Este panel usa Tailwind y no Bootstrap. Al agregar una sección, crear un componente `Seccion*.jsx`, añadirlo a `MenuLateralPanel.jsx` y a `PanelPrestador.jsx`, y mantener la hoja de Tailwind limitada a estos archivos (`@source` en `tailwind.css`).

---

# 16. Administración

Backend:

```text
backend/controllers/admin.controller.js
backend/routes/admin.routes.js
backend/middlewares/admin.middleware.js
```

Frontend:

```text
frontend/src/pages/Admin.jsx
frontend/src/components/admin/TablaUsuarios.jsx
frontend/src/components/admin/TablaServiciosAdmin.jsx
frontend/src/pages/AdminReclamos.jsx
```

Archivos agregados para el panel:

```text
backend/controllers/moderacion.controller.js   reportes y moderación de reseñas
backend/models/accionAdmin.model.js            tabla AccionesAdmin (registro de acciones)
backend/models/reporte.model.js                tabla Reportes
backend/helpers/auditoria.helper.js            registrarAccion
backend/helpers/cuenta.helper.js               estados de cuenta y aprobación
backend/helpers/calificacion.helper.js         promedio con reseñas visibles
backend/helpers/metricas.helper.js             rango de fechas y resumen de reservas
backend/scripts/crearAdmin.js                  npm run crear-admin

frontend/src/pages/Admin.jsx                   estructura y navegación por secciones
frontend/src/pages/AdminReclamos.jsx           sección de reclamos
frontend/src/pages/LegajoUsuario.jsx           legajo y descarga en PDF
frontend/src/components/admin/                 secciones y ModalMotivo
frontend/src/helpers/admin.js                  secciones, textos y formatos
frontend/src/helpers/legajo.js                 PDF del legajo con jsPDF
```

Rutas: `/admin/:seccion` (resumen, prestadores, usuarios, servicios, reclamos, moderacion, auditoria) y `/admin/legajo/:id`. `/admin-reclamos` redirige a `/admin/reclamos`. Son solo para roles administrativos y el backend lo vuelve a comprobar en cada endpoint (`router.use(authMiddleware, adminMiddleware)` en `admin.routes.js`).

Reglas del panel:

* Toda decisión (cambio de rol, aprobación, rechazo, suspensión, reactivación, cancelación, estado o mensaje de reclamo, moderación de reseñas y reportes) se guarda con `registrarAccion` en `AccionesAdmin`, con el motivo cuando corresponde. Una acción nueva del panel debe hacer lo mismo y sumar su texto en `TEXTO_ACCIONES` (`frontend/src/helpers/admin.js`).
* Aprobar a un prestador exige que haya cargado documento y selfie. Al aprobar se marca `verificado = true`.
* No se puede suspender a un administrador ni quitarse a uno mismo el rol, y siempre queda al menos un administrador.
* Suspender exige motivo y, por defecto, cancela con reembolso las reservas programadas o aceptadas del usuario.
* Una reseña oculta (`Calificacion.oculta`) no se lista en `GET /api/servicios/prestador/:id/resenas` ni cuenta para `User.calificacion`. Después de moderar, recalcular con `recalcularCalificacionPrestador`.
* Los documentos de identidad están en `backend/uploads/documentos` y solo los entrega `GET /api/admin/usuarios/:id/documentos/:tipo`. No exponerlos como archivos estáticos.

---

# 17. Base de datos

`backend/app.js` registra los modelos, ejecuta una migración idempotente que agrega las columnas que falten en tablas existentes (como opcionales) y luego llama a `sequelize.sync()`. Con `DB_SYNC_ALTER` distinto de `false` y fuera de producción usa `alter: true`.

Tablas: Users, Mascotas, Servicios, Ubicacions, Pagos, Calificacions, Mensajes, Notificaciones, Reservas, Reclamos, AccionesAdmin y Reportes.

Después de sincronizar, `normalizarDatosHeredados` completa las filas creadas antes del panel: prestadores verificados como aprobados y el resto como pendientes, cuentas activas y reseñas visibles. Las columnas nuevas admiten null para que la migración no falle con datos existentes.

`Reservas` es un modelo heredado (POST /api/reservas) que el frontend no usa. El flujo real de contratación es Servicio.

---

# 18. Relación entre archivos

Para modificar el chat, revisar:

```text
backend/models/mensaje.model.js
backend/controllers/mensaje.controller.js
backend/routes/mensaje.routes.js
backend/helpers/imagen.helper.js
backend/middlewares/auth.middleware.js

frontend/src/hooks/useChat.js
frontend/src/components/chat/
frontend/src/pages/Chat.jsx
frontend/src/components/panel/SeccionChat.jsx
```

Para modificar Mis servicios y las reservas:

```text
backend/controllers/servicio.controller.js
backend/routes/servicio.routes.js
backend/helpers/precio.helper.js

frontend/src/pages/MisServicios.jsx
frontend/src/pages/BuscarPrestadores.jsx
frontend/src/components/ModalReserva.jsx
frontend/src/components/TarjetaPrestador.jsx
frontend/src/components/servicios/
```

Para modificar el panel de administración:

```text
backend/controllers/admin.controller.js
backend/controllers/moderacion.controller.js
backend/controllers/reclamo.controller.js
backend/routes/admin.routes.js
backend/helpers/cuenta.helper.js

frontend/src/pages/Admin.jsx
frontend/src/pages/AdminReclamos.jsx
frontend/src/pages/LegajoUsuario.jsx
frontend/src/components/admin/
frontend/src/helpers/admin.js
```

Para modificar el panel del prestador:

```text
frontend/src/pages/PanelPrestador.jsx
frontend/src/components/panel/
frontend/src/hooks/useServicios.js
```

---

# 19. Reglas para modificar el proyecto

Antes de crear algo nuevo:

1. Buscar si ya existe.
2. Revisar el modelo relacionado.
3. Revisar las rutas existentes.
4. Revisar los controladores.
5. Revisar la autenticación.
6. Revisar los permisos por rol.
7. Revisar si utiliza `servicioId`.
8. Revisar qué otras funcionalidades dependen de esa información.

No duplicar funcionalidades existentes.

No crear un segundo sistema de autenticación.

No crear un segundo sistema de chat.

No crear un chat separado para cada rol.

No confiar únicamente en las validaciones del frontend.

No cambiar nombres de estados sin revisar todo el flujo.

No volver a agregar carpetas de frontend o backend paralelas.

Cada ruta nueva del frontend debe declararse en `frontend/src/config/rutas.js` y en `frontend/src/App.jsx`. Cada llamada nueva a la API debe coincidir con una ruta existente del backend (método y camino).

---

# 20. Ejemplo de error que debe evitarse

Incorrecto:

```text
El dueño necesita chat
→ crear dueñoChat.jsx
→ crear /api/chat-dueno
→ crear tabla chatsDueno
```

Esto rompería la arquitectura actual.

Correcto:

```text
El dueño necesita acceder al chat
→ obtener su servicio
→ utilizar servicio.id
→ abrir /chat?servicioId=<id>
→ utilizar /api/mensajes/:servicioId
```

El mismo chat ya sirve para ambos roles.

---

# 21. Cambios recientes importantes

* Se integraron las ramas menotti-organizado y prueba-integracion en una sola estructura backend y frontend.
* El frontend heredado en HTML, la carpeta prestador-react y las demás carpetas de páginas se reescribieron en React dentro de `frontend/`.
* El panel del prestador de Maxi pasó a React con Tailwind, con las secciones de reclamos y chat de Luciana.
* Se agregaron precio por volumen, calificaciones, administración, recuperación de contraseña, SSE, limitación de intentos y los estados de pago fallido, expirado y reembolsado.
* Las notificaciones mantienen el modelo de Luciana (`userId`). Las funciones de Maxi que usaban `usuarioId` se adaptaron en `crearNotificacion`.
* La reserva admite varias mascotas y traslados con vuelta.
* Se corrigió en `cancelarServicio` una variable no definida que producía un error 500 al cancelar.
* `GET /api/servicios` informa `calificado` por servicio finalizado.
* Se creó el panel de administración por secciones: métricas por rango y tipo, aprobación de prestadores con documentación, usuarios con suspensión, legajo en PDF, servicios, reclamos con contacto y resolución, moderación de reseñas y reportes, y registro de acciones.
* Los prestadores cargan documento, selfie, CV y experiencia, y quedan pendientes hasta que un administrador los aprueba.
* Se corrigieron: la reserva heredada sin sesión, la vuelta de traslado validada después de crear la ida, la liberación del pago antes de finalizar el servicio, la superposición de paseos y traslados, el directorio público que listaba a todos los roles y la creación de mascotas por roles que no son dueño.

---

# 22. Objetivo del documento

Antes de realizar modificaciones importantes, leer este archivo completo.

La prioridad es mantener la arquitectura existente y reutilizar las funcionalidades ya implementadas.

Si una nueva funcionalidad requiere modificar servicios, usuarios, autenticación o chat, primero analizar las relaciones existentes antes de crear nuevos modelos, endpoints o sistemas paralelos.
