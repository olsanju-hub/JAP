# JAP - Jornadas Docentes de Atención Primaria

PWA en HTML, CSS y JavaScript vanilla para publicar el programa anual 2026-2027 de sesiones clínicas de Atención Primaria.

## URLs

- App pública: `https://olsanju-hub.github.io/JAP/`
- Repositorio: `https://github.com/olsanju-hub/JAP`
- Admin: `https://olsanju-hub.github.io/JAP/admin.html`

## Stack

- HTML, CSS y JavaScript vanilla
- PWA básica con `manifest.webmanifest` y `sw.js`
- `data/jap.json` como fuente local de respaldo
- Supabase opcional para datos dinámicos y panel administrativo
- Sin React, Next.js, Vue ni frameworks

## Estructura

```text
index.html
admin.html
styles.css
admin.css
app.js
admin.js
supabase-client.js
config.example.js
manifest.webmanifest
sw.js
data/jap.json
supabase/schema.sql
supabase/seed.sql
supabase/migration-site-content.sql
supabase/migration-security-backup.sql
supabase/migration-session-speakers.sql
supabase/config.toml
supabase/migrations/
assets/img/
assets/docs/
assets/icons/
```

## Desarrollo local

Servir la carpeta con un servidor local:

```bash
python3 -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

Panel administrativo:

```text
http://localhost:8000/admin.html
```

## Navegación pública

La app pública usa vistas internas en un único `index.html`. Solo una vista principal está visible cada vez:

- `#inicio`
- `#agenda`
- `#sesiones`
- `#ponentes`
- `#recursos`
- `#contacto`

Puedes probar una vista directamente con `http://localhost:8000#agenda` o `http://localhost:8000#recursos`. El menú cambia la vista activa, actualiza el hash y vuelve arriba.

## Datos

La app intenta cargar Supabase si existe `config.js` con credenciales válidas. Si no existe, o si Supabase falla, usa `data/jap.json`.

`data/jap.json` mantiene esta estructura:

- `programa`
- `metodologia`
- `objetivos`
- `sesiones`
- `ponentes`
- `recursos`
- `sedes`
- `contacto`
- `siteContent`

Los campos no confirmados deben mantenerse como `Pendiente de confirmar`. No añadas fechas, sedes, ponentes, biografías ni datos clínicos que no estén confirmados.

El documento interno de propuesta no se publica para asistentes y no debe añadirse a `recursos`.

Cuando Supabase responde correctamente, sustituye a `data/jap.json`. El JSON local queda como fallback si Supabase no está configurado o falla la conexión. La consola indica `Datos cargados desde Supabase` o `Datos cargados desde JSON local por fallback`.

## Editar `data/jap.json`

Validar el JSON:

```bash
python3 -m json.tool data/jap.json >/dev/null
```

Añadir una sesión:

1. Guarda el cartel en `assets/img/`.
2. Añade un objeto a `sesiones` con `id`, `slug`, `titulo`, `bloque`, `descripcion`, `objetivo`, `contenidos_clave`, `fecha`, `hora_inicio`, `hora_fin`, `sede`, `ponentes`, `imagen`, `recursos` y `estado`.
3. Si el cartel debe aparecer en Recursos, añade un objeto en `recursos` con `tipo: "cartel"` y la ruta del archivo.

Añadir un recurso:

```json
{
  "id": "identificador-limpio",
  "titulo": "Título visible",
  "tipo": "documento",
  "formato": "PDF",
  "archivo": "assets/docs/archivo.pdf"
}
```

Tipos recomendados en JSON: `documento`, `presentacion`, `cartel`, `imagen`, `enlace` u `otro`.

## Recursos

Los recursos se abren en un modal interno:

- PDF: previsualización en `iframe` cuando el navegador lo permite.
- Imagen o cartel: imagen ajustada al modal.
- PPTX: ficha del recurso y descarga.
- Enlace externo: ficha del recurso y botón para abrir.
- Otros formatos: ficha y descarga/enlace.

El modal se cierra con el botón Cerrar, tecla Escape o clic exterior.

## Supabase

El proyecto mantiene los SQL originales y una carpeta de migraciones versionadas para Supabase CLI:

```text
supabase/migrations/
20260531090000_initial_schema.sql
20260531091000_seed_initial_data.sql
20260601090000_site_content.sql
20260601100000_security_backup.sql
20260601110000_session_speakers.sql
20260601120000_session_editorial_states.sql
20260601130000_session_teaching_fields.sql
```

