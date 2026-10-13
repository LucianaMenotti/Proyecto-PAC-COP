# CONTEXTO TÉCNICO — PAC-COP

Este documento contiene el contexto técnico que debe conocer cualquier persona o asistente de IA antes de modificar el proyecto PAC-COP.

Su objetivo es evitar duplicar funcionalidades existentes, romper relaciones entre módulos o implementar soluciones incompatibles con la arquitectura actual.

---

# 1. Tecnologías

Backend:

* Node.js.
* Express.
* Sequelize.
* MySQL.
* ES Modules.
* Cookies `httpOnly`.
* `scrypt` para contraseñas.

Frontend:

* HTML.
* CSS.
* JavaScript.
* Bootstrap en varias páginas.

El frontend y backend se sirven desde el mismo servidor Express.

Servidor:

```text
http://localhost:3000
```

---

# 2. Autenticación

La autenticación está centralizada.

Frontend:

```text
js/auth.js
```

Backend:

```text
src/middlewares/auth.middleware.js
src/helpers/auth.helper.js
```

La sesión utiliza la cookie:

```text
pac_cop_session
```

Para obtener la sesión desde el frontend:

```js
const usuario = await window.PacCopAuth.getCurrentSession();
```

Para proteger una página:

```js
const usuario = await window.PacCopAuth.requireSession();
```

Para restringir por rol:

```js
const usuario = await window.PacCopAuth.requireSession(["prestador"]);
```

o:

```js
const usuario = await window.PacCopAuth.requireSession(["dueño"]);
```

No crear otro sistema de login o sesión.

El backend siempre debe verificar los permisos. El frontend no es suficiente para proteger recursos.

---

# 3. Roles

Los roles actuales son:

```text
dueño
prestador
admin
administrador
```

Los roles `admin` y `administrador` se consideran administrativos en las validaciones existentes.

No cambiar los nombres de los roles sin revisar todas las partes del proyecto.

---

# 4. Servicio como entidad central

El concepto más importante para conectar las funcionalidades del proyecto es el **servicio**.

Un servicio relaciona:

```text
Dueño
  │
  ├── Mascota
  │
  ├── Prestador
  │
  ├── Pago
  │
  ├── Ubicación GPS
  │
  └── Chat
```

Por esto, el `servicioId` es muy importante.

Si se modifica la estructura o el flujo de servicios, hay que revisar las funcionalidades que dependen de él.

---

# 5. Modelo Servicio

Archivo:

```text
src/models/servicio.model.js
```

Campos principales:

```text
id
ownerId
providerId
mascotaId
prestadorNombre
tipo
mascotaNombre
monto
estado
horaProgramada
iniciadoEn
finalizadoEn
```

Estados utilizados actualmente:

```text
programado
aceptado
en-curso
finalizado
rechazado
```

No cambiar estos valores solamente en el frontend.

Si se modifica un estado, revisar:

* Controladores.
* Panel del prestador.
* Servicios activos.
* Mis servicios.
* Chat.
* Inicio y finalización.
* Cualquier condición que compare `estado`.

---

# 6. Servicios según el rol

Archivo principal:

```text
src/controllers/servicio.controller.js
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

---

# 7. Mis servicios

Archivos:

```text
paginas/mis-servicios.html
js/mis-servicios.js
```

La pantalla pertenece al dueño.

Obtiene los servicios mediante:

```text
GET /api/servicios
```

Muestra:

```text
Tipo
Mascota
Prestador
Fecha
Monto
Estado
```

El botón de chat solamente se muestra cuando:

```text
estado === "aceptado"
```

o:

```text
estado === "en-curso"
```

El enlace generado es:

```text
../prestadordeServicio/chatApp.html?servicioId=<id>
```

No crear un chat nuevo específico para el dueño.

---

# 8. Arquitectura del chat

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
prestadordeServicio/chatApp.html?servicioId=2
```

No deben existir:

```text
chat del dueño
chat del prestador
```

como conversaciones separadas.

---

# 9. Archivos del chat

Frontend:

```text
prestadordeServicio/chatApp.html
prestadordeServicio/chatApp.js
prestadordeServicio/chat.js
prestadordeServicio/camara.js
prestadordeServicio/reportes.js
```

Autenticación:

```text
js/auth.js
```

Backend:

```text
src/models/mensaje.model.js
src/controllers/mensaje.controller.js
src/routes/mensaje.routes.js
```

---

# 10. Modelo Mensaje

Archivo:

```text
src/models/mensaje.model.js
```

Campos:

```text
id
servicioId
remitenteId
texto
creadoEn
```

Relaciones:

```text
Mensaje → Servicio
Mensaje → User
```

Cada mensaje pertenece a un servicio y tiene un remitente.

El `remitenteId` debe obtenerse desde la sesión autenticada en el backend.

No confiar en un `remitenteId` enviado por el frontend.

---

# 11. Endpoints del chat

Rutas:

```text
GET  /api/mensajes/:servicioId
POST /api/mensajes/:servicioId
```

