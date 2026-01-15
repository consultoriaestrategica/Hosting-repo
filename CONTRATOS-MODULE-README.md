# Módulo de Contratos - Guía de Reactivación

Este documento describe cómo el módulo de contratos ha sido ocultado temporalmente y cómo reactivarlo cuando esté listo.

## Estado Actual

El módulo de contratos está **OCULTO** pero **NO ELIMINADO**. El código permanece intacto y puede ser reactivado en cualquier momento.

## Archivos Ignorados Localmente

Los siguientes archivos tienen cambios locales que NO se subirán a producción automáticamente:

```bash
src/app/dashboard/contracts/new/page.tsx
src/lib/firebase.ts
```

Para ver estos archivos ignorados:
```bash
git ls-files -v | grep '^h'
```

## Cómo Reactivar el Módulo

### 1. Reactivar en el Menú de Navegación

**Archivo:** `src/components/dashboard-nav.tsx`

**Acción:** Descomentar las líneas 40-46:

```typescript
// Cambiar de:
// MÓDULO TEMPORAL: Contratos deshabilitado - descomentar cuando esté listo
// {
//   href: "/dashboard/contracts",
//   label: "Contratos",
//   icon: <BookUser className="h-5 w-5" />,
//   permission: "contracts"
// },

// A:
{
  href: "/dashboard/contracts",
  label: "Contratos",
  icon: <BookUser className="h-5 w-5" />,
  permission: "contracts"
},
```

**No olvides:** Restaurar el import de `BookUser`:
```typescript
import { Home, Users, ClipboardList, FileText, Settings, BookUser, HardHat, Car } from "lucide-react"
```

### 2. Reactivar en Perfil de Personal

**Archivo:** `src/app/dashboard/staff/[id]/staff-profile-content.tsx`

**Acciones necesarias:**

1. **Descomentar imports (líneas 4-5):**
```typescript
import { useStaffContracts } from "@/hooks/use-staff-contracts";
import NewStaffContractForm from "./new-staff-contract-form";
```

2. **Descomentar imports de UI (líneas 8-13):**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
```

3. **Descomentar iconos (línea 13):**
```typescript
import { User, Mail, Phone, Briefcase, DollarSign, Calendar, PlusCircle, Eye, Building } from "lucide-react";
import Link from "next/link";
```

4. **Descomentar hooks y estado (líneas 18-19):**
```typescript
const { contracts: staffContracts, isLoading: contractsLoading } = useStaffContracts();
const [isContractFormOpen, setIsContractFormOpen] = useState(false);
```

5. **Restaurar isLoading (línea 21):**
```typescript
const isLoading = staffLoading || contractsLoading;
```

6. **Descomentar contracts useMemo (líneas 25-30):**
```typescript
const contracts = useMemo(() => {
  if (!staffMember) return [];
  return staffContracts
      .filter(c => c.staffId === staffMember.id)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}, [staffContracts, staffMember]);
```

7. **Descomentar getStatusVariant (líneas 40-42):**
```typescript
const getStatusVariant = (status: string) => {
  return status === "Activo" ? "default" : "secondary";
};
```

8. **Descomentar sección de salario (líneas 110-116):**
```typescript
{contracts.length > 0 && (
  <TableRow>
    <TableCell className="font-medium flex items-center gap-2"><DollarSign className="h-4 w-4"/> Salario Actual</TableCell>
    <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(contracts[0].salary)}</TableCell>
  </TableRow>
)}
```

9. **Descomentar todo el Card de Historial de Contratos (líneas 125-189):**
Todo el bloque que comienza con `<Card>` y termina con `</Card>`.

### 3. Reactivar Archivos Ignorados Localmente

Si necesitas subir cambios en los archivos ignorados:

```bash
# Reactivar contracts/new/page.tsx
git update-index --no-assume-unchanged src/app/dashboard/contracts/new/page.tsx

# Reactivar firebase.ts
git update-index --no-assume-unchanged src/lib/firebase.ts
```

Luego puedes hacer git add y commit normal.

## Flujo Completo de Reactivación

```bash
# 1. Crear una rama para la reactivación
git checkout -b feature/reactivar-contratos

# 2. Editar los archivos según las instrucciones arriba

# 3. Probar localmente
npm run dev

# 4. Hacer commit
git add .
git commit -m "feat: reactivar módulo de contratos"

# 5. Push y merge
git push origin feature/reactivar-contratos
# Luego hacer merge a main desde GitHub o local
```

## Verificación

Después de reactivar, verificar:

- ✅ Aparece "Contratos" en el menú lateral
- ✅ En perfil de personal aparece sección "Historial de Contratos"
- ✅ El botón "Crear Contrato" funciona
- ✅ Se pueden ver detalles de contratos existentes
- ✅ No hay errores en la consola del navegador

## Soporte

Si tienes dudas sobre la reactivación, todos los cambios están en los commits:
- Commit de ocultación: `ee9330c`
- Merge a main: `eaf6953`

Puedes ver los cambios con:
```bash
git show ee9330c
```

---
**Última actualización:** 2026-01-15
**Estado:** Módulo oculto pero funcional
