// =========================================================================
// 02-CRYPTO.JS — SHA-256 парол хешлаш
// «КОМПЛАЕНС-КАДР» v9.0
// =========================================================================

// -------------------- SHA-256 ХЕШ --------------------
async function sha256(message) {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    console.error("SHA-256 хато:", e);
    return null;
  }
}

// -------------------- ТУЗ (SALT) ЯРАТИШ --------------------
function generateSalt() {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    // Fallback: oddiy random
    return Math.random().toString(36).substring(2, 18) +
           Math.random().toString(36).substring(2, 18);
  }
}

// -------------------- ПАРОЛНИ ХЕШЛАШ --------------------
// Натижа: "salt$hash" кўринишида
async function hashPassword(password, salt = null) {
  const actualSalt = salt || generateSalt();
  const hash = await sha256(actualSalt + ":" + password);
  if (!hash) return null;
  return `${actualSalt}$${hash}`;
}

// -------------------- ПАРОЛНИ ТЕКШИРИШ --------------------
async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  if (!storedHash.includes("$")) return false;

  const [salt, originalHash] = storedHash.split("$");
  if (!salt || !originalHash) return false;

  const newHash = await sha256(salt + ":" + password);
  return newHash === originalHash;
}

// -------------------- ЭСКИ ПАРОЛНИ ХЕШГА ЎТКАЗИШ --------------------
// Биринчи киришда очиқ паролни хешга айлантиради
async function migratePasswordToHash(user, plainPassword) {
  if (!user || !plainPassword) return false;

  try {
    const passHash = await hashPassword(plainPassword);
    if (!passHash) return false;

    user.passHash = passHash;
    delete user.pass;

    console.log(`✅ ${user.login} пароли хешланди`);
    return true;
  } catch (e) {
    console.error("Парол хешлаш хато:", e);
    return false;
  }
}

// -------------------- БАРЧА ОЧИҚ ПАРОЛЛАРНИ ХЕШЛАШ --------------------
// Дастур биринчи марта ишга тушганда чақирилади
async function migrateAllPasswords() {
  if (!appState || !Array.isArray(appState.users)) return;

  let count = 0;

  for (const user of appState.users) {
    if (!user.passHash && user.pass) {
      const success = await migratePasswordToHash(user, user.pass);
      if (success) count++;
    }
  }

  if (count > 0) {
    saveState();
    console.log(`✅ ${count} та парол хешланди`);
  }
}

// -------------------- ЛОГ ----------
console.log("✅ 02-crypto.js юкланди");
