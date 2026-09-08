# Auditoría de Deuda Técnica y Calidad de Código — Hogar San Juan

**Alcance:** código duplicado, TypeScript (`any`/tipos faltantes), manejo de estado (Context/hooks), cobertura de manejo de errores (try/catch, error boundaries, estados de loading/error), y `npm audit`. No se revisó funcionamiento/seguridad de negocio (ver `audit-01-funcionamiento.md`) ni estilos visuales.
**Método:** lectura de código fuente (114 archivos `.ts`/`.tsx` en `src/`), búsquedas dirigidas (`grep`) y ejecución real de `npm audit` / `npm outdated` sobre `node_modules` ya instalado.

## Resumen ejecutivo

El proyecto **no usa ningún Context de React ni capa de caché de datos** (no existe un solo archivo `*context*`, ni React Query/SWR): cada hook personalizado (`useResidents`, `useStaff`, `useLogs`, etc.) abre su propio listener `onSnapshot` sobre la colección completa. Como estos hooks se llaman de forma independiente en 8-17 componentes distintos (a veces varios en la misma pantalla), una sola vista puede abrir múltiples suscripciones en tiempo real redundantes a la misma colección — esto es el anti-patrón de estado más importante del proyecto.

El segundo hallazgo más relevante es la **duplicación casi total entre formularios "nuevo" y "editar"**: `residents/new/page.tsx` (475 líneas) y `residents/edit/[id]/edit-resident-form.tsx` (505 líneas) tienen el mismo esquema Zod copiado literalmente y estructura de formulario casi idéntica; el mismo patrón se repite en `staff/new` vs `staff/edit`. Ninguno de los dos pares comparte un componente `<ResidentForm mode="create"|"edit">` reutilizable.

No existe **ningún Error Boundary** en toda la aplicación (0 resultados para `ErrorBoundary`/`componentDidCatch`): cualquier excepción de renderizado deja al usuario con una pantalla en blanco sin recuperación. El uso de `any` (66 archivos con al menos una ocurrencia) es moderado pero recurrente, sobre todo en callbacks de `.map()`/`.filter()` con datos de Firestore y en el hook `useResidents`.

`npm audit` reporta **70 vulnerabilidades (5 críticas, 31 altas)**, pero casi todas provienen de tres orígenes concretos y ya identificados como código muerto en la auditoría de funcionamiento: `genkit`/`@genkit-ai/*` (Genkit + OpenTelemetry + gRPC), `puppeteer`, y `jspdf` (sí usado, con fix disponible pero mayor de versión).

---

## 1. Código duplicado / componentes que deberían unificarse

### 🔴 Crítico — Formularios "nuevo" vs "editar" duplicados casi al 100%
- **Residentes:** [src/app/dashboard/residents/new/page.tsx](src/app/dashboard/residents/new/page.tsx) (475 líneas) y [src/app/dashboard/residents/edit/[id]/edit-resident-form.tsx](src/app/dashboard/residents/edit/%5Bid%5D/edit-resident-form.tsx) (505 líneas) definen el **mismo esquema Zod `residentFormSchema`** de forma literal (campos idénticos: `medications`, `familyContacts.phones`, `documents`, etc. — comparar líneas 37-83 de `new/page.tsx` con 31-77 de `edit-resident-form.tsx`) y prácticamente la misma UI de formulario. Cualquier cambio de validación o de campo debe aplicarse manualmente dos veces; ya hay señales de divergencia (`new/page.tsx` importa `Controller` y `FormDescription`, que `edit-resident-form.tsx` no usa).
- **Personal:** el mismo patrón se repite entre [src/app/dashboard/staff/new/page.tsx](src/app/dashboard/staff/new/page.tsx) (240 líneas) y [src/app/dashboard/staff/edit/[id]/edit-staff-form.tsx](src/app/dashboard/staff/edit/%5Bid%5D/edit-staff-form.tsx) (252 líneas), con `staffFormSchema` declarado dos veces (líneas 35 y 33 respectivamente).
- **Recomendación:** extraer un único componente `ResidentForm`/`StaffForm` parametrizado por `mode: "create" | "edit"` y `defaultValues`, con el esquema Zod exportado desde un solo módulo (ej. `src/lib/schemas/resident.ts`).

