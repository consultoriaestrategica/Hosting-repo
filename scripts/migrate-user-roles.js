/**
 * Migración de roles a Firestore: crea/actualiza `user_roles/{uid}` a partir
 * de los documentos existentes en `staff` y `family_members`, para que las
 * Firestore Security Rules puedan resolver el rol de un usuario por su UID
 * de Firebase Auth (las rules NO pueden hacer `where(email == ...)`, solo
 * pueden leer un documento por su path exacto).
 *
 * NO modifica ni renombra los documentos de `staff`/`family_members`
 * (así no se rompen referencias como `staff_contracts.staffId`).
 *
 * Requiere credenciales de Admin SDK:
 *   - Genera una clave de cuenta de servicio en Firebase Console
 *     (Configuración del proyecto > Cuentas de servicio > Generar nueva clave privada)
 *   - Guarda el JSON en un archivo local (NO lo subas al repo / git)
 *   - Ejecuta con la variable de entorno apuntando a ese archivo:
 *
 *       GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/migrate-user-roles.js
 *
 * Modos de uso:
 *   node scripts/migrate-user-roles.js
 *       Migra TODOS los documentos existentes de `staff` y `family_members`.
 *       Seguro de correr más de una vez (idempotente).
 *
 *   node scripts/migrate-user-roles.js --email correo@ejemplo.com
 *       Migra solo esa persona. Útil al dar de alta un nuevo miembro de
 *       personal: primero se crea su cuenta de Firebase Auth (fuera de esta
 *       app) y su documento en `staff`/`family_members` con el mismo email,
 *       y luego se corre este comando para vincularlos.
 *
 *   --dry-run (combinable con lo anterior)
 *       Corre exactamente el mismo proceso (lee staff/family_members,
 *       resuelve cada uid por email con el Admin SDK) pero NUNCA llama a
 *       .set() sobre user_roles. Solo imprime, para cada persona, el
 *       documento exacto que se escribiría. Sigue necesitando credenciales
 *       válidas de Admin SDK porque de verdad lee tu Firestore/Auth reales
 *       (nada más se salta el paso de escritura). Úsalo primero para
 *       revisar el resultado antes de correr la migración real.
 *
 * Requiere el paquete `firebase-admin` (agregado a devDependencies).
 */

const admin = require("firebase-admin");

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

async function getUidByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch (err) {
    if (err.code === "auth/user-not-found") return null;
    throw err;
  }
}