Para una instalación manual desde SQL Editor:

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` en el SQL Editor.
3. Ejecuta `supabase/seed.sql` para cargar el contenido inicial.
4. Ejecuta `supabase/migration-site-content.sql` si el proyecto ya existía antes de la edición de textos globales.
5. Ejecuta `supabase/migration-security-backup.sql` para reforzar permisos de lectura/escritura y retirar borrado físico en tablas de contenido.
6. Ejecuta `supabase/migration-session-speakers.sql` para añadir roles de personas y habilitar la asociación de ponentes a sesiones.
7. Crea un usuario en Authentication.
8. Asigna permisos al usuario desde SQL:

```sql
update public.profiles
set role = 'admin'
where email = 'tu-email@dominio.com';
```

Roles disponibles:

- `admin`: puede gestionar contenido, textos globales, copias de seguridad y roles.
- `editor`: puede crear, editar, borrar lógico, restaurar y exportar copias de seguridad de contenido.
- `lector`: usuario autenticado sin permisos de creación, edición, borrado, restauración ni backup.
- Anónimo: lectura pública solo de datos publicados/visibles; sin permisos de escritura.

## Flujo de migraciones con Supabase CLI

Usa este flujo para cambios de base de datos nuevos. No subas contraseñas, tokens, cadenas de conexión ni `.env` al repositorio.

### Instalar e iniciar sesión

Instala Supabase CLI según tu sistema. En macOS con Homebrew:

```bash
brew install supabase/tap/supabase
```

Inicia sesión:

```bash
supabase login
```

El token queda gestionado por la CLI en tu equipo, no en el repositorio.

### Inicializar o revisar configuración

Desde la raíz del proyecto:

```bash
cd /Users/olsanju/Desktop/JAP
```

Si no existiera `supabase/config.toml`, ejecuta:

```bash
supabase init
```

En este repo ya existe `supabase/config.toml`; no lo sobrescribas sin revisar el diff.

### Vincular el proyecto remoto

```bash
supabase link --project-ref oyyqxkrfaoogzfplrrbt
```

La CLI puede pedir la contraseña de la base de datos. No la guardes en README, `.env`, commits ni capturas.

### Sincronizar historial ya aplicado manualmente

Las migraciones iniciales de JAP se ejecutaron primero desde Supabase SQL Editor. Antes de aplicar nada con CLI, revisa el estado remoto:

```bash
supabase migration list
```

Si la CLI no reconoce como aplicadas migraciones que ya ejecutaste manualmente, no hagas `db push` todavía. Marca esas versiones como reparadas/aplicadas en el historial remoto, una por una:

```bash
supabase migration repair --status applied 20260531090000
supabase migration repair --status applied 20260531091000
supabase migration repair --status applied 20260601090000
supabase migration repair --status applied 20260601100000
supabase migration repair --status applied 20260601110000
```

Si la CLI exige nombres completos por existir varias migraciones con la misma fecha, usa las versiones exactas que muestre `supabase migration list` para estos archivos:

- `20260531090000_initial_schema.sql`
- `20260531091000_seed_initial_data.sql`
- `20260601090000_site_content.sql`
- `20260601100000_security_backup.sql`
- `20260601110000_session_speakers.sql`

No marques como aplicada una migración nueva que todavía no se ha ejecutado, por ejemplo `20260601130000_session_teaching_fields.sql`.

Después vuelve a comprobar:

```bash
supabase migration list
```

### Crear una nueva migración

Para futuros cambios:

```bash
supabase migration new nombre_descriptivo
```

Edita el SQL generado en `supabase/migrations/`. Revisa que sea idempotente cuando proceda y que no incluya secretos.

Antes de aplicar:

```bash
supabase migration list
supabase db push --dry-run
```

Aplica solo si el dry-run es el esperado:

```bash
supabase db push
```

### Qué no hacer a ciegas

No ejecutes directamente estos comandos en producción sin revisar `migration list` y `--dry-run`:

```bash
supabase db push
supabase db reset
supabase db remote commit
```

`supabase db reset` es para base local y puede destruir datos locales. No lo uses contra producción.

### Alternativa de emergencia

El SQL Editor manual sigue siendo aceptable para una corrección urgente y controlada. Si se usa, crea después una migración equivalente en `supabase/migrations/` y sincroniza el historial para que el repo vuelva a ser la fuente versionada.

## Configuración local de Supabase

Para activar Supabase, crea o rellena `config.js` a partir de `config.example.js`:

```js
window.JAP_SUPABASE_CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};