Enviar un mensaje:

```json
{
    "texto": "Hola"
}
```

El backend crea el mensaje utilizando:

```text
servicioId
req.user.id
texto
```

---

# 12. Permisos del chat

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

El backend realiza esta comprobación.

No eliminar esta validación para solucionar problemas del frontend.

---

# 13. Estados que permiten utilizar el chat

Actualmente el chat solamente permite acceso cuando el servicio está:

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

Si se cambia esta regla, modificar el backend y los botones del frontend de manera coherente.

---

# 14. Flujo completo del chat

Flujo actual:

```text
Dueño
  ↓
Busca prestador
  ↓
Solicita servicio
  ↓
Servicio = programado
  ↓
Prestador recibe solicitud
  ↓
Prestador acepta
  ↓
Servicio = aceptado
  ↓
Dueño entra a Mis servicios
  ↓
Aparece "Abrir chat"
  ↓
chatApp.html?servicioId=X
  ↓
GET /api/mensajes/X
  ↓
Dueño envía mensaje
  ↓
POST /api/mensajes/X
  ↓
Mensaje guardado en MySQL
  ↓
Prestador abre el mismo servicio
  ↓
Accede al mismo chat
  ↓
Puede leer y responder
```

El chat ya fue probado con dueño y prestador utilizando el mismo servicio.

---

# 15. Actualización del chat

El frontend consulta periódicamente:

```text
GET /api/mensajes/:servicioId
```

Esto permite actualizar la conversación sin crear un sistema de WebSockets.

No implementar WebSockets solamente para solucionar la actualización de mensajes si no es necesario para el requerimiento actual.

---

# 16. Panel del prestador

El panel fue dividido para evitar que toda la lógica esté en un único archivo.

Archivos:

```text
js/panel-prestador.js
js/panel-rendimiento.js
js/panel-servicios.js
js/panel-solicitudes.js
js/panel-activos.js
```

Responsabilidades:

```text
panel-prestador.js
→ inicialización general y sesión

panel-rendimiento.js
→ rendimiento

panel-servicios.js
→ servicios ofrecidos

panel-solicitudes.js
→ solicitudes recibidas

panel-activos.js
→ servicios activos y acceso al chat
```

No volver a concentrar toda la lógica en `panel-prestador.js` sin una razón clara.

---

# 17. Servicios activos

Archivo:

```text
js/panel-activos.js
```

Los servicios activos permiten al prestador acceder al chat mediante:

```text
../prestadordeServicio/chatApp.html?servicioId=<id>
```

Ese enlace debe utilizar el `id` real del servicio.

No crear identificadores de chat independientes.

---

# 18. Relación entre archivos

Para modificar el chat, revisar:

```text
src/models/mensaje.model.js
src/controllers/mensaje.controller.js
src/routes/mensaje.routes.js
src/middlewares/auth.middleware.js

js/auth.js

prestadordeServicio/chatApp.html
prestadordeServicio/chatApp.js
prestadordeServicio/chat.js
```

Para modificar Mis servicios:

```text
paginas/mis-servicios.html
js/mis-servicios.js
src/controllers/servicio.controller.js
src/routes/servicio.routes.js
```

Para modificar el panel del prestador:

```text
paginas/panel-prestador.html

js/panel-prestador.js
js/panel-rendimiento.js
js/panel-servicios.js
js/panel-solicitudes.js
js/panel-activos.js
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

---

# 20. Ejemplo de error que debe evitarse

Incorrecto:

```text
El dueño necesita chat
→ crear dueñoChat.js
→ crear /api/chat-dueno
→ crear tabla chatsDueno
```

Esto rompería la arquitectura actual.

Correcto:

```text
El dueño necesita acceder al chat
→ obtener su servicio
→ utilizar servicio.id
→ abrir chatApp.html?servicioId=<id>
→ utilizar /api/mensajes/:servicioId
```

El mismo chat ya sirve para ambos roles.

---

# 21. Cambios recientes importantes

La arquitectura actual incluye estos cambios:

* Se agregó `Mis servicios` para el dueño.
* El dueño puede consultar sus servicios mediante `GET /api/servicios`.
* El dueño puede acceder al chat de un servicio aceptado o en curso.
* El prestador continúa utilizando el mismo chat desde sus servicios activos.
* Se verificó el funcionamiento del envío de mensajes desde el dueño.
* Los mensajes se almacenan correctamente en MySQL.
* El chat utiliza autenticación mediante la sesión existente.
* Se separó la lógica del panel del prestador en varios módulos.
* Se actualizó la página de inicio para incluir el acceso a `Mis servicios`.

---

# 22. Objetivo del documento

Antes de realizar modificaciones importantes, leer este archivo completo.

La prioridad es mantener la arquitectura existente y reutilizar las funcionalidades ya implementadas.

Si una nueva funcionalidad requiere modificar servicios, usuarios, autenticación o chat, primero analizar las relaciones existentes antes de crear nuevos modelos, endpoints o sistemas paralelos.
