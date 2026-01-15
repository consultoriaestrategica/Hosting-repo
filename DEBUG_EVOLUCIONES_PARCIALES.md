# Guía de Debugging: Evoluciones Parciales No se Guardan

## Problema Reportado

Las evoluciones parciales no están siendo procesadas ni guardadas en las ventanas de diálogo.

## Logs de Depuración Agregados

Hemos agregado logs en **3 puntos críticos** del flujo:

### 1. Formulario de Evolución Parcial
**Archivo:** `src/app/dashboard/logs/partial-evolution-form.tsx`

**Logs agregados:**
```javascript
🟢 Formulario: Preparando guardar evolución
🟢 Log ID: "log-abc123"
🟢 Entry a guardar: { id: "...", note: "...", heartRate: 72, ... }
🟢 Log completo: { id: "log-abc123", evolutionEntries: [...], ... }
```

### 2. Hook useLogs
**Archivo:** `src/hooks/use-logs.ts`

**Logs agregados:**
```javascript
🔵 Intentando agregar evolución parcial: { logId: "log-abc123", entry: {...} }
✅ Evolución parcial guardada exitosamente en Firestore
// O si falla:
❌ Error al guardar evolución parcial en Firestore: [error]
```

### 3. Diálogo de Detalle
**Archivo:** `src/app/dashboard/components/log-detail-dialog.tsx`

**Logs existentes:**
```javascript
🔍 Log completo: { ... }
🔍 evolutionEntries en log: [{ ... }]
✅ Usando evolutionEntries (sistema nuevo) - 3 evoluciones encontradas
📊 Evoluciones mapeadas para mostrar: 3 [...]
```

---

## Procedimiento de Testing Paso a Paso

### Paso 1: Abrir Consola del Navegador

1. Presiona **F12** en tu navegador
2. Ve a la pestaña **"Console"**
3. Limpia la consola haciendo click en el ícono de 🗑️ (borrar)

---

### Paso 2: Crear un Nuevo Registro Médico (IMPORTANTE)

**⚠️ NOTA CRÍTICA:** Los registros ANTIGUOS (creados antes de esta actualización) NO tienen el campo `evolutionEntries`. Debes crear un **nuevo** registro para probar.

1. Ve al perfil de un residente
2. Tab "Registros" → Botón "Agregar Registro"
3. Selecciona "Médico"
4. Llena los campos:
   - Signos vitales (FC, FR, SpO₂, etc.)
   - Profesional: "Dr. Juan Pérez"
   - Tipo de visita: "Control rutinario"
   - Nota de evolución: "Paciente en buen estado general"
5. **Guarda** el registro

**Logs esperados en consola:**
```
(No habrá logs aún, esto es solo para crear el registro inicial)
```

---

### Paso 3: Agregar Primera Evolución Parcial

1. Encuentra el registro que acabas de crear
2. Click en el menú **"⋮"** (tres puntos)
3. Click en **"Agregar Evolución"**
4. Llena el formulario:
   - Nota: "Paciente presenta mejoría"
   - FC: 70
   - SpO₂: 99
   - Profesional: "Enf. María López"
5. Click en **"Guardar evolución"**

**Logs esperados en consola:**

```javascript
// ✅ FLUJO EXITOSO:
🟢 Formulario: Preparando guardar evolución
🟢 Log ID: "log-abc123"
🟢 Entry a guardar: {
  id: "...",
  createdAt: "2026-01-15T14:15:00.000Z",
  createdTimeLabel: "14:15",
  note: "Paciente presenta mejoría",
  heartRate: 70,
  spo2: 99,
  professionalName: "Enf. María López"
}
🟢 Log completo: { id: "log-abc123", evolutionEntries: [{ ... }], ... }
🔵 Intentando agregar evolución parcial: { logId: "log-abc123", entry: {...} }
✅ Evolución parcial guardada exitosamente en Firestore
✅ Formulario: Evolución guardada exitosamente
```

**Si ves esto, el guardado funciona correctamente.**

---

### Paso 4: Verificar que Aparece en el Detalle

1. **Cierra el diálogo** de evolución parcial (debería cerrarse automáticamente)
2. **Espera 1-2 segundos** (para que Firestore actualice)
3. Click en el mismo registro para **ver el detalle**
4. **Mira la consola**

**Logs esperados en consola:**

```javascript
🔍 Log completo: {
  id: "log-abc123",
  evolutionEntries: [
    { id: "evo-1", note: "Paciente en buen estado general", ... },
    { id: "evo-2", note: "Paciente presenta mejoría", ... }
  ],
  ...
}
🔍 evolutionEntries en log: [{ ... }, { ... }]
✅ Usando evolutionEntries (sistema nuevo) - 2 evoluciones encontradas
📊 Evoluciones mapeadas para mostrar: 2 [...]
```

**En el diálogo deberías ver:**
- Badge superior derecho: **"2 evoluciones"**
- Banner azul: "ℹ️ Este registro tiene 2 evoluciones registradas durante el día. Scroll para ver todas."
- **Evolución #1** con todos los detalles
- **Evolución #2** con todos los detalles

---

## Escenarios de Error y Diagnóstico

### ❌ Escenario 1: Error al Guardar en Firestore

**Logs en consola:**
```javascript
🟢 Formulario: Preparando guardar evolución
🟢 Log ID: "log-abc123"
🔵 Intentando agregar evolución parcial: { ... }
❌ Error al guardar evolución parcial en Firestore: FirebaseError: Missing or insufficient permissions
```

**Causa:** Permisos de Firestore incorrectos.

**Solución:**
1. Ve a Firebase Console → Firestore Database → Rules
2. Verifica que tienes permisos de escritura para la colección `logs`
3. Ejemplo de regla necesaria:
```javascript
match /logs/{logId} {
  allow read, write: if request.auth != null;
}
```

