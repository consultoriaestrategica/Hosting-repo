# Auditoría de Estilos y Consistencia UX — Hogar San Juan

**Alcance:** consistencia del sistema de diseño final en todas las pantallas, tipografía/espaciado/color (tokens vs. hardcode), componentes reutilizados vs. reinventados, responsive en 3 breakpoints, accesibilidad básica, y detección de pantallas con diseño "viejo" sin migrar. No se revisó funcionamiento ni deuda técnica de código (ver `audit-01-funcionamiento.md` y `audit-02-deuda-tecnica.md`).
**Método:** lectura de `globals.css`, `tailwind.config.ts` y componentes base de `src/components/ui/`, seguida de comparación sistemática (`grep`/diff manual) de las mismas piezas de UI (encabezados de página, tablas, botones, spinners) a través de las ~14 pantallas del panel y el portal familiar. Se calcularon ratios de contraste WCAG reales para los pares de color del tema.

## Resumen ejecutivo

El repo sí tiene un sistema de diseño real (tokens HSL en `globals.css` + escala semántica en `tailwind.config.ts`: `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `border`...), y la mayoría de componentes lo usan correctamente. El problema no es la falta de sistema, sino que el **overhaul de responsive/mobile no se terminó de propagar**: de las 10 pantallas principales del panel, solo 2 (`residents` y `logs`) recibieron el patrón de encabezado responsive (`flex-col sm:flex-row` + título `text-2xl md:text-3xl`); las otras 8 (`staff`, `reports`, `visitors`, `settings`, `contracts` y las tres pantallas "nuevo registro") se quedaron con el encabezado antiguo, fijo y sin puntos de quiebre.

También se encontraron **tres mecanismos distintos y no sincronizados** para el mismo color de marca: el token `sidebar` de `tailwind.config.ts`, una regla CSS con hex hardcodeado en `globals.css` que apunta al mismo elemento, y clases `text-[#hex]` arbitrarias en 2 componentes — los tres definen aproximadamente el mismo verde oscuro pero con valores ligeramente distintos. El mismo patrón de "copiar el hex a mano" se repite en el generador de PDF, cuyo verde institucional (`#5B8C6F`) ya diverge un poco del token `--primary` actual.

En accesibilidad, el hallazgo más concreto: **el contraste de texto sobre botones primarios y de acento no cumple WCAG AA** (3.69:1 y 3.08:1 respectivamente, se requiere 4.5:1 para texto normal), y se detectaron **al menos 14 botones solo-ícono sin ningún nombre accesible** (ni `aria-label` ni texto `sr-only`) en acciones destructivas (eliminar contacto, eliminar visita, eliminar foto). Finalmente, existe un tema oscuro completo (`.dark` en `globals.css`, `darkMode: ['class']` en Tailwind) que **no tiene ningún mecanismo para activarse** en toda la aplicación — es una dirección de diseño explorada y nunca conectada.

---

## 1. Consistencia del sistema de diseño final en todas las pantallas

### 🔴 Crítico — El encabezado de página responsive solo se aplicó a 2 de 10 pantallas
Comparación directa del bloque de encabezado (`<h1>` + acción) en cada pantalla principal de `/dashboard`:

| Pantalla | Contenedor | Tamaño de título |
|---|---|---|
| [residents/page.tsx:278-280](src/app/dashboard/residents/page.tsx#L278-L280) | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` | `text-2xl md:text-3xl` ✅ |
| [logs/page.tsx:142-144](src/app/dashboard/logs/page.tsx#L142-L144) | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` | `text-2xl md:text-3xl` ✅ |
| [staff/page.tsx:173-174](src/app/dashboard/staff/page.tsx#L173-L174) | `flex items-center` (sin wrap) | `text-3xl` fijo ⚠️ |
| [reports/page.tsx:117-118](src/app/dashboard/reports/page.tsx#L117-L118) | `flex items-center` (sin wrap) | `text-3xl` fijo ⚠️ |
| [visitors/page.tsx:128-129](src/app/dashboard/visitors/page.tsx#L128-L129) | `flex items-center` (sin wrap) | `text-3xl` fijo ⚠️ |
| [settings/page.tsx:383-384](src/app/dashboard/settings/page.tsx#L383-L384) | `flex items-center` (sin wrap) | `text-3xl` fijo ⚠️ |
| [contracts/page.tsx:118-119](src/app/dashboard/contracts/page.tsx#L118-L119) | `flex items-center` (sin wrap) | `text-3xl` fijo ⚠️ |
| [residents/new/page.tsx:258](src/app/dashboard/residents/new/page.tsx#L258) | sin contenedor flex, `<h1>` suelto | `text-3xl` fijo ⚠️ |
| [staff/new/page.tsx:169](src/app/dashboard/staff/new/page.tsx#L169) | sin contenedor flex, `<h1>` suelto | `text-3xl` fijo ⚠️ |
| [contracts/new/page.tsx:284](src/app/dashboard/contracts/new/page.tsx#L284) | sin contenedor flex, `<h1>` suelto | `text-3xl` fijo ⚠️ |

En las 8 pantallas marcadas ⚠️, el título usa `text-3xl` (30px) sin variante `md:`, y el contenedor `flex items-center` **no tiene `flex-wrap` ni breakpoint** — en `staff`, `reports`, `visitors`, `settings` y `contracts` el botón de acción se posiciona con `ml-auto` junto al título en la misma fila. En un viewport móvil angosto (320-375px), un título largo como "Generador de Reportes" o "Registro de Visitas" a 30px junto a un botón empujado al extremo derecho compite por el espacio horizontal sin punto de quiebre que los apile, a diferencia de `residents`/`logs` que sí apilan verticalmente por debajo de `sm:`. Esto es evidencia directa de que el rediseño responsive (commit "feat: complete responsive overhaul for mobile across all views") se aplicó solo parcialmente pese a que su mensaje de commit dice "across all views".

### 🟡 Importante — Tablas y listas de tarjetas móviles sí están unificadas (punto positivo)
A diferencia del encabezado, el patrón de tabla responsive (`md:hidden` → lista de tarjetas / `hidden md:block` → `<Table>`) **sí** se aplicó consistentemente en `residents`, `staff`, `visitors`, `logs` y `contracts` (confirmado línea por línea en las 5 pantallas). Es la pieza de UI que mejor se sincronizó durante el overhaul.

### 🟡 Importante — `ContractAttachment`: componente "viejo" que se sigue enviando en el bundle
[src/app/dashboard/components/contract-attachment.tsx:1-3](src/app/dashboard/components/contract-attachment.tsx#L1-L3) trae en su propio encabezado el comentario `// DEPRECATED: Este componente fue reemplazado... No se usa activamente.` Aunque no se referenció en el flujo principal actual (ver `audit-02`), el archivo sigue en el repo con estilos de una iteración anterior (`Card` genérico sin las clases de layout más recientes de `resident-profile-content.tsx`) — riesgo de que alguien lo reconecte por error y reintroduzca una UI inconsistente con la vigente.

### 🟢 Correcto
- Los componentes base (`Card`, `Button`, `Dialog`, `Table`, `Select`, `Badge`...) provienen todos de `src/components/ui/` (shadcn) y se reutilizan consistentemente — no se encontraron implementaciones "reinventadas" de botones, tarjetas o inputs fuera de ese directorio compartido.

---

## 2. Tipografía, espaciados, colores (tokens vs. hardcode)

### 🟡 Importante — El color de marca del sidebar está definido tres veces, con valores distintos
1. **Token Tailwind** ([tailwind.config.ts:65-73](tailwind.config.ts#L65-L73)): `sidebar.DEFAULT: "hsl(150, 17%, 21%)"` — definido como string HSL crudo, no como variable CSS (`hsl(var(--x))`) como el resto de la paleta, así que no participa del sistema de dark-mode ni es inspeccionable desde `:root`.
2. **CSS con hex hardcodeado** ([src/app/globals.css:122](src/app/globals.css#L122)): `[data-sidebar="sidebar"] { background-color: #2C3E35; }` y líneas 127-137 fijan los colores de texto/hover/activo del menú (`#9AB8A6`, `#c8e0d1`, `#5B8C6F`) — esta regla de atributo aplica sobre el mismo elemento que ya recibe la clase Tailwind `bg-sidebar` en [src/app/dashboard/layout.tsx:58](src/app/dashboard/layout.tsx#L58), duplicando la definición del color de fondo por dos vías distintas.
3. **Clases arbitrarias sueltas**: [src/app/dashboard/layout.tsx:61,64](src/app/dashboard/layout.tsx#L61) usa `text-[#E8F5EC]` / `text-[#6B8F7B]` y [src/components/dashboard-nav.tsx:111](src/components/dashboard-nav.tsx#L111) usa `text-[#9AB8A6] hover:text-[#c8e0d1]` — colores del sidebar escritos a mano en vez de referenciar `text-sidebar-foreground`/`text-sidebar-hover-foreground`, que ya existen como tokens en el config pero **no se usan en ningún componente** (confirmado: `bg-sidebar` es la única clase del namespace `sidebar-*` usada en todo `src/`).

**Consecuencia práctica:** si se ajusta la paleta de marca a futuro, hay que tocar 3 lugares distintos y coordinar valores a mano; ya hay evidencia de deriva (`#2C3E35` en CSS vs. el equivalente real de `hsl(150,17%,21%)` no se corresponden con precisión matemática exacta, aunque visualmente sean casi indistinguibles).

### 🟡 Importante — El verde institucional del PDF diverge del token web actual
El generador de PDF ([src/lib/pdf-generator.ts:127-128](src/lib/pdf-generator.ts#L127-L128)) usa `doc.setFillColor(91, 140, 111)` (`#5B8C6F`) como color de marca. El token `--primary` actual (`147 23% 46%` en HSL) convierte a `rgb(90, 144, 115)` (`#5A9073`) — un verde visualmente casi idéntico pero **no el mismo valor**, confirmando que el color del PDF se copió a mano en algún momento y no se resincronizó cuando el token web cambió (o viceversa). Mismo patrón con el gradiente de fondo del login ([src/app/login/page.tsx:258](src/app/login/page.tsx#L258): `from-[#F5F0E8] via-[#E8EDE4]`) vs. el token `--background` actual (`36 33% 93%` → `#F3EEE7`): tonos de crema distintos entre el fondo del login y el fondo del resto de la app.

### 🟡 Importante — `font-headline` es un alias sin diferencia real con `font-body`
[tailwind.config.ts:19-22](tailwind.config.ts#L19-L22) define `fontFamily.headline` con exactamente la misma lista de fuentes que `fontFamily.body` (`-apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif`). La clase `font-headline` se usa en los 14 `<h1>` de página revisados como si fuera una fuente de titular distintiva, pero renderiza igual que el texto normal — es un resto de una dirección de diseño anterior (probablemente una fuente serif/display para títulos) que se revirtió a la fuente del sistema sin limpiar el token ni las clases que lo referencian.

### 🟢 Mejora deseable
- El resto de la paleta semántica (`background`, `foreground`, `card`, `border`, `destructive`, `chart-1..5`) está correctamente centralizada en variables CSS HSL y se usa mediante clases Tailwind (`bg-card`, `text-muted-foreground`, etc.) en la enorme mayoría del código — el hardcodeo detectado se concentra en 4 archivos `.tsx` + `globals.css` + `pdf-generator.ts`, no está generalizado.

---

## 3. Responsive design en 3 breakpoints (móvil / tablet / desktop)

### 🟡 Importante — El quiebre encabezado ya documentado en el punto 1 rompe específicamente en móvil
Ver punto 1: 8 de 10 encabezados de página no tienen tratamiento para el breakpoint móvil (< 640px).

### 🟢 Correcto — El breakpoint "tablet" (768-1023px) sí tiene al menos un ajuste real
[src/app/dashboard/residents/page.tsx:439](src/app/dashboard/residents/page.tsx#L439) oculta la columna "Último Registro" con `hidden lg:table-cell`, es decir, entre `md` (768px) y `lg` (1024px) la tabla de residentes muestra una columna menos que en desktop — es un ajuste real y correcto pensado para tablet, no solo un móvil-vs-desktop binario. El hook [src/hooks/use-mobile.tsx:3](src/hooks/use-mobile.tsx#L3) usa el mismo breakpoint (768px) que las clases `md:` de Tailwind, así que la detección de "es móvil" en JS y en CSS está sincronizada.

### 🟢 Mejora deseable — `colSpan` desactualizado para el estado vacío en la tabla de residentes
En la misma tabla, [src/app/dashboard/residents/page.tsx:447](src/app/dashboard/residents/page.tsx#L447) fija `colSpan={6}` para la fila de "No se encontraron residentes", pero el `<TableHeader>` declara 7 columnas quando el viewport es `≥ lg` (Nombre, Habitación, Estado, F. de Ingreso, Nivel de Dependencia, Último Registro, Acciones). En desktop (`lg`+), el mensaje de estado vacío queda corrido una columna a la izquierda respecto al encabezado real, dejando la última columna visualmente huérfana. Es un detalle menor pero es exactamente el tipo de desalineación de "faltó re-probar en el tercer breakpoint" que se pidió revisar.

### 🟢 Correcto
- Todas las grillas de tarjetas (`reports/page.tsx`: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`, formularios con secciones en `grid-cols-1 sm:grid-cols-3`, etc.) sí escalan de forma progresiva en los 3 anchos revisados sin overflow horizontal aparente (el proyecto además fuerza `overflow-x: hidden` global en `html, body`, ver `globals.css:8-13`, como red de seguridad).

---

## 4. Accesibilidad básica

### 🔴 Crítico — El texto de los botones primarios y de acento no cumple contraste WCAG AA
Se calcularon los ratios de contraste reales (fórmula WCAG 2.x) para los pares de color definidos en `globals.css:24-58`:

| Par | Ratio | Umbral WCAG AA (texto normal) | Resultado |
|---|---|---|---|
| `primary-foreground` sobre `primary` (botón "default" de shadcn, usado en casi todos los CTA: "Iniciar Sesión", "Generar PDF", "Guardar", etc. — [src/components/ui/button.tsx:12](src/components/ui/button.tsx#L12), `text-sm font-medium` = texto normal, no "grande") | **3.69:1** | 4.5:1 | ❌ Falla |
| `accent-foreground` sobre `accent` (badges/alertas de tipo "Gestión Personal"/pendientes) | **3.08:1** | 4.5:1 | ❌ Falla |
| `muted-foreground` sobre `background` (todo el texto secundario: subtítulos, timestamps, ayudas de formulario) | **3.12:1** | 4.5:1 | ❌ Falla |
| `muted-foreground` sobre `card` | **3.45:1** | 4.5:1 | ❌ Falla |
| `foreground` sobre `background` (texto principal) | 9.78:1 | 4.5:1 | ✅ |
| `card-foreground` sobre `card` | 10.81:1 | 4.5:1 | ✅ |
| `sidebar-foreground` sobre fondo del sidebar | 6.42:1 | 4.5:1 | ✅ |

El texto principal tiene contraste excelente, pero **el texto de los botones de acción principal y todo el texto "muted" (usado en descripciones de tarjetas, ayudas de campo y metadatos en absolutamente todas las pantallas)** cae por debajo del mínimo legal/estándar para texto normal. Para usuarios con baja visión —un perfil realista en el contexto de un hogar geriátrico, donde también los propios cuidadores/familiares mayores pueden operar el sistema— este es el hallazgo de accesibilidad con más impacto real.

### 🟡 Importante — Al menos 14 botones solo-ícono sin nombre accesible
Se contaron 39 usos de `size="icon"` (botones sin texto visible) contra solo 25 usos de `sr-only` en todo `src/` (algunos de esos 25 no son para botones sino para encabezados de columna). Ejemplos concretos de botones ícono-solo **sin** `aria-label` ni `<span className="sr-only">`:
- Eliminar contacto/medicamento/teléfono en el formulario de residente: [src/app/dashboard/residents/new/page.tsx:322,384,436,463](src/app/dashboard/residents/new/page.tsx#L322) y su espejo en [edit-resident-form.tsx:359,412,467,494](src/app/dashboard/residents/edit/%5Bid%5D/edit-resident-form.tsx#L359).
- Eliminar visita: [src/app/dashboard/visitors/page.tsx:233,288](src/app/dashboard/visitors/page.tsx#L233).
- Menú "más acciones" en las tablas de `residents/page.tsx:514-517` y `staff/page.tsx:338-341` (sí lo tienen resuelto correctamente `contracts/page.tsx:206` y `resident-profile-content.tsx:755` con `sr-only`, lo cual confirma que el patrón correcto existe en el código pero no se aplicó de forma pareja).
- Ver/renombrar/eliminar foto de evidencia y alternar dictado por voz en [new-log-form.tsx:839,849,859,1551,1566,1736](src/app/dashboard/residents/%5Bid%5D/new-log-form.tsx#L839).

Para un usuario de lector de pantalla, estos botones se anuncian simplemente como "botón" sin indicar qué acción realizan — particularmente riesgoso al tratarse mayormente de acciones destructivas (eliminar).

### 🟡 Importante — Vista previa de foto no accesible por teclado
[src/app/dashboard/residents/[id]/new-log-form.tsx:775](src/app/dashboard/residents/%5Bid%5D/new-log-form.tsx#L775): `<div className="aspect-square cursor-pointer" onClick={() => previewImage(photo)}>` abre un modal de vista previa de evidencia fotográfica médica, pero es un `<div>` sin `role="button"`, sin `tabIndex` y sin manejador `onKeyDown` — no es alcanzable ni activable con teclado ni anunciado como interactivo por un lector de pantalla. El modal en sí (línea 1765) también se cierra haciendo clic en el fondo (`onClick` sobre otro `<div>`), aunque en ese caso sí existe un botón `X` (línea ~1774) como alternativa de teclado para cerrarlo.

### 🟡 Importante — `aria-label` no se usa en absolutamente ningún lugar del proyecto
Búsqueda de `aria-label` en todo `src/`: **0 resultados**. El proyecto depende exclusivamente del patrón `<span className="sr-only">` para dar nombre accesible a elementos sin texto visible, lo cual es válido pero, al no aplicarse de forma sistemática (ver punto anterior), deja huecos. No se encontró tampoco ningún uso de `aria-describedby`, `aria-live` o `role="alert"` para anunciar los toasts de error/éxito a un lector de pantalla — el sistema de `toast` (Radix) probablemente ya incluye esto internamente por defecto, pero no hay refuerzo explícito en el código de la app.

### 🟢 Correcto
- Los formularios construidos con el sistema `Form`/`FormField`/`FormLabel`/`FormControl` de shadcn (128 usos de `<FormLabel>` en todo el proyecto) asocian correctamente cada label con su input a través del contexto de `react-hook-form`, sin depender de que el desarrollador escriba `htmlFor`/`id` a mano — la cobertura de labels en los formularios de alta/edición es buena.
- Todas las etiquetas `<img>`/`<Image>` revisadas (evidencia fotográfica en `log-detail-dialog.tsx` y `new-log-form.tsx`, logo en `login/page.tsx`) sí tienen atributo `alt` con contenido descriptivo, no vacío ni genérico.
- El documento raíz declara `lang="es"` ([src/app/layout.tsx:16](src/app/layout.tsx#L16)), correcto para lectores de pantalla en español.

---

## 5. Pantallas o flujos con diseño "viejo" sin actualizar

### 🟡 Importante — 8 pantallas con el encabezado pre-overhaul (detalle en punto 1)
`staff`, `reports`, `visitors`, `settings`, `contracts` (listados) y `residents/new`, `staff/new`, `contracts/new` (formularios de alta) conservan el patrón de encabezado fijo sin puntos de quiebre, mientras que `residents` y `logs` ya migraron al patrón nuevo. Es la señal más clara de un rediseño aplicado de forma incompleta.

### 🟡 Importante — Tema oscuro completo, definido pero inalcanzable
`globals.css:61-95` define una paleta `.dark` completa (fondo azul oscuro `222 47% 11%`, primario azul `217 91% 60%`, acento teal `173 80% 40%` — **una paleta de otra identidad de marca**, nada que ver con el verde/terracota del tema claro) y `tailwind.config.ts:4` declara `darkMode: ['class']`. Se buscó en todo el proyecto cualquier mecanismo que agregue la clase `dark` al árbol (`next-themes`, `ThemeProvider`, `setTheme`, toggle de UI) y **no existe ninguno** — es una dirección de diseño (probablemente el tema oscuro por defecto que trae el boilerplate de shadcn) que quedó completamente desconectada de la aplicación real. Representa código muerto de diseño y, si algún día se activa por accidente (p. ej. alguien agrega un toggle sin revisar esta paleta), el usuario vería una marca visualmente irreconocible.

### 🟡 Importante — Meta viewport duplicado e inválido en el portal familiar
[src/app/family-portal/layout.tsx:69-70](src/app/family-portal/layout.tsx#L69-L70) renderiza manualmente `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` dentro del JSX de un componente cliente (fuera de `<head>`, ya que Next.js App Router no permite insertar elementos de documento sueltos ahí). Next.js ya inyecta un `viewport` por defecto automáticamente; este `<meta>` manual es un resto de una implementación anterior (probablemente de cuando el portal familiar era una ruta o app independiente) y no tiene efecto real ni lugar válido en el HTML resultante.

### 🟢 Mejora deseable
- `src/app/dashboard/components/contract-attachment.tsx` (ver punto 1) es la única pieza de UI de "generación anterior" que sigue completa en el repo pese a estar marcada `DEPRECATED` en su propio comentario — candidata a eliminar junto con la limpieza de código muerto ya recomendada en `audit-02-deuda-tecnica.md`.

---

## Priorización sugerida (top 5)

1. 🔴 Subir el contraste de `--primary`/`--accent` (o oscurecer `primary-foreground`/`accent-foreground`) hasta cumplir 4.5:1 — afecta el texto de prácticamente todos los botones de acción de la app.
2. 🔴 Aplicar el mismo patrón de encabezado responsive (`flex-col sm:flex-row` + `text-2xl md:text-3xl`) a las 8 pantallas que quedaron con el header viejo.
3. 🟡 Agregar `aria-label`/`sr-only` a los ~14 botones ícono-solo detectados, priorizando los de acciones destructivas (eliminar contacto/visita/foto).
4. 🟡 Unificar el color del sidebar en un solo lugar (token CSS var, no HSL crudo en Tailwind + hex duplicado en `globals.css` + clases arbitrarias en componentes) y resincronizar el verde institucional del PDF con `--primary`.
5. 🟡 Decidir si el tema oscuro se termina de conectar (con `next-themes` o similar) o se elimina de `globals.css`/`tailwind.config.ts` para no mantener una paleta de marca alterna que nadie puede ver ni probar.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