### 🟡 Importante — Tres mecanismos de guard de autenticación distintos y con cobertura inconsistente
- [src/components/auth-guard.tsx](src/components/auth-guard.tsx): verifica sesión con `onAuthStateChanged` y redirige — pero solo se usa en [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx), ninguna otra ruta de `/dashboard/*` lo importa.
- [src/components/route-guard.tsx](src/components/route-guard.tsx): verifica **permiso** (no solo sesión) y se usa en únicamente 3 páginas (`staff`, `staff/new`, `settings`).
- [src/app/family-portal/layout.tsx:30-42](src/app/family-portal/layout.tsx#L30-L42): un tercer patrón ad-hoc con `useEffect` + `router.push` propio, solo para el portal familiar.
- Ninguno de los tres comparte código ni convención; el resultado es que la cobertura de "¿esta ruta exige sesión/permiso?" depende de si alguien recordó envolver esa página en particular. Se recomienda unificar en un único guard (idealmente a nivel de `layout.tsx` de `/dashboard`, aplicado una sola vez) en vez de decidirlo página por página.

### 🟡 Importante — Markup de "spinner de carga" copiado 8 veces
El bloque `animate-spin rounded-full ... border-b-2 border-primary` aparece repetido en al menos 8 archivos (`family-portal/page.tsx`, `family-portal/layout.tsx`, `route-guard.tsx`, `auth-guard.tsx`, entre otros) con clases de Tailwind ligeramente distintas cada vez, en vez de un componente compartido `<Spinner />` o `<LoadingScreen />`. Lo mismo ocurre con el patrón `if (isLoading) return <div>Cargando...</div>` (7 archivos con exactamente ese texto literal), que además es menos informativo/accesible que un componente de skeleton reutilizable.

### 🟢 Mejora deseable — Tres sistemas de generación de PDF (ver también audit-01, punto 3)
`src/lib/pdf-generator.ts` (jsPDF+autotable), `log-detail-dialog.tsx` (html2canvas+jsPDF) y `src/ai/flows/report-flow.ts` (@react-pdf/renderer, sin uso real) conviven sin compartir helpers de formato de fecha/edad — cada uno reimplementa su propio `formatDate`/`calculateAge`.

---

## 2. Uso de TypeScript: `any`, tipos faltantes, props sin tipar

### 🟡 Importante — `any` recurrente en el manejo de datos de Firestore
Se detectaron ocurrencias de `any` en 66 de los 114 archivos `.ts`/`.tsx` del proyecto (búsqueda de `: any`, `as any`, `<any>`, `any[]`). Ejemplos representativos:
- [src/app/dashboard/contracts/page.tsx:88](src/app/dashboard/contracts/page.tsx#L88) y `:95` — `getPersonName(contract: any)` / `getPersonLink(contract: any)`: el tipo `combinedContracts` ya está inferido por `useMemo` más arriba, pero se re-tipa como `any` al pasarlo a estas funciones en vez de reutilizar el tipo de unión real.
- [src/app/family-portal/page.tsx:102,107,343,418](src/app/family-portal/page.tsx#L102) — eventos y logs tipados como `any` en cuatro sitios distintos pese a que `AgendaEvent` y `Log` ya existen como tipos exportados en `use-residents.ts`/`use-family-logs.ts`.
- [src/hooks/use-residents.ts:170](src/hooks/use-residents.ts#L170) — `await updateDoc(residentDoc, sanitizeForFirestore(updated as Record<string, unknown>) as any)`: doble cast (`as Record<string,unknown>` y luego `as any`) para forzar el tipo esperado por `updateDoc`, en vez de tipar correctamente `sanitizeForFirestore` con genéricos.
- [src/lib/firestore-utils.ts:16-17](src/lib/firestore-utils.ts#L16-L17) — `(sanitized[key] as any)?.constructor?.name` para detectar `Timestamp`/`FieldValue`: funciona, pero un helper tipado (`instanceof Timestamp`) sería más seguro ante refactors.
- [src/app/dashboard/components/log-detail-dialog.tsx:135,169](src/app/dashboard/components/log-detail-dialog.tsx#L135) — `item as any` / `rawEvolution as any` para leer campos de formatos "legacy" de logs sin un tipo de unión que documente las variantes históricas del documento.
- [src/app/dashboard/contracts/[id]/page.tsx:12](src/app/dashboard/contracts/%5Bid%5D/page.tsx#L12) — `props: any` para todo el componente de página, con comentario explicando que es un workaround de tipado de Next 15 para `params` async (ver también audit-01).

No se encontró ningún `@ts-ignore`/`@ts-nocheck`/`@ts-expect-error` en el proyecto (buena señal: no se están silenciando errores de tipos a la fuerza), y `tsc --noEmit` no reporta errores — el problema no es que el proyecto no compile, sino que hay puntos donde se optó por `any` en vez de modelar el tipo real.

### 🟢 Mejora deseable
- Los tipos de dominio (`Resident`, `Log`, `FamilyMember`, `AppUser`/`Staff` en `src/types/user.ts` y dentro de cada hook) están razonablemente bien definidos y se reutilizan como `import type` en varios formularios — la base de tipado es sólida, el problema son puntos concretos de fricción (Firestore untyped data, Next 15 params) donde se cedió a `any` en vez de invertir en un tipo o type-guard.

---

## 3. Manejo de estado (hooks personalizados): anti-patrones

### 🔴 Crítico — Sin Context ni caché compartida: listeners `onSnapshot` duplicados por pantalla
No existe ningún Context de React en el proyecto (búsqueda de archivos `*context*`: 0 resultados) ni ninguna librería de cache de datos (React Query/SWR/RTK Query). Cada hook (`useResidents`, `useStaff`, `useLogs`, `useContracts`, `useStaffContracts`, `useSettings`) abre su **propio** `onSnapshot` sobre la colección completa cada vez que se invoca, y se invoca de forma independiente en múltiples componentes:

| Hook | Nº de archivos que lo invocan |
|---|---|
| `useResidents` | 17 |
| `useUser` | 14 |
| `useStaff` | 9 |
| `useLogs` | 9 |
| `useStaffContracts` | 8 |
| `useSettings` | 4 |
| `useAuth` | 5 |
| `useFamilyMembers` | 3 |

Ejemplo concreto: en la ruta `/dashboard/residents/[id]`, tanto [resident-profile-content.tsx:129](src/app/dashboard/residents/%5Bid%5D/resident-profile-content.tsx#L129) como [new-log-form.tsx:186](src/app/dashboard/residents/%5Bid%5D/new-log-form.tsx#L186) llaman `useResidents()` de forma independiente — **dos listeners en tiempo real simultáneos sobre toda la colección `residents`** solo para renderizar el perfil de un residente y un formulario dentro de la misma página. Esto multiplica lecturas de Firestore (costo directo en el plan de facturación), duplica el estado en memoria (dos copias potencialmente desincronizadas por un instante) y hace más lento el primer render de cada pantalla que combina varios de estos hooks (ej. `/dashboard/page.tsx` y `/dashboard/contracts/page.tsx` combinan 4 hooks de colección completa a la vez).

**Recomendación:** introducir un Context (o una librería ligera de cache tipo SWR/React Query con `onSnapshot` como fuente) por colección, para que un único listener alimente a todos los componentes que necesiten esos datos.

### 🟡 Importante — Prop drilling de callbacks de mutación
Como no hay Context, cada hook devuelve tanto los datos como sus funciones de mutación (`addResident`, `updateResident`, `dischargeResident`, `addAgendaEvent`..., ver [src/hooks/use-residents.ts:277-289](src/hooks/use-residents.ts#L277-L289)) y cada componente que necesita mutar vuelve a llamar `useResidents()` completo solo para obtener esas funciones — acoplando cualquier componente hijo a la colección entera aunque solo necesite escribir un campo.

### 🟡 Importante — Duplicación del patrón "esperar auth antes de suscribir"
El patrón de anidar `onAuthStateChanged` → luego `onSnapshot`, con dos variables `unsubAuth`/`unsubSnapshot` y limpieza manual de ambas, está copiado casi línea por línea en `use-residents.ts`, `use-staff.ts`, `use-logs.ts`, `use-contracts.ts`, `use-staff-contracts.ts` y `use-settings.ts` (confirmado por comparación directa del bloque `let unsubSnapshot = null; const unsubAuth = onAuthStateChanged(...)`). Es un buen patrón (evita el error de suscribirse antes de que exista sesión) pero debería extraerse a un hook base genérico (`useAuthedSnapshot(query)`), no reimplementarse seis veces.

### 🟢 Correcto
- Pese a la duplicación de patrón, la limpieza (`return () => { unsubAuth(); unsubSnapshot?.() }`) está bien hecha en los 6 hooks — no hay fugas de listeners (ver también audit-01, punto 2).

---

## 4. Cobertura de manejo de errores

### 🔴 Crítico — Cero Error Boundaries en toda la aplicación
No se encontró ningún componente `ErrorBoundary`, `componentDidCatch` ni `getDerivedStateFromError` en el proyecto. Next.js App Router permite definir `error.tsx` por segmento de ruta (`app/dashboard/error.tsx`, `app/family-portal/error.tsx`, etc.) y **no existe ninguno**. Cualquier excepción no controlada durante el render (por ejemplo, un campo inesperadamente `undefined` en un documento de Firestore con forma distinta a la esperada, algo plausible dado el uso de "formato legacy" mencionado en `log-detail-dialog.tsx`) deja al usuario con una pantalla en blanco sin ningún mensaje ni forma de recuperarse salvo recargar la página manualmente.

### 🟡 Importante — Cobertura de try/catch desigual
Se contaron 51 bloques `try {` en todo `src/`, pero solo 12 archivos usan la forma `catch (error)` (varía el nombre de la variable de captura). En el directorio `dashboard/` hay 23 funciones `async (` en componentes de página, y buena parte de las operaciones de escritura en los hooks (`addDoc`/`updateDoc`/`deleteDoc` en `use-residents.ts`, `use-staff.ts`, etc.) **no** están envueltas en try/catch dentro del propio hook — dependen enteramente de que cada componente llamador lo haga. Esto funciona en los formularios revisados (que sí envuelven sus `onSubmit` en try/catch + toast), pero es un contrato implícito y frágil: no hay nada que impida a un futuro call-site olvidar el try/catch y dejar una promesa rechazada sin manejar.

### 🟡 Importante — Errores de listeners silenciados en consola, sin UI de error
Como se documentó en audit-01 (punto 2), el callback de error de `onSnapshot` en todos los hooks revisados hace `console.error(...)` y limpia el estado a vacío/null, pero ninguno expone un estado `error` consumible por la UI de forma consistente — la excepción es `use-family-logs.ts`, que sí expone `error: string | null` ([src/hooks/use-family-logs.ts:182](src/hooks/use-family-logs.ts#L182)), pero ese estado no se usa en ningún componente que lo consuma (`family-portal/page.tsx` no lo muestra). El resto de hooks (`use-residents`, `use-staff`, `use-logs`, `use-contracts`, `use-staff-contracts`, `use-settings`) ni siquiera exponen ese campo: un fallo de permisos o de red se traduce silenciosamente en "no hay datos" para el usuario final, indistinguible de una colección legítimamente vacía.

### 🟢 Correcto — Estados de loading presentes de forma consistente
Todas las páginas principales revisadas (`reports`, `contracts`, `residents`, `staff`, `logs`, `visitors`, `family-portal`) sí implementan un estado `isLoading` combinado de sus hooks antes de renderizar contenido, evitando parpadeos de "sin datos" mientras Firestore responde. El patrón está presente y funciona, solo está duplicado en vez de compartido (ver punto 1) y no distingue "cargando" de "error" (ver arriba).

---

## 5. `npm audit` y dependencias desactualizadas

### 🔴 Crítico — 5 vulnerabilidades críticas, 31 altas
`npm audit` (con `node_modules` instalado) reporta **70 vulnerabilidades: 5 críticas, 31 altas, 32 moderadas, 2 bajas**. Desglose por origen real:

| Paquete raíz en `package.json` | Severidad relevante | Vía (transitivas) | Fix disponible |
|---|---|---|---|
| `jspdf` (3.0.4, usado en producción) | 🔴 Crítica | Local File Inclusion, PDF Injection con ejecución de JS arbitrario, DoS por BMP malformado | `4.2.1` (**major**, requiere migrar) |
| `genkit` / `@genkit-ai/*` (código muerto, ver audit-01) | 🔴/🟡 Crítica y Alta | `protobufjs` (RCE), `@grpc/grpc-js`, `handlebars` (JS injection/XSS), `@opentelemetry/*`, `express`, `axios` (SSRF), `ws`, `google-cloud/firestore` | Actualizar a `1.28.0`/`0.5.17` (**major**) o eliminar el paquete por completo |
| `puppeteer` (24.17.1, sin uso en `src/`, ver audit-01) | 🟡 Alta | `@puppeteer/browsers`, `puppeteer-core`, `extract-zip` (path traversal), `basic-ftp` (path traversal crítico), `ws`, `tmp` | `25.10.0` (**major**) o eliminar el paquete |
| `next` (15.5.9) | 🟡 Alta | DoS en Image Optimizer, HTTP request smuggling en rewrites, `postcss`/`sharp` heredados | `15.5.25` (**no-major**, solo patch) |

**El 90%+ de las vulnerabilidades altas/críticas desaparecen solo con eliminar `genkit`, `@genkit-ai/*`, `genkit-cli` y `puppeteer`** (ya identificados como código completamente sin usar en la auditoría de funcionamiento) y actualizar `next` a un patch y `jspdf` a la v4.

### 🟡 Importante — Dependencias desactualizadas (`npm outdated`)
Además de lo anterior, destaca:
- `firebase` `11.10.0` → última `12.18.0` (major).
- `react` / `react-dom` `18.3.1` → última `19.2.8` (major; Next 15 soporta React 19 sin problema, el proyecto se quedó en React 18).
- `zod` `3.24.2` → última `4.5.4` (major; hay cambios de API entre v3 y v4).
- `date-fns` `3.6.0` → última `4.4.0` (major).
- Todo el set de `@radix-ui/react-*` tiene versiones "Wanted" (dentro del rango declarado en `package.json`) más nuevas que las instaladas — indica que ni siquiera se ha corrido `npm update` dentro de los rangos semver ya permitidos por el propio `package.json`.
- `typescript` `5.7.3` → última `5.9.3` dentro del rango declarado (`^5`), tampoco actualizado.

### 🟢 Mejora deseable
- No se detectó ninguna dependencia con vulnerabilidad crítica que esté además **directamente** en la ruta de código usada por el negocio, excepto `jspdf` (usado en `src/lib/pdf-generator.ts` y `log-detail-dialog.tsx`) — priorizar su actualización sobre el resto.

---

## Priorización sugerida (top 5)

1. 🔴 Eliminar `src/ai/` completo + dependencias `genkit`, `@genkit-ai/*`, `genkit-cli`, `puppeteer` — resuelve la mayoría de vulnerabilidades críticas/altas y elimina código muerto (coincide con la recomendación de audit-01).
2. 🔴 Unificar `residents/new` + `residents/edit` y `staff/new` + `staff/edit` en un solo componente de formulario parametrizado por modo, con el esquema Zod en un módulo compartido.
3. 🔴 Introducir un Context (o SWR/React Query) por colección de Firestore para eliminar listeners `onSnapshot` duplicados en la misma pantalla.
4. 🔴 Agregar `error.tsx` a nivel de `app/dashboard/` y `app/family-portal/` como Error Boundary mínimo de Next.js.
5. 🟡 Actualizar `jspdf` a v4 y `next` al último patch de la serie 15; auditar de nuevo tras eliminar Genkit/Puppeteer para confirmar el impacto real.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