export default window.JAP_SUPABASE_CONFIG;
```

Usa solo la publishable/anon key pública en `config.js`. No uses ni publiques `service_role`.

## Panel Administrativo

Abrir `http://localhost:8000/admin.html`.

En la app pública, el acceso `Admin` está solo en el footer. Dentro de `admin.html`, el botón `Volver al inicio` vuelve a `index.html#inicio` sin cerrar sesión.

Funciones disponibles:

- Login/logout con Supabase Auth.
- Listado, creación y edición de sesiones con botón `Nueva sesión`.
- Asociación de uno o varios ponentes a cada sesión desde el bloque `Ponentes de la sesión`.
- Edición de información docente por sesión: objetivos docentes, metodología, materiales, revisión y bibliografía.
- Slug autogenerado desde el título si se deja vacío.
- Nueva sesión con `estado = 'publicada'`, `is_active = true`, jornada principal, modalidad Teams y siguiente orden disponible.
- Cambio de estado: `borrador`, `publicada`, `realizada`, `archivada`.
- Activar/desactivar sesiones y personas.
- Listado, creación y edición de personas con botón `Nuevo ponente`.
- Tipo de participación de cada persona: `organizador`, `ponente` o `apoyo`.
- Listado, creación y edición de recursos con botón `Nuevo recurso`.
- Asociación de recursos a sesiones.
- Ocultar recursos con `visible = false`.
- Borrado lógico y restauración de sesiones, ponentes y recursos.
- Archivado de sesiones con `estado = 'archivada'`.
- Eliminación definitiva de sesiones solo para `admin`, con confirmación escribiendo `ELIMINAR` y bloqueo si la sesión tiene ponentes o recursos asociados.
- Exportación de copia de seguridad JSON para usuarios `admin` y `editor`.

La acción principal para retirar contenido es ocultar/desactivar, no eliminar definitivamente. Para retirar contenido, el panel usa `is_active = false`, `estado = 'archivada'` o `visible = false`.

En `sesion_ponentes` sí se usa `DELETE` físico para quitar una relación entre una sesión y una persona. No elimina la sesión ni la persona; solo elimina la asociación.

Para que un elemento aparezca en la app pública desde Supabase:

- Sesión activa: `estado = 'publicada'` e `is_active = true`.
- Sesión realizada/histórico: `estado = 'realizada'` e `is_active = true`.
- Sesión oculta: `estado = 'borrador'`, `estado = 'archivada'` o `is_active = false`.
- Persona/equipo: `is_active = true`.
- Recurso: `visible = true`, con URL válida y sin apuntar a `propuesta-jornadas-docentes-ap.pdf`.

### Estados editoriales de sesiones

Estados permitidos:

- `borrador`: no aparece públicamente.
- `publicada`: aparece en Agenda y Sesiones.
- `realizada`: aparece en Sesiones como histórico con etiqueta `Realizada`.
- `archivada`: no aparece públicamente.

`is_active` se mantiene como borrado lógico general. Si `is_active = false`, la sesión no aparece aunque esté `publicada` o `realizada`.

Antes de ejecutar una eliminación definitiva de una sesión real, exporta una copia de seguridad. La eliminación definitiva no se puede deshacer salvo restaurando backup.

### Información docente y bibliografía

Cada sesión puede guardar campos docentes estructurados:

- `objetivos_docentes`
- `metodologia`
- `bibliografia`
- `responsable_revision`
- `fecha_revision`
- `material_previo`
- `material_posterior`
- `observaciones_internas`

La bibliografía se introduce como texto libre en el admin. Puede incluir referencias Vancouver, texto institucional y URLs. En la app pública se muestra solo si tiene contenido, conserva saltos de línea y enlaza URLs. `observaciones_internas` no se muestra públicamente.

### Equipo docente y ponentes por sesión

La tabla `ponentes` funciona como tabla de personas. El campo `rol_persona` distingue:

- `organizador`: organización y coordinación.
- `ponente`: ponente de sesión.
- `apoyo`: apoyo docente o colaborador.

El equipo organizador inicial está formado por:

- Guillermo José Olivero Sanjuanelo
- Julio Fernando Ospino Arias
- Kelly Esther Escorcia Reyes
- Valenska Vania Arellano Flores
- Jorvi José Aguilar Valero

