# RatingMovies

Catálogo público de películas y series vistas, con valoraciones personales y administración privada.

## Desarrollo local

Requiere Node.js 22.23.4 o superior en una versión par soportada por Astro y npm 9.6.5 o superior.

```sh
npm ci
npm run dev
```

El servidor de desarrollo utiliza `http://127.0.0.1:4321` por defecto.

| Comando | Función |
| --- | --- |
| `npm run dev` | Inicia el servidor local de Astro. |
| `npm run check` | Comprueba los tipos y los archivos Astro. |
| `npm run build` | Comprueba los tipos y genera las funciones de servidor para Vercel. |
| `npm test` | Ejecuta las pruebas de validación, seguridad y metadatos. |

## Configuración local

Copiar `.env.example` a `.env.local` y completar los valores de la app web de Firebase, `FIREBASE_PROJECT_ID` y el UID de la única cuenta administradora en `FIREBASE_ADMIN_UID`. Mantener el JSON de la cuenta de servicio fuera del repositorio y apuntar `GOOGLE_APPLICATION_CREDENTIALS` a su ruta absoluta. `.env.local` está excluido de Git.

Habilitar correo/contraseña en Firebase Authentication y crear la cuenta desde la consola. No hay registro público. Firestore debe usar edición Standard y modo producción, con lecturas y escrituras de clientes denegadas; el backend accede mediante Firebase Admin y verifica sesión y UID para cada operación privada.

Para buscar obras, configurar `TMDB_READ_ACCESS_TOKEN` (recomendado) o `TMDB_API_KEY`, siempre sin prefijo `PUBLIC_`. La búsqueda y el detalle pasan por rutas privadas del servidor. Seleccionar una obra completa metadatos e imágenes y conserva valoración, fecha, plataforma y nota personal. Si TMDB no informa año o duración, se completan manualmente. La duración de series corresponde a un episodio, no a toda la serie.

## Estado funcional

El catálogo y el inicio consultan Firestore en cada solicitud. El acceso usa Firebase Authentication y una cookie de sesión HttpOnly; cada sesión tiene un registro privado en `_sessions`, y el logout lo elimina para impedir reutilizar la cookie sin cerrar otras sesiones. Las sesiones duran cinco días y se verifican también contra revocación y deshabilitación de la cuenta. Los registros de sesiones vencidas pueden eliminarse de `_sessions`; su fecha de vencimiento no habilita eliminación automática ni servicios con costo.

| Ruta | Función |
| --- | --- |
| `/`, `/catalogo` | Inicio y catálogo públicos, con datos reales y estado vacío. |
| `/titulos/:id` | Ficha pública de un registro guardado. |
| `/ingresar` | Login con correo y contraseña. |
| `/administrar` | Listado privado. |
| `/administrar/nuevo` | Buscar en TMDB o completar una ficha manualmente y guardarla. |
| `/administrar/:id` | Editar y eliminar con confirmación. |
| `/diseno/formulario` | Boceto archivado, con datos de ejemplo y guardado deshabilitado. |

Las operaciones privadas validan origen, token CSRF, sesión, UID y datos en el servidor. Las páginas personalizadas y las respuestas privadas usan `Cache-Control: private, no-store`. Las notas aceptan texto, sin interpretar HTML. Las imágenes son URL HTTPS o recursos locales permitidos; no se descargan desde el backend. La carga de archivos propios sigue pendiente de habilitar Cloud Storage y su facturación. Analytics no se inicializa.

## Verificación

`npm test` comprueba validación, fechas, valoraciones enteras, URLs de imagen, límites de solicitudes, CSRF y transformación de datos de TMDB. `npm run build` ejecuta la comprobación de tipos y genera las funciones de Vercel.

La dependencia `jose` de `jwks-rsa` está fijada a 5.10.0 para evitar el error `ERR_REQUIRE_ESM` del cargador de funciones de Vercel. Las pruebas cubren el arranque sin `require(ESM)` y la conversión y verificación de claves RSA. Ver el [reporte de Firebase](https://github.com/firebase/firebase-admin-node/issues/3181).

La prueba de integración es explícita y usa los servicios reales: con el servidor local activo, ejecutar en PowerShell `$env:RUN_FIREBASE_INTEGRATION='1'` y después `node scripts/verify-firebase.mjs`. Crea un usuario no administrador y un título temporal identificados como prueba, verifica permisos, TMDB, persistencia y logout, y retira sus registros al terminar. No pide ni cambia la contraseña del propietario.

## Despliegue en Vercel

Configurar las variables públicas de Firebase, `FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_UID`, `TMDB_READ_ACCESS_TOKEN` y `FIREBASE_SERVICE_ACCOUNT_JSON` en el entorno de destino. Esta última contiene el JSON de la cuenta de servicio como secreto en una sola línea. No configurar la ruta local `GOOGLE_APPLICATION_CREDENTIALS` en Vercel. Las credenciales privadas se leen en tiempo de ejecución; no se incluyen en los archivos del navegador.

El adaptador oficial sirve las rutas desde funciones de servidor. `vercel.json` selecciona São Paulo (`gru1`) para acompañar a Firestore en `southamerica-east1`. Agregar los dominios de la aplicación que correspondan en Firebase Authentication. Estos cambios están preparados localmente; configurar variables y publicar la versión funcional es un paso separado.

## Recursos de demostración

El diseño conserva el inicio inmersivo con controles y reproducción opcional, filtros por tipo, catálogo con búsqueda y fichas de detalle.

Los tres registros de `src/data/demo.ts` son ejemplos usados solo por los recursos de diseño; no se importan a Firestore ni se presentan como historial del propietario. Sus imágenes tienen las fuentes en `public/credits.json` y las fuentes tipográficas se sirven desde el proyecto con sus licencias.

La web conserva `noindex` mientras se revisa esta integración. Las credenciales no deben publicarse en el repositorio.
