# Instrucciones Simples de Debugging (Sin Logs en Consola)

## Situación Actual

**Problema:** Los logs no aparecen en la consola, pero el sistema parece funcionar (aparece el toast "Evolución registrada").

## Solución: Agregamos Alertas Visuales

He agregado **alertas visuales** (popups) para que no dependas de la consola.

---

## Test 1: Guardar Evolución Parcial

### Pasos:

1. **Encuentra un registro médico**
2. **Click en "⋮"** (tres puntos)
3. **Click en "Agregar Evolución"**
4. **Llena el formulario:**
   - Nota: "Segunda evolución de prueba"
   - FC: 75
   - SpO₂: 98
5. **Click en "Guardar evolución"**

### Lo que DEBERÍAS ver:

1. **Alert 1:** "DEBUG: Guardando evolución para log [ID]"
   - Click en "OK"

2. **Alert 2:** "DEBUG: Evolución guardada en Firestore"
   - Click en "OK"

3. **Toast verde:** "Evolución registrada - Se agregó una evolución parcial al registro diario"

4. **El diálogo se cierra**

### Si NO ves las alertas:

❌ **Problema:** El código del formulario no se está ejecutando
- Esto significaría un error de JavaScript bloqueando la ejecución
- Verifica si hay errores rojos en la consola (tab "Console")

---

## Test 2: Ver Detalles del Log

### Pasos:

1. **Abre el mismo registro** que acabas de agregar una evolución
2. **En el diálogo de detalle, busca el botón "🐛 Debug"** (abajo a la izquierda)
3. **Click en "🐛 Debug"**

### Lo que DEBERÍAS ver:

**Alert:**
```
Evoluciones en este log: X

Ver consola para detalles completos
```

Donde **X** es el número de evoluciones.

### Interpretación:

- **Si dice "1 evolución"** → La evolución parcial NO se guardó (solo está la inicial)
- **Si dice "2 evoluciones"** → ✅ ¡La evolución parcial SÍ se guardó!
- **Si dice "3 o más"** → ✅ Múltiples evoluciones guardadas correctamente

---

## Test 3: Verificar en Consola (Después del botón Debug)

Después de hacer click en "🐛 Debug", **ahora sí deberían aparecer logs en consola:**

```
=== DEBUG LOG COMPLETO ===
Log: { id: "...", evolutionEntries: [...], ... }
evolutionEntries: [{ ... }, { ... }]
evolutionNotes: [...]
Evoluciones procesadas: [{ ... }, { ... }]
=========================
```

**Cuenta cuántos objetos hay en `evolutionEntries`:**
- **0 objetos** = Ninguna evolución guardada con el sistema nuevo
- **1 objeto** = Solo la evolución inicial
- **2+ objetos** = ✅ Las evoluciones parciales se están guardando

---

## Diagnóstico Rápido

### Escenario A: No aparecen las alertas al guardar

**Problema:** JavaScript está fallando antes de ejecutar el código.

**Qué hacer:**
1. Ve a la consola (F12 → Console)
2. Busca mensajes **rojos** (errores)
3. Comparte una captura de pantalla de los errores

---

### Escenario B: Las alertas aparecen pero el botón Debug dice "1 evolución"

**Problema:** La evolución se está "guardando" localmente pero NO en Firestore.

**Posibles causas:**
1. **Permisos de Firestore** - No tienes permiso para actualizar el documento
2. **Reglas de seguridad** - Firestore está rechazando la operación
3. **Error silencioso** - El `try/catch` está capturando un error

**Qué hacer:**
1. Click en el botón "🐛 Debug"
2. En la consola, busca entre `=== DEBUG LOG COMPLETO ===`
3. Mira el valor de `evolutionEntries:` en el log crudo
4. Si es `undefined` o `[]` (array vacío), el problema está en Firestore

---

### Escenario C: El botón Debug dice "2 o más evoluciones"

**✅ TODO FUNCIONA CORRECTAMENTE**

Si ves "2 evoluciones" o más, significa:
- La evolución parcial SÍ se guardó en Firestore
- El sistema está funcionando como debería
- Deberías ver ambas evoluciones en el diálogo

**Si no ves las evoluciones en pantalla pero el Debug dice que hay 2:**
- Problema de CSS/scroll
- Intenta hacer scroll en el diálogo
- Las evoluciones están ahí pero no se ven por un problema visual

---

## Verificación en Firebase Console

Si quieres estar 100% seguro, puedes verificar directamente en Firebase:

1. **Ve a Firebase Console** → Tu proyecto
2. **Firestore Database**
3. **Colección `logs`**
4. **Busca el documento** del log que estás probando
5. **Mira el campo `evolutionEntries`**

**Debería verse así:**

```json
evolutionEntries: [
  {
    id: "evo-123...",
    createdAt: "2026-01-15T10:30:00.000Z",
    createdTimeLabel: "10:30",
    note: "Paciente en buen estado...",
    heartRate: 72,
    ...
  },
  {
    id: "evo-456...",
    createdAt: "2026-01-15T14:15:00.000Z",
    createdTimeLabel: "14:15",
    note: "Segunda evolución de prueba",
    heartRate: 75,
    spo2: 98,
    ...
  }
]
```

Si solo ves 1 objeto en el array, las evoluciones parciales no se están guardando.

---

## Resumen de Acciones

1. ✅ **Agrega una evolución parcial** → Deberías ver 2 alertas
2. ✅ **Abre el detalle** → Click en botón "🐛 Debug"
3. ✅ **Lee el alert** → Dice cuántas evoluciones hay
4. ✅ **Revisa la consola** → Después del Debug, deberías ver logs

**Comparte:**
- ¿Viste las alertas al guardar?
- ¿Qué número dice el botón Debug?
- Captura de pantalla de lo que ves en la consola después del Debug

Con esa información sabré exactamente qué está fallando.
