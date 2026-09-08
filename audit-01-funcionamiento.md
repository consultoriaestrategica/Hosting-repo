# Auditoría de Funcionamiento — Hogar San Juan (hogarsanjuan.co)

**Alcance:** solo funcionamiento (rutas, Firebase, PDF, portal familiar, errores/consola, build). No se revisó estilo visual ni deuda técnica general.
**Método:** lectura de código fuente completo de `src/`, reglas de Firestore/Storage, y ejecución real de `npm install` + `npm run build` + `npm run typecheck` + `npm run lint` en un entorno limpio.

## Resumen ejecutivo

El hallazgo dominante de esta auditoría es que **las reglas de seguridad de Firestore y Storage no distinguen roles**: cualquier cuenta autenticada —incluidas las de familiares— puede leer y escribir *toda* la base de datos (residentes, personal, contratos, ajustes, usuarios) y *todos* los archivos del Storage. El Portal Familiar es "de solo lectura" únicamente por diseño de la interfaz, no por control de acceso real: el hook que alimenta esa página descarga los datos completos de **todos** los residentes al navegador del familiar y filtra al que le corresponde solo en el cliente.

Además, el build de producción falla en un entorno limpio sin variables de entorno de Firebase (no hay `.env.example`), varias rutas del panel de administración carecen de cualquier verificación de permisos (a diferencia de otras que sí la tienen), y conviven tres sistemas distintos de generación de PDF, uno de ellos código muerto junto con dependencias de IA (Genkit) sin usar.

Los puntos positivos: todos los listeners `onSnapshot` revisados limpian correctamente su `unsubscribe`, no hay fugas de memoria; TypeScript compila sin errores; y no se encontraron variables de entorno sensibles expuestas incorrectamente en el cliente (las claves de Firebase en `NEXT_PUBLIC_*` son públicas por diseño).

---

## 1. Rutas (App Router)

