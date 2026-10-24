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
| `npm run build` | Comprueba los tipos y genera la versión estática en `dist/`. |
| `npm run preview` | Permite revisar localmente la versión generada. |

## Estado del proyecto

Prototipo local en Astro y TypeScript con diseño adaptable a escritorio y celular. Incluye un inicio inmersivo con controles y reproducción opcional, filtros por tipo, catálogo con búsqueda y fichas de detalle.

Los tres títulos, las notas personales, las fechas y las plataformas se muestran como datos de ejemplo; no representan el historial del propietario. Las imágenes tienen sus fuentes en `public/credits.json` y las fuentes tipográficas se sirven desde el proyecto con sus licencias.

| Ruta | Estado |
| --- | --- |
| `/` | Secuencia inmersiva de ejemplo con navegación y filtros. |
| `/catalogo` | Catálogo con búsqueda, filtros y estado sin resultados. |
| `/titulos/dune`, `/titulos/interstellar`, `/titulos/severance` | Fichas de ejemplo. |
| `/ingresar` | Composición de acceso; campos deshabilitados, sin recibir credenciales. |
| `/diseno/formulario` | Composición de alta; campos y guardado deshabilitados. |
| `/acerca` | Contexto del prototipo y créditos de TMDB. |

La integración con la API de TMDB, la autenticación y la persistencia en Google Cloud se incorporan en las siguientes etapas. La base utiliza salida estática; las operaciones de administración requerirán rutas de servidor y el adaptador de Vercel antes de su despliegue funcional. El prototipo lleva `noindex` para evitar indexar los ejemplos como un catálogo real.

Las credenciales futuras se guardarán en variables de entorno privadas y no deben publicarse en el repositorio.
