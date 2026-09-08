# Auditoría Consolidada — Hogar San Juan (hogarsanjuan.co)

Consolidación de las tres auditorías realizadas sobre el proyecto:
- **Fase 1 — Funcionamiento** (`audit-01-funcionamiento.md`): rutas, Firebase, PDF, portal familiar, consola/env, build.
- **Fase 2 — Deuda técnica** (`audit-02-deuda-tecnica.md`): duplicación de código, TypeScript, manejo de estado, cobertura de errores, `npm audit`.
- **Fase 3 — Estilos y UX** (`audit-03-estilos-ux.md`): consistencia del sistema de diseño, tokens vs. hardcode, responsive, accesibilidad, pantallas con diseño viejo.

Cada hallazgo indica entre corchetes de qué fase proviene, para poder consultar el detalle completo (metodología, comandos ejecutados, tablas de datos) en el documento original correspondiente.

---

## Resumen ejecutivo

- **Las reglas de Firestore y Storage no distinguen roles** (`request.auth != null` es la única condición): cualquier cuenta autenticada —incluidos los familiares— puede leer y escribir toda la base de datos y todos los archivos del sistema. El "Portal Familiar de solo lectura" y las restricciones por rol del panel son enteramente de interfaz, no de datos. **[Fase 1]**
- El hook `useResidents()` que alimenta el portal familiar descarga los datos médicos completos de **todos** los residentes al navegador de cada familiar, y encima se re-suscribe de forma duplicada (sin caché compartida) en hasta 17 componentes distintos del panel — el mismo hook concentra el hallazgo de seguridad más grave y el anti-patrón de estado más grave del proyecto. **[Fase 1 + Fase 2]**
- Varias rutas críticas del panel (`staff/[id]`, `staff/edit/[id]`, `residents/new`, `residents/edit/[id]`, `contracts/new`) no tienen ninguna verificación de permisos, a diferencia de otras 3 que sí la tienen — y coexisten tres mecanismos de guard de sesión distintos y no coordinados entre sí. **[Fase 1 + Fase 2]**
- **`npm audit` reporta 70 vulnerabilidades (5 críticas, 31 altas)**, pero ~90% desaparecen eliminando `genkit`/`@genkit-ai/*` y `puppeteer` — ya identificados como código muerto (flujos de IA nunca conectados a la app real). `jspdf` (sí usado en producción) tiene un fix crítico disponible que requiere subir de versión mayor. **[Fase 1 + Fase 2]**
- El **build de producción falla** en cualquier entorno limpio sin variables `NEXT_PUBLIC_FIREBASE_*` (no hay `.env.example`), porque una página "use client" se pre-renderiza estáticamente y ejecuta el SDK de Firebase durante la compilación en Node.js. **[Fase 1]**
- **Cero Error Boundaries** en toda la app y duplicación casi total (~500 líneas copiadas) entre los formularios "nuevo" y "editar" de residentes y de personal, sin componente ni esquema Zod compartido. **[Fase 2]**
- El rediseño responsive quedó **incompleto**: solo 2 de 10 pantallas del panel (`residents`, `logs`) recibieron el patrón de encabezado responsive; las otras 8 —incluidas justamente `residents/new`, `staff/new` y `contracts/new`, las mismas rutas sin protección de permisos— se quedaron con el header viejo, fijo y sin puntos de quiebre. **[Fase 3]**
- El texto de los **botones primarios y de acento no cumple contraste WCAG AA** (3.69:1 y 3.08:1 sobre un mínimo de 4.5:1) y al menos 14 botones solo-ícono de acciones destructivas (eliminar contacto/visita/foto) no tienen ningún nombre accesible. **[Fase 3]**

---

## 🔴 Hallazgos críticos

