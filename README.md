# PAC-COP

Aplicación web para gestionar usuarios, mascotas, fichas de salud y servicios para mascotas.

## Requisitos

- Node.js 20 o superior.
- MySQL 8 o superior.
- XAMPP u otro servidor local para iniciar MySQL.

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Crear `.env` en la raíz copiando `.env.example`.

3. Completar las variables:

```text
DB_NAME=pac_cop
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_DIALECT=mysql
PORT=3000
FRONTEND_ORIGIN=http://localhost:3000
AUTH_SECRET=una-clave-local-de-al-menos-32-caracteres
```

`AUTH_SECRET` debe ser privada y tener al menos 32 caracteres. No subir `.env` al repositorio.

## Ejecución

Iniciar MySQL y después ejecutar:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

`npm run dev` es el comando recomendado durante el desarrollo porque reinicia el backend cuando se modifica un archivo. `npm start` también está disponible para ejecutar el servidor sin reinicio automático.

El servidor no se inicia si no puede conectarse a MySQL. En desarrollo crea las tablas y actualiza automáticamente las columnas faltantes con Sequelize. En producción no modifica la estructura existente.

La actualización automática se controla con `DB_SYNC_ALTER`. Para desarrollo debe permanecer en `true` (o puede omitirse, porque ese es el valor predeterminado). Si se establece en `false`, el backend solo sincroniza las tablas sin alterar columnas. En producción la actualización automática se desactiva siempre.

## Autenticación

El registro y el login usan una cookie `httpOnly` llamada `pac_cop_session`. Las contraseñas se almacenan mediante un hash con `scrypt` y nunca se devuelven en las respuestas.

Endpoints principales:

```text
POST /api/users
POST /api/users/login
POST /api/users/logout
GET  /api/users/me
GET  /api/users
POST /api/mascotas
GET  /api/mascotas/usuario/:userId
GET  /api/mascotas/:id
PUT  /api/mascotas/:id
```

Las rutas de mascotas requieren sesión y verifican que la mascota pertenezca al usuario autenticado.

## Pruebas

Ejecutar las pruebas unitarias disponibles con:

```bash
npm test
```

También conviene probar manualmente el registro, login, cierre de sesión, creación de mascota y actualización de la ficha de salud.

## Trabajo agregado

Resumen de lo incorporado en la rama `primera-integracion` (de `23c3a74` a `94bac74`): qué se hizo, por qué y cómo levantarlo.

### Qué se hizo y por qué

| Qué | Por qué |
|-----|---------|
| Fase previa: paginación, filtros y rate limiting en la API, código muerto eliminado, enlaces y versión de Bootstrap corregidos, estilos centralizados en `css/styles.css` con tokens de color y tipografía compartidos. | Ordenar la base antes de sumar funcionalidades y evitar estilos repetidos en cada página. |
| Notificaciones persistentes (API + emisión en eventos + campana global). | Que las reservas, mensajes y pagos queden registrados aunque el usuario no esté mirando la pantalla. |
| Tiempo real con SSE para notificaciones, mensajes de chat y ubicación. | Actualizar la interfaz sin recargar la página. |
| Recuperación de contraseña: token de un solo uso de 30 minutos guardado como hash SHA-256, envío por correo con nodemailer y límite de intentos. | Permitir recuperar el acceso sin exponer la contraseña ni dejar el token en claro en la base. |
| Panel de administración con métricas, gestión de usuarios y moderación de servicios. | Control del sitio desde un rol administrador. |
| Estados de pago fallido y expirado, con reintento y avisos en la interfaz. | Cubrir los casos en que el pago no se completa. |
| Unificación de diseño en todas las páginas y en el panel del prestador (paleta, tipografía, botones y encabezados). | Que todo el sitio se vea como un solo producto. |
| Una sola campana de notificaciones, vinculada a la pestaña de solicitudes del prestador. | Se había duplicado la campana entre el navbar y el panel. |
| Correo de recuperación rediseñado: asunto, texto plano y plantilla HTML con la identidad del sitio. | Mensaje claro y consistente con el resto de la plataforma. |

### Pasos para levantarlo

1. Instalar dependencias: `npm install`.
2. Crear `.env` copiando `.env.example` y completar las variables (ver secciones anteriores).
3. Iniciar MySQL y ejecutar `npm run dev`.
4. Abrir [http://localhost:3000](http://localhost:3000).
5. Correr las pruebas con `npm test`.

### Envío de correos (opcional)

Sin credenciales SMTP el sistema no envía correos: el enlace de recuperación se imprime solo en la consola del backend. Para envío real completar en `.env`:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=casilla-de-envio@gmail.com
SMTP_PASS=contraseña-de-aplicacion-de-16-caracteres
```

`SMTP_USER` es la única casilla que **envía** los correos; los mensajes llegan a la casilla de cada usuario registrado. La contraseña no es la normal de Google: se genera en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requiere verificación en dos pasos activada). Guardado el archivo hay que reiniciar el backend.

### Prueba manual del flujo de recuperación

1. Abrir `http://localhost:3000/paginas/recuperar.html` (siempre por el servidor, no abriendo el archivo con doble clic) e ingresar un correo registrado.
2. Tomar el enlace desde el correo recibido o, si no hay SMTP, desde la consola del backend.
3. Abrir el enlace e ingresar la contraseña nueva.
4. Iniciar sesión con la contraseña nueva.

### Detalles a tener en cuenta

- Límites por IP cada 15 minutos: registro 30, login 60, recuperación y restablecimiento 10.
- El enlace de recuperación vence a los 30 minutos y sirve una sola vez.
- `.env` no se sube al repositorio.

## Estructura

```text
assets/       recursos visuales
css/          estilos
js/           lógica del frontend
paginas/      páginas HTML
src/config/   conexión a MySQL
src/models/   modelos Sequelize
src/routes/   rutas HTTP
src/controllers/ controladores
src/helpers/  contraseñas, sesiones, envío de correo y plantillas
src/middlewares/ autenticación y validaciones
test/         pruebas automatizadas
```
