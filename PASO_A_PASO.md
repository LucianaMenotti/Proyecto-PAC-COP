# Paso a paso

Todos los comandos son para cmd de Windows. Se ejecutan desde la raíz del repositorio, la carpeta Proyecto-PAC-COP.

Los pasos 1 y 2 ya están hechos. Se dejan registrados.

## 1. Crear la rama

```text
git checkout menotti
git pull
git checkout -b menotti-organizado
```

La rama menotti no se toca. Todo lo siguiente ocurre en menotti-organizado.

## 2. Resguardar las imágenes

```text
xcopy assets\img "%TEMP%\img_pac_cop" /E /I /Y
```

## 3. Retirar la estructura anterior

Estas rutas están versionadas en la rama. La lista sale del resultado de git ls-files.

```text
git rm -r assets css js paginas pagos panel-prestador prestadordeServicio "seguimiento gps en tiempo real" src test
git rm index.html package.json package-lock.json .env.example
```

No se tocan README.md, CONTEXTO.md, repomix-output.xml, .env, .gitignore, uploads ni node_modules.

El README.md se reemplaza en el paso 4. El CONTEXTO.md describe la estructura anterior y queda desactualizado. Se conserva como referencia histórica.

Para quitar el node_modules de la raíz, que ya no se usa:

```text
rmdir /s /q node_modules
```

## 4. Copiar el proyecto nuevo

Descomprimir el zip en una carpeta temporal y copiar el contenido. La instrucción tar de Windows 10 o superior lee archivos zip. No se verificó en su equipo.

```text
mkdir "%TEMP%\pac_cop_nuevo"
tar -xf "%USERPROFILE%\Downloads\menotti-organizado.zip" -C "%TEMP%\pac_cop_nuevo"
xcopy "%TEMP%\pac_cop_nuevo\menotti-organizado\backend" backend /E /I /Y
xcopy "%TEMP%\pac_cop_nuevo\menotti-organizado\frontend" frontend /E /I /Y
copy /Y "%TEMP%\pac_cop_nuevo\menotti-organizado\README.md" README.md
copy /Y "%TEMP%\pac_cop_nuevo\menotti-organizado\PASO_A_PASO.md" PASO_A_PASO.md
```

Si el zip está en otra carpeta, cambiar la ruta de Downloads.

Alternativa sin zip: crear cada archivo a mano con CODIGO_COMPLETO.md, que indica la ruta exacta de cada uno. En ese caso, en backend y en frontend ejecutar antes npm init -y y copiar los package.json completos del documento.

## 5. Restaurar las imágenes

```text
xcopy "%TEMP%\img_pac_cop" frontend\public\img /E /I /Y
```

La imagen descarga (58).png debe quedar en frontend\public\img.

## 6. Mover los archivos subidos

Las evidencias de reclamos que ya existan están en la carpeta uploads de la raíz. El backend nuevo las busca en backend\uploads.

```text
move uploads backend\uploads
```

Si la carpeta uploads no existe, omitir este paso.

## 7. Configurar el entorno del backend

El .env de la raíz tiene los datos de MySQL. Se reutiliza.

```text
copy .env backend\.env
```

Abrir backend\.env y confirmar que tenga DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT y AUTH_SECRET. La clave AUTH_SECRET debe tener al menos 32 caracteres. Las demás variables están en backend\.env.example.

## 8. Instalar dependencias

```text
cd backend
npm install
cd ..\frontend
npm install
cd ..
```

## 9. Ejecutar

Terminal 1:

```text
cd backend
npm run dev
```

Terminal 2:

```text
cd frontend
npm run dev
```

Abrir http://localhost:5173.

## 10. Confirmar los cambios

```text
git add .
git status
git commit -m "reorganice el proyecto en backend y frontend"
git push -u origin menotti-organizado
```

Revisar la salida de git status antes del commit. No deben aparecer .env, node_modules ni uploads.
