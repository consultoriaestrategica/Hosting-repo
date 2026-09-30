/**
 * Backfill de `permissions` en `staff/{id}`: recalcula el array de
 * permisos de CADA documento existente a partir de su `role`, igual
 * que ya hace el guardado normal desde la app (ver `ROLE_PERMISSIONS`
 * en src/types/user.ts, usado por staff-form.tsx y
 * dashboard/settings/page.tsx al crear/editar personal).
 *
 * Por qué hace falta: agregar una clave nueva a ROLE_PERMISSIONS (ej.
 * `close_shift_early`) en el código NO actualiza los documentos de
 * `staff` que ya existen en Firestore — `useUser().hasPermission()`
 * lee el array `permissions` YA GUARDADO en cada documento, y ese
 * array solo se recalcula cuando alguien abre el perfil de ese staff
 * y le da guardar. Sin este backfill, el personal existente no tendría
 * el permiso nuevo hasta que alguien reedite manualmente cada perfil.
 *
 * ROLE_PERMISSIONS está DUPLICADO aquí (no se puede importar el .ts
 * desde un script plano de Node sin agregar un transpilador) — si se
 * agregan o quitan permisos en src/types/user.ts, hay que reflejar el
 * mismo cambio aquí antes de volver a correr este script.
 *
 * Requiere credenciales de Admin SDK, igual que migrate-user-roles.js:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/backfill-staff-permissions.js
 *
 * Modos de uso:
 *   node scripts/backfill-staff-permissions.js
 *       Recalcula `permissions` en TODOS los documentos de `staff`.
 *       Idempotente: si el array ya coincide, no vuelve a escribir.
 *
 *   node scripts/backfill-staff-permissions.js --email correo@ejemplo.com
 *       Solo esa persona.
 *
 *   --dry-run (combinable con lo anterior)
 *       Imprime, para cada persona, el array de permisos actual vs el
 *       que se escribiría, pero nunca llama a .update(). Usalo primero
 *       para revisar antes de aplicar de verdad.
 *
 * Requiere el paquete `firebase-admin` (ya está en devDependencies por
 * migrate-user-roles.js).
 */

const admin = require("firebase-admin");

// ============================================================
// Copia de ROLE_PERMISSIONS (src/types/user.ts) — mantener en sync.
// ============================================================
const ROLE_PERMISSIONS = {
  "Administrador": [
    "manage_residents",
    "manage_staff",
    "manage_family",
    "view_reports",
    "create_reports",
    "edit_reports",
    "delete_reports",
    "manage_settings",
    "view_agenda",
    "manage_agenda",
    "access_all_modules",
    "close_shift_override",
    "close_shift_early",
  ],
  "Supervisor": [
    "view_residents",
    "view_staff",
    "view_reports",
    "create_reports",
    "edit_reports",
    "view_agenda",
    "manage_agenda",
    "close_shift_override",
    "close_shift_early",
  ],
  "Líder de Enfermería": [
    "manage_residents",
    "view_residents",
    "view_staff",
    "manage_family",
    "view_reports",
    "create_reports",
    "edit_reports",
    "view_agenda",
    "manage_agenda",
    "close_shift_early",
  ],
  "Personal de Cuidado": [
    "view_residents",
    "view_reports",
    "create_reports",
    "view_agenda",
    "close_shift_early",
  ],
  "Acceso Familiar": [
    "view_residents",
    "view_reports",
    "view_agenda",
  ],
};

// Mismo criterio de normalizacion que useUser() en src/hooks/use-user.ts:
// algunos documentos viejos de `staff` guardan el texto de "position"
// (Administrativo / Personal Asistencial) en el campo `role` en vez del
// UserRole interno — hay que resolverlo igual que lo hace la app al leer.
function normalizeRole(rawRole) {
  switch (rawRole) {
    case "Administrativo":
      return "Administrador";
    case "Personal Asistencial":
      return "Personal de Cuidado";
    case "Administrador":
    case "Supervisor":
    case "Líder de Enfermería":
    case "Personal de Cuidado":
    case "Acceso Familiar":
      return rawRole;
    default:
      return "Personal de Cuidado";
  }
}

function sameArray(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf("--email");
  const email = emailIndex !== -1 ? args[emailIndex + 1] : null;
  const dryRun = args.includes("--dry-run");
  return { email, dryRun };
}

function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function backfillStaffPermissions(db, filterEmail, dryRun) {
  const snap = await db.collection("staff").get();
  const results = { updated: [], unchanged: [], skipped: [] };

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const email = data.email;

    if (filterEmail && email !== filterEmail) continue;

    const rawRole = data.role || null;
    if (!rawRole) {
      results.skipped.push({ docId: docSnap.id, email, reason: "sin campo role" });
      continue;
    }

    const normalizedRole = normalizeRole(rawRole);
    const newPermissions = ROLE_PERMISSIONS[normalizedRole] || [];
    const currentPermissions = Array.isArray(data.permissions) ? data.permissions : [];

    if (sameArray(currentPermissions, newPermissions)) {
      results.unchanged.push({ docId: docSnap.id, email, role: normalizedRole });
      continue;
    }

    const entry = {
      docId: docSnap.id,
      email,
      role: normalizedRole,
      before: currentPermissions,
      after: newPermissions,
    };

    if (dryRun) {
      results.updated.push(entry);
      continue;
    }

    await db.collection("staff").doc(docSnap.id).update({
      permissions: newPermissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    results.updated.push(entry);
  }

  return results;
}

async function main() {
  const { email, dryRun } = parseArgs();
  initAdmin();
  const db = admin.firestore();

  if (dryRun) {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  DRY RUN — no se escribirá nada en staff/.                     ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
  }
  console.log(email ? `Procesando solo: ${email}` : "Procesando TODOS los documentos de staff...");

  const results = await backfillStaffPermissions(db, email, dryRun);

  const verb = dryRun ? "Se actualizaría(n)" : "Actualizados";
  const mark = dryRun ? "○" : "✓";

  console.log(`\n${verb}: ${results.updated.length}`);
  results.updated.forEach((r) => {
    console.log(`  ${mark} ${r.email || r.docId} (${r.role})`);
    console.log(`      antes:   ${JSON.stringify(r.before)}`);
    console.log(`      después: ${JSON.stringify(r.after)}`);
  });

  console.log(`\nYa estaban al día: ${results.unchanged.length}`);

  if (results.skipped.length) {
    console.log(`\nOmitidos (revisar manualmente): ${results.skipped.length}`);
    results.skipped.forEach((r) => console.log(`  ⚠ ${r.docId} (${r.email || "sin email"}): ${r.reason}`));
  }

  if (dryRun) {
    console.log("\nDRY RUN terminado — no se escribió nada. Si esto se ve correcto, corré el mismo " +
      "comando sin --dry-run para aplicarlo de verdad.");
  } else {
    console.log("\nListo. El personal existente ya tiene close_shift_early en su documento de staff " +
      "(si su rol lo incluye) sin necesidad de reeditar su perfil manualmente.");
  }

  process.exit(results.skipped.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error ejecutando el backfill:", err);
  process.exit(1);
});