---

### ❌ Escenario 2: evolutionEntries No Existe en Log Antiguo

**Logs en consola al agregar evolución:**
```javascript
🟢 Formulario: Preparando guardar evolución
🟢 Log ID: "log-old123"
🟢 Log completo: {
  id: "log-old123",
  evolutionNotes: ["Nota antigua"],
  // ❌ NO tiene evolutionEntries
}
🔵 Intentando agregar evolución parcial: { ... }
✅ Evolución parcial guardada exitosamente en Firestore
```

**Luego, al ver el detalle:**
```javascript
🔍 evolutionEntries en log: [{ id: "evo-new", note: "Nueva evolución", ... }]
✅ Usando evolutionEntries (sistema nuevo) - 1 evolución encontrada
📊 Evoluciones mapeadas para mostrar: 1 [...]
```

**Observación:**
- Solo se muestra la evolución NUEVA que acabas de agregar
- No se muestra la evolución inicial (porque estaba en `evolutionNotes`, no en `evolutionEntries`)

**Solución:**
Esto es **comportamiento esperado** para logs antiguos. Para tener todas las evoluciones en el sistema nuevo:
1. Crear un **nuevo** registro médico (después de la actualización)
2. Ese registro tendrá `evolutionEntries` desde el inicio

---

### ❌ Escenario 3: No se Muestra en el Diálogo

**Logs al guardar:**
```javascript
✅ Evolución parcial guardada exitosamente en Firestore
✅ Formulario: Evolución guardada exitosamente
```

**Logs al ver detalle:**
```javascript
🔍 evolutionEntries en log: [{ ... }, { ... }]
✅ Usando evolutionEntries (sistema nuevo) - 2 evoluciones encontradas
📊 Evoluciones mapeadas para mostrar: 2 [...]
```

**PERO en el diálogo solo ves 1 evolución.**

**Causa:** Problema de renderizado en el componente.

**Verificación:**
1. Cuenta cuántos objetos hay en el log `📊 Evoluciones mapeadas para mostrar`
2. Si hay 2 objetos pero solo ves 1, es problema de CSS/scroll

**Solución:**
1. Intenta hacer **scroll** en el diálogo
2. Inspecciona el elemento con DevTools (F12 → Inspector)
3. Busca `.space-y-3` que contiene las evoluciones
4. Verifica que tenga `display: block` y no esté oculto

---

### ❌ Escenario 4: El Diálogo No se Cierra Después de Guardar

**Síntoma:** Guardas la evolución, ves el toast "Evolución registrada" pero el diálogo no se cierra.

**Causa:** El callback `onSaved()` no se está ejecutando.

**Verificación en consola:**
```javascript
✅ Formulario: Evolución guardada exitosamente
// Luego debería cerrarse el diálogo
```

**Solución temporal:** Cierra el diálogo manualmente y luego abre el detalle del log.

---

## Tabla de Verificación Rápida

| Paso | Qué Verificar | Log Esperado | ¿Funciona? |
|------|---------------|--------------|------------|
| 1 | ¿Se crea el log con evolutionEntries? | Al crear log NUEVO, debe tener `evolutionEntries: [...]` | ☐ |
| 2 | ¿Se abre el formulario de evolución? | Click en "⋮" → "Agregar Evolución" abre diálogo | ☐ |
| 3 | ¿Se envía a Firestore? | `🔵 Intentando agregar...` y `✅ guardada exitosamente` | ☐ |
| 4 | ¿Se actualiza el log en memoria? | `🔍 evolutionEntries en log: [{ ... }, { ... }]` | ☐ |
| 5 | ¿Se mapean correctamente? | `📊 Evoluciones mapeadas para mostrar: 2` | ☐ |
| 6 | ¿Se muestran en pantalla? | Ver "2 evoluciones" y banner azul | ☐ |
| 7 | ¿Se puede hacer scroll? | Ver todas las evoluciones con scroll | ☐ |

---

## Comandos Útiles para Debugging

### Ver todos los logs de un registro:

```javascript
// En consola del navegador, después de abrir un log:
// Los logs se mostrarán automáticamente, pero puedes filtrar:
console.table(evolutionEntries) // Si tienes acceso a la variable
```

### Inspeccionar Firestore directamente:

1. Ve a Firebase Console
2. Firestore Database
3. Colección `logs`
4. Busca el documento del log que estás probando
5. Verifica que tenga el campo `evolutionEntries` como array

**Estructura esperada en Firestore:**
```json
{
  "id": "log-abc123",
  "residentId": "res-xyz",
  "reportType": "medico",
  "evolutionEntries": [
    {
      "id": "evo-111",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "createdTimeLabel": "10:30",
      "note": "Paciente en buen estado...",
      "heartRate": 72,
      // ...
    },
    {
      "id": "evo-222",
      "createdAt": "2026-01-15T14:15:00.000Z",
      "createdTimeLabel": "14:15",
      "note": "Paciente presenta mejoría...",
      "heartRate": 70,
      // ...
    }
  ]
}
```

---

## Resumen

Los logs de depuración ahora te dirán **exactamente** dónde está el problema:

1. **🟢 Verde** = Formulario preparando/enviando datos
2. **🔵 Azul** = Hook intentando guardar en Firestore
3. **✅ Verde con check** = Operación exitosa
4. **❌ Rojo con X** = Error
5. **🔍 Lupa** = Leyendo datos para mostrar
6. **📊 Gráfica** = Datos procesados listos para renderizar

Sigue los pasos de testing y **comparte los logs de consola** que veas para diagnosticar el problema exacto.