async function migrateStaff(db, filterEmail, dryRun) {
  const snap = await db.collection("staff").get();
  const results = { migrated: [], skipped: [] };

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const email = data.email;

    if (!email) {
      results.skipped.push({ docId: docSnap.id, reason: "sin campo email" });
      continue;
    }
    if (filterEmail && email !== filterEmail) continue;

    const uid = await getUidByEmail(email);
    if (!uid) {
      results.skipped.push({ docId: docSnap.id, email, reason: "no existe cuenta de Firebase Auth con ese email" });
      continue;
    }

    // updatedAt real (no el sentinel serverTimestamp()) solo para que el
    // --dry-run tenga algo legible que imprimir; en modo real se usa el
    // sentinel de siempre, que Firestore resuelve en el servidor.
    const payload = {
      kind: "staff",
      role: data.role || null,
      staffDocId: docSnap.id,
      email,
    };

    if (dryRun) {
      results.migrated.push({ uid, email, staffDocId: docSnap.id, role: data.role || null, payload });
      continue;
    }

    await db.collection("user_roles").doc(uid).set(
      { ...payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    results.migrated.push({ uid, email, staffDocId: docSnap.id, role: data.role || null, payload });
  }

  return results;
}

async function migrateFamilyMembers(db, filterEmail, dryRun) {
  const snap = await db.collection("family_members").get();
  const results = { migrated: [], skipped: [] };

  // El modelo actual (FamilyMember.residentId: string, y las reglas
  // de Firestore que usan igualdad simple en vez de "in") solo
  // soporta UN residente por cuenta. Si el mismo email aparece en más
  // de un documento de family_members (posible si se cargó a mano en
  // la consola de Firebase, nunca vía addFamilyMember()), tomamos el
  // primero que encontremos y dejamos el resto en "skipped" para
  // revisión manual, en vez de perder esa información en silencio.
  const byUid = new Map();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const email = data.email;

    if (!email) {
      results.skipped.push({ docId: docSnap.id, reason: "sin campo email" });
      continue;
    }
    if (filterEmail && email !== filterEmail) continue;
    if (!data.residentId) {
      results.skipped.push({ docId: docSnap.id, email, reason: "sin campo residentId" });
      continue;
    }

    const uid = await getUidByEmail(email);
    if (!uid) {
      results.skipped.push({ docId: docSnap.id, email, reason: "no existe cuenta de Firebase Auth con ese email" });
      continue;
    }

    if (byUid.has(uid)) {
      results.skipped.push({
        docId: docSnap.id,
        email,
        reason: `este uid ya se vinculó al documento ${byUid.get(uid).familyDocId} (residentId ${byUid.get(uid).residentId}); ` +
          `el modelo actual solo soporta un residente por cuenta familiar — revisar manualmente si esta persona debe ver dos residentes`,
      });
      continue;
    }

    byUid.set(uid, { email, residentId: data.residentId, familyDocId: docSnap.id });
  }

  for (const [uid, entry] of byUid) {
    const payload = {
      kind: "family",
      residentId: entry.residentId,
      familyDocId: entry.familyDocId,
      email: entry.email,
    };

    if (dryRun) {
      results.migrated.push({ uid, email: entry.email, residentId: entry.residentId, payload });
      continue;
    }

    await db.collection("user_roles").doc(uid).set(
      { ...payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    results.migrated.push({ uid, email: entry.email, residentId: entry.residentId, payload });
  }

  return results;
}

async function main() {
  const { email, dryRun } = parseArgs();
  initAdmin();
  const db = admin.firestore();

  if (dryRun) {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  DRY RUN — no se escribirá nada en user_roles.                 ║");
    console.log("║  Sí se leen datos reales de Firestore/Auth (getUidByEmail).     ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
  }
  console.log(email ? `Procesando solo: ${email}` : "Procesando TODOS los documentos de staff y family_members...");

  const staffResults = await migrateStaff(db, email, dryRun);
  const familyResults = await migrateFamilyMembers(db, email, dryRun);

  const verb = dryRun ? "Se crearía(n)" : "Migrados";
  const mark = dryRun ? "○" : "✓";

  console.log("\n=== STAFF ===");
  console.log(`${verb}: ${staffResults.migrated.length}`);
  staffResults.migrated.forEach((r) => {
    console.log(`  ${mark} ${r.email} -> user_roles/${r.uid}`);
    console.log(`      ${JSON.stringify(r.payload)}`);
  });
  if (staffResults.skipped.length) {
    console.log(`Omitidos (revisar manualmente): ${staffResults.skipped.length}`);
    staffResults.skipped.forEach((r) => console.log(`  ⚠ ${r.docId} (${r.email || "sin email"}): ${r.reason}`));
  }

  console.log("\n=== FAMILY_MEMBERS ===");
  console.log(`${verb}: ${familyResults.migrated.length}`);
  familyResults.migrated.forEach((r) => {
    console.log(`  ${mark} ${r.email} -> user_roles/${r.uid}`);
    console.log(`      ${JSON.stringify(r.payload)}`);
  });
  if (familyResults.skipped.length) {
    console.log(`Omitidos (revisar manualmente): ${familyResults.skipped.length}`);
    familyResults.skipped.forEach((r) => console.log(`  ⚠ ${r.docId} (${r.email || "sin email"}): ${r.reason}`));
  }

  const totalSkipped = staffResults.skipped.length + familyResults.skipped.length;
  if (totalSkipped > 0) {
    console.log(
      `\n⚠ Hay ${totalSkipped} documento(s) sin cuenta de Firebase Auth asociada. Esas personas NO podrán ` +
        `iniciar sesión hasta que se les cree la cuenta y se vuelva a correr este script (con --email para solo esa persona).`
    );
  }

  if (dryRun) {
    console.log("\nDRY RUN terminado — no se escribió nada en user_roles. Si esto se ve correcto, " +
      "corré el mismo comando sin --dry-run para aplicarlo de verdad.");
  } else {
    console.log("\nListo. Antes de publicar las reglas nuevas de Firestore, confirma en la consola de Firebase " +
      "que la colección user_roles tiene un documento por cada persona activa de staff y family_members.");
  }

  process.exit(totalSkipped > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error ejecutando la migración:", err);
  process.exit(1);
});