### 1. Reglas de Firestore sin control de rol — exposición total de la base de datos
`firestore.rules` completo: la única condición para leer o escribir **cualquier** colección (`staff`, `residents`, `dailyLogs`, `logs`, `resident_contracts`, `staff_contracts`, `settings`, `users`, `family_members`) es `request.auth != null`, sin verificar rol ni propiedad del documento. Cualquier cuenta autenticada —incluidos los familiares, que sí tienen cuenta real de Firebase Auth ([src/hooks/use-family-members.ts:180](src/hooks/use-family-members.ts#L180))— puede leer y escribir la base de datos completa directamente con el SDK del cliente. El propio código documenta que las reglas alguna vez fueron más estrictas (comentario en [src/hooks/use-family-members.ts:45-49](src/hooks/use-family-members.ts#L45-L49) que menciona `isAdmin() || isStaffByEmail()`, inexistente hoy). **[Fase 1]**

### 2. Reglas de Storage sin control de rol
[storage.rules:4-6](storage.rules#L4-L6): `allow read, write: if request.auth != null` para todos los paths del bucket. Un familiar autenticado puede leer, sobrescribir o borrar cualquier archivo (fotos médicas, contratos, evidencia) de cualquier residente si conoce o adivina la ruta (patrón: `contracts/{residentId}/{timestamp}_{filename}`, ver [contract-attachment.tsx:130](src/app/dashboard/components/contract-attachment.tsx#L130)). **[Fase 1]**

### 3. El portal familiar descarga los datos de TODOS los residentes al cliente, filtrando solo en UI
[src/hooks/use-residents.ts:124](src/hooks/use-residents.ts#L124) suscribe con `onSnapshot` a la colección `residents` **completa**, sin filtro por `residentId`; [src/app/family-portal/page.tsx:79-94](src/app/family-portal/page.tsx#L79-L94) recién filtra en el cliente cuál residente mostrar. El navegador de un familiar descarga en memoria el historial médico completo de todos los residentes del hogar. Este mismo hook es, además, el ejemplo central del anti-patrón de estado descrito en el punto 6: no hay forma de corregir la exposición de datos sin tocar el mismo código que ya hay que refactorizar por duplicación de listeners. **[Fase 1 + Fase 2, mismo archivo]**

### 4. Rutas sensibles del panel sin ninguna verificación de permisos
Solo 3 páginas usan `RouteGuard` ([staff/page.tsx:583](src/app/dashboard/staff/page.tsx#L583), [staff/new/page.tsx:167](src/app/dashboard/staff/new/page.tsx#L167), [settings/page.tsx:382](src/app/dashboard/settings/page.tsx#L382)). Estas **no** lo usan ni verifican `hasPermission` en ningún punto: `staff/[id]/page.tsx`, `staff/edit/[id]/page.tsx`, `residents/new/page.tsx`, `residents/edit/[id]/page.tsx`, `contracts/new/page.tsx`. Cualquier usuario del panel (incluso el rol de menor privilegio) puede navegar directamente a esas URLs y editar/crear registros de otros residentes, personal o contratos. **Nota de dependencia:** estas mismas 5 rutas son también las que en Fase 2 se identificaron para unificar (`new`+`edit` duplicados) y en Fase 3 como parte de las 8 pantallas con el header viejo — las tres correcciones deben hacerse en el mismo cambio. **[Fase 1 + Fase 2 + Fase 3, mismos archivos]**

### 5. No hay protección de rutas a nivel de servidor; tres mecanismos de guard distintos y no coordinados
No existe `middleware.ts`; toda protección ocurre en `useEffect` del cliente. Coexisten `AuthGuard` (usado solo en `dashboard/page.tsx`), `RouteGuard` (usado solo en 3 páginas) y un tercer patrón ad-hoc en [family-portal/layout.tsx:30-42](src/app/family-portal/layout.tsx#L30-L42) — ninguno comparte código ni convención, por lo que la cobertura real depende de que alguien recuerde envolver cada página individualmente (causa raíz directa del punto 4). **[Fase 1 + Fase 2]**

### 6. Sin Context ni caché compartida: listeners `onSnapshot` duplicados por pantalla
No existe ningún Context de React ni librería de cache (React Query/SWR) en el proyecto. Cada hook (`useResidents` invocado en 17 archivos, `useUser` en 14, `useStaff`/`useLogs` en 9, etc.) abre su propio listener sobre la colección **completa** cada vez que se invoca. En `/dashboard/residents/[id]`, tanto `resident-profile-content.tsx:129` como `new-log-form.tsx:186` llaman `useResidents()` de forma independiente: dos listeners simultáneos sobre toda la colección solo para esa pantalla. Multiplica lecturas facturables de Firestore y duplica estado en memoria. **[Fase 2]**

### 7. Formularios "nuevo" vs "editar" duplicados casi al 100%
`residents/new/page.tsx` (475 líneas) y `residents/edit/[id]/edit-resident-form.tsx` (505 líneas) declaran el mismo esquema Zod `residentFormSchema` de forma literal y casi la misma UI; mismo patrón entre `staff/new/page.tsx` (240 líneas) y `staff/edit/[id]/edit-staff-form.tsx` (252 líneas). Ya hay señales de divergencia entre las copias (`new/page.tsx` usa `Controller`/`FormDescription` que la versión de edición no tiene). **[Fase 2]**

### 8. Cero Error Boundaries en toda la aplicación
No existe `ErrorBoundary`, `componentDidCatch` ni ningún `error.tsx` de Next.js en el proyecto. Cualquier excepción de render (p. ej. un documento de Firestore con forma inesperada, algo plausible dado el "formato legacy" mencionado en `log-detail-dialog.tsx`) deja al usuario con pantalla en blanco sin recuperación. **[Fase 2]**

### 9. 70 vulnerabilidades en dependencias (5 críticas, 31 altas)
`npm audit` confirma 5 críticas y 31 altas. El ~90% proviene de `genkit`/`@genkit-ai/*` y `puppeteer` — ya identificados como **código completamente muerto** en Fase 1 (flujos de IA jamás importados desde la app). `jspdf` (3.0.4, sí usado en `pdf-generator.ts` y `log-detail-dialog.tsx`) tiene una vulnerabilidad crítica de Local File Inclusion/PDF Injection con fix disponible en la v4 (cambio mayor). **[Fase 1 + Fase 2, misma causa raíz]**

### 10. El build de producción falla sin variables de entorno de Firebase
En un entorno limpio (`npm install && npm run build` sin `.env`), `/dashboard/contracts` falla al pre-renderizarse estáticamente porque ejecuta el SDK de Firebase (`getAuth`) en Node.js durante el build, no solo en el navegador: `Error [FirebaseError]: Firebase: Error (auth/invalid-api-key)` detiene todo el build. No existe `.env.example` que documente qué variables se necesitan. Con variables (aun ficticias) el build sí completa limpio, sin errores de TypeScript. **[Fase 1]**

### 11. El encabezado de página responsive solo se aplicó a 2 de 10 pantallas
Solo `residents/page.tsx` y `logs/page.tsx` recibieron el patrón `flex-col gap-3 sm:flex-row` + título `text-2xl md:text-3xl`. Las otras 8 (`staff`, `reports`, `visitors`, `settings`, `contracts`, y las tres pantallas "nuevo registro": `residents/new`, `staff/new`, `contracts/new`) conservan `flex items-center` sin wrap y `text-3xl` fijo — en móvil angosto, título largo + botón con `ml-auto` compiten por espacio sin punto de quiebre que los apile. Confirma que el commit "overhaul responsive... across all views" no cubrió realmente todas las vistas. **Nota de dependencia:** 3 de estas 8 pantallas (`residents/new`, `staff/new`, `contracts/new`) son exactamente las mismas que en el punto 4 (sin permisos) y el punto 7 (formularios duplicados) — un solo refactor de esos archivos puede resolver las tres cosas a la vez. **[Fase 3]**

### 12. Contraste WCAG AA fallido en botones primarios, de acento y texto secundario
Ratios de contraste reales calculados sobre los tokens de `globals.css`: `primary-foreground` sobre `primary` (texto de casi todos los botones de acción de la app) = **3.69:1**; `accent-foreground` sobre `accent` = **3.08:1**; `muted-foreground` sobre `background`/`card` (todo el texto secundario/ayudas de formulario) = **3.12-3.45:1**. El mínimo WCAG AA para texto normal es 4.5:1 — los tres fallan. El texto principal (`foreground`/`card-foreground`) sí tiene contraste excelente (9.78:1 y 10.81:1). **[Fase 3]**

---

## 🟡 Hallazgos importantes

### Seguridad y permisos
- **Fail-open en login de personal**: si una cuenta de Firebase Auth no tiene documento en `users`, `staff` ni `family_members`, [login/page.tsx:161-169](src/app/login/page.tsx#L161-L169) la deja entrar igual a `/dashboard` asumiendo "rol administrativo heredado por compatibilidad" — cualquier cuenta huérfana obtiene acceso completo. **[Fase 1]**
- El rol `"Acceso Familiar"` en `ROLE_PERMISSIONS` ([src/types/user.ts:93-97](src/types/user.ts#L93-L97)) nunca se usa en la práctica: `useUser` busca en la colección `staff`, donde los familiares nunca tienen documento — es un arreglo de permisos desconectado del flujo real del portal familiar. **[Fase 1]**

### Manejo de errores y estado
- Los errores de `onSnapshot` en todos los hooks de datos solo se registran con `console.error` y limpian el estado a vacío/null; ninguno expone un estado `error` consumible por la UI de forma consistente (la única excepción, `use-family-logs.ts`, expone `error` pero ningún componente lo consume). Un fallo de permisos o de red es indistinguible de "no hay datos" para el usuario final. **[Fase 1 + Fase 2]**
- Las escrituras (`addDoc`/`updateDoc`/`deleteDoc`) dentro de los hooks no están envueltas en try/catch — dependen enteramente de que el componente llamador lo haga. Funciona hoy porque los formularios revisados sí lo hacen, pero es un contrato implícito y frágil. Solo 12 de 51 bloques `try {` en el proyecto usan `catch (error)` de forma explícita. **[Fase 1 + Fase 2]**
- Prop drilling de callbacks de mutación: al no existir Context, cada hook devuelve datos + funciones de escritura juntos, acoplando cualquier componente que solo necesita escribir un campo a la colección completa. **[Fase 2]**
- El patrón "esperar auth antes de suscribir" (`unsubAuth`/`unsubSnapshot` anidados) está copiado casi línea por línea en 6 hooks (`use-residents`, `use-staff`, `use-logs`, `use-contracts`, `use-staff-contracts`, `use-settings`) en vez de extraerse a un hook base (`useAuthedSnapshot`). **[Fase 2]**
- Tres mecanismos de guard de autenticación (`AuthGuard`, `RouteGuard`, efecto ad-hoc de `family-portal/layout.tsx`) sin código ni convención compartida — ver también hallazgo crítico 5. **[Fase 2]**

### PDF y reportes
- Conviven **tres sistemas de generación de PDF**: `src/lib/pdf-generator.ts` (jsPDF+autotable, el realmente usado), `log-detail-dialog.tsx` (html2canvas+jsPDF, captura de pantalla), y `src/ai/flows/report-flow.ts` (Genkit+`@react-pdf/renderer`, código muerto sin ninguna referencia real). Cada uno reimplementa su propio `formatDate`/`calculateAge`. **[Fase 1 + Fase 2]**
- El método de captura de pantalla (html2canvas) genera texto no seleccionable y depende de que Storage tenga CORS configurado para imágenes remotas — no se encontró `cors.json` en el repo para confirmarlo. **[Fase 1]**
- `generateAllLogsReport`/`generateDateRangeReport` construyen la tabla completa sin paginar; con miles de registros bloquearían el hilo principal (jsPDF es síncrono). No crítico al volumen actual. **[Fase 1]**

### TypeScript y calidad de código
- `any` recurrente en 66 de 114 archivos: casos concretos en `contracts/page.tsx:88,95`, `family-portal/page.tsx:102,107,343,418`, `use-residents.ts:170` (doble cast), `firestore-utils.ts:16-17`, `log-detail-dialog.tsx:135,169`. No hay ningún `@ts-ignore`/`@ts-nocheck` y `tsc --noEmit` compila limpio — el problema es puntual, no generalizado. **[Fase 2]**
- Markup de spinner de carga (`animate-spin rounded-full...`) copiado en al menos 8 archivos y el idioma `if (isLoading) return <div>Cargando...</div>` repetido literalmente en 7 archivos, en vez de un componente `<Spinner />`/`<LoadingScreen />` compartido. **[Fase 2]**
- Dependencias desactualizadas más allá de las vulnerables: `firebase` 11.10→12.18, `react`/`react-dom` 18.3→19.2 (Next 15 ya soporta React 19), `zod` 3.24→4.5, `date-fns` 3.6→4.4 (todos major); el set completo de `@radix-ui/react-*` y `typescript` tienen versiones "wanted" más nuevas dentro del propio rango semver declarado, sin ni siquiera un `npm update` reciente. **[Fase 2]**

### Consola, entorno y build
- 113 llamadas a `console.log/warn/error/debug` en 32 archivos, muchas con datos operativos (emails, IDs, nombres) en hooks críticos de autenticación familiar; confirmado que se ejecutan también durante el build/SSR, no solo en el navegador del usuario final. **[Fase 1]**
- No existe `.env.example` ni variables declaradas en `apphosting.yaml` — nada documenta qué variables se necesitan para compilar localmente (causa raíz del hallazgo crítico 10). **[Fase 1]**
- `npm run lint` no tiene ningún `.eslintrc*`/`eslint.config.*` en el repo — el lint nunca se ha corrido realmente pese a existir el script. **[Fase 1]**

### Estilos, tokens y consistencia visual
- El color del sidebar está definido en 3 lugares con valores ligeramente distintos: token Tailwind con HSL crudo (no vía variable CSS), regla CSS con hex hardcodeado en `globals.css:122-137` sobre el mismo elemento que ya recibe la clase `bg-sidebar`, y clases arbitrarias `text-[#hex]` en `dashboard/layout.tsx:61,64` y `dashboard-nav.tsx:111` — los tokens `sidebar-foreground`/`sidebar-hover-foreground` del config nunca se usan. **[Fase 3]**
- El verde institucional del PDF (`#5B8C6F`, `pdf-generator.ts:127-128`) ya diverge levemente del token `--primary` actual (`#5A9073`); mismo patrón entre el gradiente hardcodeado del login (`#F5F0E8`/`#E8EDE4`) y el token `--background` actual (`#F3EEE7`) — colores de marca copiados a mano que se desincronizan con el tiempo. **[Fase 3]**
- `font-headline` es un alias de Tailwind sin ninguna diferencia real con `font-body` (mismas fuentes del sistema) — resto de una dirección tipográfica anterior (probablemente una fuente display/serif) que se revirtió sin limpiar el token ni las 14 clases que lo referencian. **[Fase 3]**
- `ContractAttachment` ([contract-attachment.tsx:1-3](src/app/dashboard/components/contract-attachment.tsx#L1-L3)) está marcado `DEPRECATED` en su propio comentario pero sigue completo en el repo con estilos de una iteración anterior — riesgo de reconexión accidental. **[Fase 2 + Fase 3, mismo archivo]**

### Accesibilidad
- Al menos 14 de 39 botones solo-ícono (`size="icon"`) no tienen `aria-label` ni `sr-only`, incluyendo acciones destructivas: eliminar contacto/medicamento/teléfono en `residents/new/page.tsx` y su espejo en `edit-resident-form.tsx`, eliminar visita en `visitors/page.tsx:233,288`, menús "más acciones" en `residents/page.tsx:514` y `staff/page.tsx:338`, y ver/renombrar/eliminar foto en `new-log-form.tsx`. El patrón correcto (`sr-only`) sí existe en otras partes del código (`contracts/page.tsx:206`), solo no se aplicó parejo. **[Fase 3]**
- La vista previa de foto en [new-log-form.tsx:775](src/app/dashboard/residents/%5Bid%5D/new-log-form.tsx#L775) es un `<div onClick>` sin `role="button"`, `tabIndex` ni `onKeyDown` — no alcanzable por teclado ni anunciado por lector de pantalla, sobre evidencia fotográfica médica. **[Fase 3]**
- `aria-label` tiene 0 ocurrencias en todo el proyecto; tampoco se usa `aria-live`/`role="alert"` para reforzar los toasts de error/éxito. **[Fase 3]**
- 8 pantallas con el encabezado pre-overhaul (ver hallazgo crítico 11); tema oscuro completo (`globals.css:61-95`, paleta azul sin relación con la marca) definido pero sin ningún `ThemeProvider`/toggle que lo active en toda la app — dirección de diseño abandonada; meta viewport insertado manualmente y de forma inválida (fuera de `<head>`) en `family-portal/layout.tsx:69-70`, resto de una implementación anterior sin efecto real. **[Fase 3]**

---

## 🟢 Mejoras deseables

- **Puntos positivos confirmados** (vale la pena no rehacerlos): todos los listeners `onSnapshot` limpian correctamente su `unsubscribe` (sin fugas de memoria); `tsc --noEmit` compila sin errores; no hay `@ts-ignore` en el proyecto; no se encontraron variables de entorno sensibles mal expuestas; los tipos de dominio (`Resident`, `Log`, `FamilyMember`, `Staff`) están razonablemente bien definidos; los componentes base de `src/components/ui/` (shadcn) se reutilizan consistentemente sin reinvención; el patrón tabla-desktop/tarjetas-móvil **sí** se sincronizó bien en las 5 pantallas de listado; el breakpoint tablet (768-1023px) tiene al menos un ajuste real (columna oculta en la tabla de residentes); los formularios shadcn (`FormLabel`/`FormControl`) asocian labels correctamente; las imágenes tienen `alt` descriptivo; el documento declara `lang="es"`. **[Fase 1 + Fase 2 + Fase 3]**
- Eliminar `puppeteer` (~300 MB, sin uso en `src/`) y los flujos de Genkit deprecados (`contract-flow.ts`, `staff-contract-flow.ts`, `report-flow.ts`) — código muerto que también resuelve vulnerabilidades (ver crítico 9). **[Fase 1]**
- `src/ai/genkit.ts` inicializa `googleAI()` sin ninguna API key configurada en el repo — inofensivo hoy porque no se usa, pero fallaría en runtime si se reactivara. **[Fase 1]**
- `contracts/[id]/page.tsx:8-15` usa `props: any` como workaround de tipado de Next 15 para `params` async — válido pero enmascararía un error real si cambia la firma de la ruta. **[Fase 1 + Fase 2]**
- `colSpan={6}` desactualizado en el estado vacío de la tabla de residentes ([residents/page.tsx:447](src/app/dashboard/residents/page.tsx#L447)) cuando en `lg`+ hay 7 columnas reales — desalineación visual menor. **[Fase 3]**
- El resto de la paleta semántica (`background`, `card`, `border`, `destructive`, `chart-1..5`) está correctamente centralizada en variables CSS y se usa de forma consistente — el hardcodeo de color se concentra en 4 archivos `.tsx` + `globals.css` + `pdf-generator.ts`, no está generalizado. **[Fase 3]**

---

## Plan de acción sugerido

El orden prioriza (a) detener la exposición de datos activa, (b) agrupar correcciones que tocan **el mismo archivo o el mismo componente** para no reabrirlo dos veces, y (c) dejar la limpieza de bajo impacto para el final.

### Oleada 0 — Contención inmediata
1. **Reescribir `firestore.rules` y `storage.rules`** con verificación real de rol y de propiedad de documento (un familiar solo lee su `residents`/`resident_contracts`/`logs` por `residentId`, nunca la colección completa). *(Crítico 1, 2)*
2. **Eliminar el fallback "rol administrativo heredado"** en `login/page.tsx` — negar acceso si no hay registro en `users`/`staff`. *(Importante, seguridad)*

Esto detiene la fuga de datos activa; nada del resto del plan reduce el riesgo mientras esto no esté hecho.

### Oleada 1 — Unificar el control de acceso del panel (un solo cambio, no tres)
3. Reemplazar `AuthGuard` + `RouteGuard` + el efecto ad-hoc de `family-portal/layout.tsx` por **un único guard aplicado a nivel de `layout.tsx`** de `/dashboard` (y otro para `/family-portal`), que verifique sesión y permiso en un solo lugar. *(Crítico 5, arrastra Importante "tres guards")*
4. Como parte del mismo cambio, ese guard único ya cubre automáticamente `staff/[id]`, `staff/edit/[id]`, `residents/edit/[id]` — solo faltará agregar el `permission` correcto en `residents/new` y `contracts/new` cuando se toquen en la Oleada 2. *(Crítico 4)*

### Oleada 2 — Refactor conjunto de formularios nuevo/editar (mismo archivo, tres hallazgos)
5. Fusionar `residents/new` + `residents/edit/[id]` en un componente `ResidentForm` parametrizado por `mode`, con el esquema Zod en un módulo compartido; mismo tratamiento para `staff/new` + `staff/edit/[id]`. *(Crítico 7)*
6. Aprovechar esa misma reescritura para: (a) aplicar el guard de permisos de la Oleada 1 si aún falta, (b) aplicar el patrón de encabezado responsive (`flex-col sm:flex-row` + `text-2xl md:text-3xl`) que ya usan `residents`/`logs`. *(Crítico 4 y 11, resueltos en el mismo commit)*
7. Dar el mismo tratamiento de guard + header a `contracts/new` (no tiene contraparte "editar" que fusionar, pero comparte los otros dos pendientes). *(Crítico 4 y 11)*

### Oleada 3 — Cache de datos por colección (mismo hook que el hallazgo de seguridad)
8. Introducir un Context (o SWR/React Query) por colección de Firestore para `useResidents`/`useStaff`/`useLogs`/etc., eliminando los listeners duplicados por pantalla. *(Crítico 6)*
9. Dentro de ese mismo refactor de `useResidents`, corregir el filtrado del portal familiar para consultar solo el documento del `residentId` asignado en vez de la colección completa — es el mismo archivo que ya se está reescribiendo. *(Crítico 3)*
10. Aprovechar el refactor para exponer un estado `error` consistente desde cada hook (hoy solo `use-family-logs` lo hace) y conectarlo a un toast/banner visible. *(Importante, manejo de errores)*

### Oleada 4 — Eliminar código muerto y resolver vulnerabilidades (una sola limpieza)
11. Eliminar `src/ai/` completo + dependencias `genkit`, `@genkit-ai/*`, `genkit-cli`, `puppeteer` — resuelve el código muerto de Fase 1 y ~90% de las vulnerabilidades críticas/altas de Fase 2 en un solo cambio de bajo riesgo. *(Crítico 9)*
12. En la misma pasada por el módulo de PDF, decidir entre `pdf-generator.ts` (jsPDF) y `log-detail-dialog.tsx` (html2canvas) como único método, y actualizar `jspdf` a v4 para resolver su CVE crítico (cambio mayor, requiere probar los reportes generados). *(Crítico 9, Importante "tres sistemas de PDF")*
13. Actualizar `next` al último patch de la serie 15. *(Importante, dependencias)*
14. Eliminar `ContractAttachment` (ya deprecado) en la misma limpieza. *(Mejora deseable)*

### Oleada 5 — Error Boundaries
15. Agregar `error.tsx` a nivel de `app/dashboard/` y `app/family-portal/` como red de seguridad mínima de Next.js — se apoya en el estado de error ya expuesto por los hooks en la Oleada 3. *(Crítico 8)*

### Oleada 6 — Accesibilidad y tokens visuales (mismo archivo de tokens)
16. En una sola pasada por `globals.css`/`tailwind.config.ts`: subir el contraste de `primary`/`accent` hasta 4.5:1, y unificar el color del sidebar en un solo token CSS var (eliminando la regla hex duplicada y las clases arbitrarias). *(Crítico 12, Importante "sidebar triplicado")*
17. Agregar `aria-label`/`sr-only` a los ~14 botones ícono-solo detectados, priorizando las acciones destructivas. *(Importante, accesibilidad)*
18. Decidir si el tema oscuro se conecta (con `next-themes`) o se elimina de `globals.css`/`tailwind.config.ts`. *(Importante, diseño abandonado)*
19. Resincronizar el verde institucional del PDF y el gradiente del login con los tokens actuales — hacerlo junto con el punto 16 ya que se está ajustando la misma paleta. *(Importante)*

### Oleada 7 — Higiene general (bajo impacto, en paralelo o al final)
20. Publicar `.env.example` con las variables `NEXT_PUBLIC_FIREBASE_*` requeridas.
21. Configurar ESLint (`.eslintrc`/`eslint.config.*`) para que `npm run lint` funcione de verdad.
22. Quitar los 113 `console.log`/`error` de depuración, especialmente en hooks de autenticación familiar.
23. Evaluar y programar por separado las actualizaciones mayores no urgentes (`firebase` 12, `react` 19, `zod` 4, `date-fns` 4) dado que cada una implica revisar breaking changes.
24. Corregir el `colSpan` desactualizado en el estado vacío de la tabla de residentes.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