Las cinco personas figuran como residentes de 4.º año de Medicina Familiar y Comunitaria y no se asignan como ponentes de sesiones por defecto. Los ponentes reales se asocian desde el formulario de sesión mediante la tabla `sesion_ponentes`.

### Textos de la app

La pestaña `Textos de la app` permite editar textos globales visibles:

- Inicio: título, subtítulo, descripción, botones rápidos y datos clave.
- Agenda, Sesiones, Ponentes, Recursos y Contacto: títulos y descripciones.
- Contacto: coordinación, email y teléfono.
- Footer: texto del pie y etiqueta del enlace Admin.

Para activar esta sección en un proyecto Supabase ya creado, ejecuta `supabase/migration-site-content.sql` en el SQL Editor de Supabase. La app pública leerá `site_settings` cuando exista; si falta una key o Supabase falla, usará `data/jap.json` como fallback.

### Copia de seguridad

La pestaña `Copia de seguridad` permite descargar un archivo `jap-backup-YYYY-MM-DD.json`.

Incluye:

- `jornadas`
- `sesiones`
- `ponentes`
- `sesion_ponentes`
- `recursos`
- `sedes`
- `site_settings`

No incluye usuarios de Auth, contraseñas, tokens, claves, `service_role` ni datos secretos. Sí incluye `estado`, `is_active`, bibliografía y campos docentes dentro de `sesiones`. Haz una copia antes de cambios grandes en el programa, textos o recursos.

Validar el JSON descargado:

```bash
python3 -m json.tool jap-backup-YYYY-MM-DD.json >/dev/null
```

Restauración manual:

1. Abre Supabase > Table Editor o SQL Editor.
2. Revisa el JSON y restaura solo las tablas necesarias.
3. Mantén este orden si restauras varias tablas: `jornadas`, `sedes`, `ponentes`, `sesiones`, `sesion_ponentes`, `recursos`, `site_settings`.
4. Comprueba después la app pública y el panel admin.

La importación automática queda pendiente para una fase posterior.

## Publicación

### GitHub Pages

1. Sube el contenido de esta carpeta al repositorio `olsanju-hub/JAP`.
2. Activa Pages desde `main` y la carpeta raíz.
3. Comprueba que `manifest.webmanifest`, `sw.js`, `data/jap.json`, `config.js` si aplica y los assets se sirven con rutas relativas.

Actualizar y volver a publicar:

```bash
git add .
git commit -m "feat: publish JAP functional version"
git push
```

GitHub Pages redepliega automáticamente desde `main`.

## Seguridad

- `config.js` contiene solo `SUPABASE_URL` y publishable/anon key.
- La publishable/anon key es pública por diseño.
- La seguridad real depende de RLS en Supabase.
- No uses `service_role`, secret key ni `sb_secret` en frontend.
- Anónimo y usuarios `lector` no deben tener permisos de escritura.
- `admin` y `editor` pueden crear, editar, borrar lógico y restaurar según las políticas RLS.
- `admin` y `editor` pueden exportar copia de seguridad desde el panel.
- `config.js` no se precachea en el service worker.

Para reforzar un proyecto Supabase ya creado, ejecuta `supabase/migration-security-backup.sql` despues de `supabase/migration-site-content.sql`. Para activar roles de personas y ponentes por sesión, ejecuta después `supabase/migration-session-speakers.sql`. Para estados editoriales y campos docentes, usa las migraciones CLI en `supabase/migrations/`.

Comprobación rápida de roles:

- Anónimo: abrir la app pública sin login; debe leer solo sesiones publicadas, ponentes activos, recursos visibles y textos globales.
- Lector: iniciar sesión con un usuario `profiles.role = 'lector'`; el panel debe mostrar `Sin permisos de edición`.
- Editor: iniciar sesión con `profiles.role = 'editor'`; debe poder editar contenido y exportar backup, pero no gestionar roles.
- Admin: iniciar sesión con `profiles.role = 'admin'`; debe poder gestionar todo lo previsto por el panel.

## Caché PWA

Si no ves cambios tras editar archivos cacheados:

1. Abre DevTools > Application > Service Workers.
2. Pulsa Unregister.
3. Limpia Storage si es necesario.
4. Recarga con hard reload.

El cache actual se identifica como `jap-static-v17`. `config.js` no se precachea y las llamadas externas a Supabase no se cachean para evitar datos antiguos.