### 🔴 Crítico — Rutas sensibles sin verificación de permisos
Solo tres páginas usan el componente `RouteGuard` para exigir un permiso antes de renderizar contenido:
- [src/app/dashboard/staff/page.tsx:583](src/app/dashboard/staff/page.tsx#L583)
- [src/app/dashboard/staff/new/page.tsx:167](src/app/dashboard/staff/new/page.tsx#L167)
- [src/app/dashboard/settings/page.tsx:382](src/app/dashboard/settings/page.tsx#L382)

Las siguientes rutas **no** importan `RouteGuard` ni llaman `hasPermission` en ningún punto (confirmado por búsqueda en todo el archivo):
- [src/app/dashboard/staff/[id]/page.tsx](src/app/dashboard/staff/%5Bid%5D/page.tsx) — perfil completo de cualquier empleado
- [src/app/dashboard/staff/edit/[id]/page.tsx](src/app/dashboard/staff/edit/%5Bid%5D/page.tsx) — edición de cualquier empleado
- [src/app/dashboard/residents/new/page.tsx](src/app/dashboard/residents/new/page.tsx) — creación de residentes
- [src/app/dashboard/residents/edit/[id]/page.tsx](src/app/dashboard/residents/edit/%5Bid%5D/page.tsx) — edición de cualquier residente
- [src/app/dashboard/contracts/new/page.tsx](src/app/dashboard/contracts/new/page.tsx) — creación de contratos

Según `ROLE_PERMISSIONS` ([src/types/user.ts:87-92](src/types/user.ts#L87-L92)), el rol de menor privilegio ("Personal de Cuidado") no debería poder gestionar personal ni contratos, pero al no haber verificación en estas páginas, cualquier usuario del panel puede acceder directamente escribiendo la URL, aunque el menú lateral no muestre el enlace.

### 🔴 Crítico — No hay protección de rutas a nivel de servidor
No existe `middleware.ts` en el proyecto. Toda la protección de `/dashboard` y `/family-portal` ocurre en un `useEffect` del lado del cliente ([src/app/family-portal/layout.tsx:38-41](src/app/family-portal/layout.tsx#L38-L41)) que redirige *después* de que el componente ya se montó. Combinado con el punto 2 (reglas de Firestore abiertas), esto no es solo un detalle de UX: los datos ya son accesibles vía SDK antes de que cualquier redirect ocurra.

### 🟡 Importante — Fail-open en login de personal
[src/app/login/page.tsx:161-169](src/app/login/page.tsx#L161-L169): si una cuenta de Firebase Auth no tiene documento en `users`, `staff` ni `family_members`, el sistema la deja entrar igual a `/dashboard`, asumiendo "rol administrativo heredado" ("compatibilidad"). Es una política de autorización *fail-open*: cualquier cuenta huérfana de Firebase Auth obtiene acceso de panel completo.

### 🟢 Mejora deseable
- No se encontraron rutas rotas ni duplicadas; la convención `new/[id]/edit/[id]` es consistente entre `residents`, `staff` y `contracts`.
- [src/app/dashboard/contracts/[id]/page.tsx:8-15](src/app/dashboard/contracts/%5Bid%5D/page.tsx#L8-L15) usa `props: any` con un comentario que dice que "Next.js genera tipos incorrectos" para `params` async — es un parche funcional válido en Next 15, pero enmascararía un error real de tipos si cambia la firma de la ruta.

---

## 2. Integración con Firebase

### 🔴 Crítico — Reglas de Firestore sin control de rol
[firestore.rules](firestore.rules) completo: la única condición para leer o escribir **cualquier** colección (`staff`, `residents`, `dailyLogs`, `logs`, `resident_contracts`, `staff_contracts`, `settings`, `users`, `family_members`) es `request.auth != null`. No hay verificación de rol, de propiedad del documento, ni de que un familiar solo pueda ver a su residente asignado. Cualquier cuenta autenticada —incluidos los familiares, que sí tienen cuenta real de Firebase Auth vía `signInWithEmailAndPassword` ([src/hooks/use-family-members.ts:180](src/hooks/use-family-members.ts#L180))— puede leer y escribir la base de datos completa directamente con el SDK del cliente (por ejemplo desde la consola del navegador), sin pasar por la interfaz.

Esto contradice el propio comentario del código en [src/hooks/use-family-members.ts:45-49](src/hooks/use-family-members.ts#L45-L49), que documenta que "las Firestore rules requieren `isAdmin() || isStaffByEmail()`" para leer `family_members` — evidencia de que las reglas se debilitaron/simplificaron en algún momento sin actualizar el código ni los comentarios que las describen.

### 🔴 Crítico — Reglas de Storage sin control de rol
[storage.rules:4-6](storage.rules#L4-L6): `allow read, write: if request.auth != null` para **todos** los paths del bucket. Un familiar autenticado puede leer, sobrescribir o borrar cualquier archivo (fotos médicas, contratos en PDF, evidencia fotográfica) de cualquier residente si conoce o adivina la ruta (patrón usado: `contracts/{residentId}/{timestamp}_{filename}`, ver [src/app/dashboard/components/contract-attachment.tsx:130](src/app/dashboard/components/contract-attachment.tsx#L130)).

### 🔴 Crítico — Filtrado de datos del portal familiar solo en cliente
[src/hooks/use-residents.ts:124](src/hooks/use-residents.ts#L124) suscribe con `onSnapshot` a la colección `residents` **completa**, sin filtro por `residentId`. [src/app/family-portal/page.tsx:79-94](src/app/family-portal/page.tsx#L79-L94) recién filtra en el cliente cuál residente mostrar. Es decir: el navegador de un familiar descarga en memoria los datos médicos completos (historial médico, alergias, medicamentos, contactos familiares, documentos) de **todos** los residentes del hogar, no solo del suyo. Cualquier familiar con DevTools abierto puede inspeccionar el historial clínico de otros residentes sin ningún esfuerzo adicional.

### 🟡 Importante — Manejo de errores en llamadas async
- Todos los hooks revisados (`use-residents`, `use-staff`, `use-logs`, `use-contracts`, `use-staff-contracts`, `use-settings`, `use-family-auth`, `use-family-logs`, `use-family-members`) manejan el callback de error de `onSnapshot` con `console.error` y limpian el estado local. Sin embargo, ese error solo queda en consola: no hay ninguna UI (toast/banner) que le avise al usuario que una suscripción en tiempo real falló por permisos o red — simplemente ve listas vacías.
- Las operaciones de escritura (`addDoc`/`updateDoc`/`deleteDoc`) dentro de los hooks no están envueltas en try/catch; dependen de que el componente que las invoca capture la excepción. En los formularios revisados esto se maneja bien con try/catch + toast, pero es un patrón frágil ante nuevos call-sites.

### 🟢 Sin fugas de memoria en listeners
Se revisaron los 12 archivos que usan `onSnapshot` (`use-contracts`, `use-staff-contracts`, `use-staff`, `use-logs`, `use-settings`, `use-residents`, `use-family-auth`, `use-family-logs`, `use-family-members`, `family-auth-core`, `contract-attachment.tsx`, y el propio `use-user.ts`). **Todos** retornan correctamente su función de limpieza en el `useEffect`, incluido el patrón "unsubscribe anidado" (auth → Firestore) usado en `use-residents.ts` y similares. No se encontraron listeners huérfanos.

---

## 3. Generación de reportes PDF

### 🟡 Importante — Tres sistemas de PDF distintos
1. [src/lib/pdf-generator.ts](src/lib/pdf-generator.ts) (jsPDF + jspdf-autotable) — el que realmente usa [src/app/dashboard/reports/page.tsx](src/app/dashboard/reports/page.tsx).
2. [src/app/dashboard/components/log-detail-dialog.tsx:204-236](src/app/dashboard/components/log-detail-dialog.tsx#L204-L236) (html2canvas + jsPDF, captura de pantalla a imagen) — exporta un registro individual.
3. [src/ai/flows/report-flow.ts](src/ai/flows/report-flow.ts) (Genkit + `@react-pdf/renderer`, server action) — **código muerto**: `generatePdfReport` no se importa desde ningún componente de `src/app` (verificado por búsqueda global).

Mantener tres implementaciones triplica el riesgo de que los reportes luzcan o calculen distinto entre sí (formatos de fecha, cálculo de edad, etc.).

### 🟡 Importante — Limitaciones del método basado en captura de pantalla
El método 2 convierte el DOM a una imagen PNG e la inserta en el PDF: el texto queda no seleccionable/copiable y el archivo pesa más que uno con texto real. Usa `useCORS: true`, pero su funcionamiento depende de que el bucket de Storage tenga CORS configurado para las imágenes remotas — no se encontró ningún archivo `cors.json` en el repo, por lo que no se pudo confirmar que esa configuración exista.

### 🟡 Importante — Rendimiento con documentos grandes
`generateAllLogsReport` y `generateDateRangeReport` ([src/lib/pdf-generator.ts:392-437,607-645](src/lib/pdf-generator.ts#L392-L437)) construyen la tabla completa con `autoTable` sin paginación ni límite de filas. jsPDF es síncrono, así que con varios miles de registros esto bloquearía el hilo principal del navegador durante segundos. No es crítico al volumen actual de un solo hogar, pero conviene vigilarlo si crece el número de residentes/registros históricos.

### 🟢 Mejora deseable — Dependencias muertas relacionadas a PDF/IA
- `puppeteer` (~300 MB con Chromium) está en `package.json` pero no se referencia en ningún archivo de `src/`.
- Los tres flujos de Genkit están deprecados sin uso real: [src/ai/flows/contract-flow.ts:32](src/ai/flows/contract-flow.ts#L32) y [src/ai/flows/staff-contract-flow.ts:27](src/ai/flows/staff-contract-flow.ts#L27) literalmente ejecutan `console.log("... is deprecated and should not be used for AI generation.")`.
- Si no hay plan de retomar generación de contratos/reportes por IA, se puede eliminar `src/ai/` completo junto con `genkit`, `@genkit-ai/*`, `@react-pdf/renderer` y `puppeteer` para simplificar el build.

---

## 4. Portal de acceso familiar

### 🔴 Crítico (referencia cruzada del punto 2)
El control de acceso del portal familiar es **enteramente de interfaz**: filtra en el cliente qué residente mostrar, pero no existe ninguna regla de servidor que impida a un familiar autenticado consultar datos de otros residentes o de otras colecciones (`staff`, `settings`, `resident_contracts`, `users`). Ver hallazgos de Firestore/Storage en el punto 2.

### 🟡 Importante — El sistema de permisos por rol no cubre al portal familiar
El rol `"Acceso Familiar"` definido en `ROLE_PERMISSIONS` ([src/types/user.ts:93-97](src/types/user.ts#L93-L97)) nunca se usa en la práctica: `useUser` ([src/hooks/use-user.ts:41-44](src/hooks/use-user.ts#L41-L44)) busca el usuario en la colección **`staff`**, y los familiares nunca tienen documento ahí (están en `family_members`). El portal familiar usa su propio hook (`useFamilyAuth`) sin ningún control granular más allá de "existe o no existe" el registro — el arreglo `ROLE_PERMISSIONS["Acceso Familiar"]` parece código muerto, no conectado al flujo real.

### 🟢 Correcto
- La página [src/app/family-portal/page.tsx:54](src/app/family-portal/page.tsx#L54) es de solo lectura tal como indica su propio comentario: no hay ningún botón de escritura en la UI para familiares. (Esto es solo una restricción de interfaz, no de datos — ver punto 2).

---

## 5. console.error/warnings y variables de entorno

### 🟡 Importante — 113 console.log/warn/error en 32 archivos, compilados en producción
Se detectaron 113 llamadas a `console.log/warn/error/debug` distribuidas en 32 archivos. La mayoría son trazas de depuración con emojis (🔐, 👨‍👩‍👧, 📡...) dejadas en hooks críticos: [src/hooks/use-family-auth.ts](src/hooks/use-family-auth.ts), [src/hooks/family-auth-core.ts](src/hooks/family-auth-core.ts), [src/hooks/use-family-logs.ts](src/hooks/use-family-logs.ts), [src/app/login/page.tsx](src/app/login/page.tsx). Se confirmó durante `npm run build` que este código se ejecuta también en el servidor: el prerenderizado estático de `/family-portal` imprimió literalmente `⏳ FamilyPortalLayout: Verificando autenticación...` en la consola del build. Esto expone en consola del navegador información operativa (emails, IDs de residentes, nombres) a cualquiera que abra DevTools, además de ensuciar los logs y dificultar detectar errores reales.

### 🟢 Variables de entorno correctamente referenciadas
No se encontraron variables de entorno sensibles hardcodeadas ni mal expuestas en el cliente. Las claves de Firebase en `src/lib/firebase.ts` y `src/lib/firebase-secondary.ts` usan `process.env.NEXT_PUBLIC_FIREBASE_*`, lo cual es correcto (son claves públicas por diseño del SDK de Firebase Web).

### 🟡 Importante — Sin `.env.example`, dependencia de config invisible
No existe ningún archivo `.env`/`.env.example` versionado en el repo, ni variables declaradas en [apphosting.yaml](apphosting.yaml) (solo define `runConfig.maxInstances`). Un desarrollador nuevo no tiene forma de saber, leyendo el repo, qué variables de entorno necesita para compilar localmente (ver punto 6).

### 🟢 Mejora deseable
`src/ai/genkit.ts` inicializa el plugin `googleAI()`, que requiere una API key de Google AI (`GEMINI_API_KEY`/`GOOGLE_API_KEY`). No se encontró esa variable configurada en ningún lado del repo. Como ese código no se usa actualmente (ver punto 3), no rompe nada hoy, pero si se reactiva algún flujo de Genkit fallará en runtime por falta de configuración.

---

## 6. Build de producción

### 🔴 Crítico — El build falla en un entorno limpio sin variables de Firebase
Al clonar el repo y ejecutar `npm install && npm run build` sin ninguna variable de entorno configurada:

```
Error occurred prerendering page "/dashboard/contracts"
Error [FirebaseError]: Firebase: Error (auth/invalid-api-key).
...
Export encountered an error on /dashboard/contracts/page: /dashboard/contracts, exiting the build.
```

Causa: `/dashboard/contracts` (marcada `○ Static`) se pre-renderiza estáticamente en el build, lo que ejecuta el SDK cliente de Firebase (`getAuth`, `onAuthStateChanged`) **en Node.js durante la compilación**, no solo en el navegador. Sin `NEXT_PUBLIC_FIREBASE_API_KEY` válido en ese momento, todo el build se detiene. Al proveer variables (incluso ficticias, con formato válido) el build sí completa correctamente: compiló en 40s, sin errores de TypeScript (`tsc --noEmit` limpio) y generó las 19 rutas esperadas. El riesgo real es para cualquier entorno de CI/build que no tenga esas variables inyectadas exactamente igual que en el pipeline actual de despliegue.

### 🟡 Importante — Lint no configurado
`npm run lint` invoca `next lint`, pero no existe ningún archivo `.eslintrc*` ni `eslint.config.*` en el repo. Al ejecutarlo, pide configurar ESLint desde cero de forma interactiva. En la práctica, **el lint nunca se ha corrido realmente** en este proyecto pese a existir el script — no fue posible evaluar warnings de React/Next porque no hay linter operativo.

### 🟡 Importante — Vulnerabilidades de dependencias
`npm install` reporta **70 vulnerabilidades (5 críticas, 31 altas, 32 moderadas, 2 bajas)**. Queda fuera del alcance estricto de "funcionamiento", pero puede afectar la estabilidad del build/despliegue; se recomienda un pase dedicado de `npm audit`.

### 🟢 Correcto
- `tsc --noEmit` no reportó ningún error de tipos.
- Con variables de entorno presentes, no hubo warnings adicionales de Next.js/React en la salida del build.
- El bundle más pesado es `/dashboard/reports` (437 kB First Load JS), consecuencia directa de cargar las distintas librerías de PDF ahí (ver punto 3); se reduciría bastante al consolidar el punto 3.

---

## Priorización sugerida (top 5 a corregir primero)

1. 🔴 Reescribir `firestore.rules` y `storage.rules` con verificación real de rol y de propiedad de documento (especialmente: un familiar solo debe poder leer su `resident_contracts`/`residents`/`logs` asociado a su `residentId`, nunca la colección completa).
2. 🔴 Cambiar `useResidents()` usado por el portal familiar para consultar solo el documento del residente asignado (`getDoc`/`onSnapshot` puntual por `residentId`), no la colección completa.
3. 🔴 Agregar `RouteGuard` (o equivalente) a `staff/[id]`, `staff/edit/[id]`, `residents/new`, `residents/edit/[id]`, `contracts/new`.
4. 🔴 Eliminar el fallback "rol administrativo heredado" en `login/page.tsx` — negar acceso si no hay registro en `users`/`staff`.
5. 🟡 Publicar un `.env.example` con las variables `NEXT_PUBLIC_FIREBASE_*` requeridas para poder compilar localmente.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
