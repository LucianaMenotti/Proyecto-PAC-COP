# Paso a paso

Guía para instalar y ejecutar el proyecto con la estructura integrada (carpetas backend y frontend). Los comandos son para cmd de Windows y se ejecutan desde la raíz del repositorio, la carpeta Proyecto-PAC-COP.

## 1. Requisitos

1. Node.js 20 o superior.
2. MySQL 8 o compatible en ejecución (por ejemplo desde XAMPP).
3. Git.

## 2. Obtener el código

```text
git clone https://github.com/LucianaMenotti/Proyecto-PAC-COP.git
cd Proyecto-PAC-COP
git checkout integracion-final
```

Si el repositorio ya está clonado:

```text
git fetch
git checkout integracion-final
git pull
```

Las ramas menotti-organizado y prueba-integracion no se modifican. La rama integracion-final reúne el trabajo de ambas.

## 3. Crear la base de datos

Crear una base vacía en MySQL, por ejemplo pac_cop. Las tablas las crea el backend al iniciar.

## 4. Configurar el entorno del backend

```text
copy backend\.env.example backend\.env
```

Abrir backend\.env y completar:

```text
DB_NAME=pac_cop
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_DIALECT=mysql
PORT=3000
NODE_ENV=development
DB_SYNC_ALTER=true
FRONTEND_ORIGIN=http://localhost:5173
AUTH_SECRET=una-clave-local-de-al-menos-32-caracteres
```

AUTH_SECRET debe tener al menos 32 caracteres. Las variables opcionales de correo (SMTP_) y de enlace de recuperación (FRONTEND_URL, PASSWORD_RESET_PATH) están explicadas en el README. Sin SMTP, el enlace de recuperación de contraseña se imprime en la consola del backend.

El archivo .env no se sube al repositorio.

## 5. Instalar dependencias

```text
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

## 6. Ejecutar

Terminal 1:

```text
cd backend
npm run dev
```

Debe aparecer el mensaje de conexión con MySQL y el servidor en http://localhost:3000. Si no se conecta, el backend muestra el motivo y se detiene.

Terminal 2:

```text
cd frontend
npm run dev
```

Abrir http://localhost:5173.

## 7. Verificar

Pruebas del backend:

```text
cd backend
npm test
```

Compilación del frontend:

```text
cd frontend
npm run build
```

Recorrido manual sugerido:

1. Registrar un dueño con una mascota y un prestador con sus servicios.
2. Como prestador, cargar precios en el panel.
3. Como dueño, buscar al prestador, reservar y pagar. Una tarjeta que termina en 0000 simula un rechazo.
4. Como prestador, aceptar la solicitud, abrir el chat e iniciar el seguimiento.
5. Finalizar el servicio y, como dueño, calificarlo o abrir un reclamo.
6. Para probar la administración, el registro no permite crear administradores. Cambiar a mano la columna rol de un usuario a admin en la tabla Users de MySQL y revisar /admin y /admin-reclamos.

## 8. Antes de confirmar cambios

```text
git status
```

No deben aparecer .env, node_modules, dist ni uploads. Pueden aparecer avisos de fin de línea (LF y CRLF), que son inofensivos.
