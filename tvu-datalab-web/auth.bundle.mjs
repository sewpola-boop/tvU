// lib/sysop-auth.ts
var key = "auth/sysop.json";
var encoder = new TextEncoder();
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))).map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return Array.from(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 1e5 }, material, 256))).map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function account(store) {
  let obj = await store.get(key);
  if (!obj) {
    const salt = crypto.randomUUID(), value = { username: "admin", salt, hash: await passwordHash("1111", salt), version: crypto.randomUUID(), initial: true };
    await store.put(key, JSON.stringify(value), { onlyIf: { etagDoesNotMatch: "*" } });
    obj = await store.get(key);
  }
  if (!obj) throw Error("\uACC4\uC815\uC744 \uCD08\uAE30\uD654\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  return { value: await obj.json(), etag: obj.etag };
}
var cookie = (token, maxAge = 28800) => `__Host-tvu_sysop=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
async function session(req, store) {
  const token = req.headers.get("cookie")?.match(/(?:^|;\s*)__Host-tvu_sysop=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  const id = await digest(token), obj = await store.get("auth/sessions/" + id);
  if (!obj) return null;
  const value = await obj.json();
  if (value.expires < Date.now()) return null;
  const a = await store.get(key);
  if (!a || value.version !== (await a.json()).version) return null;
  return { id, ...value };
}
async function login(req, store, username, password) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("oai-authenticated-user-id") || "shared";
  const rateKey = "auth/attempts/" + await digest(ip), attempt = await store.get(rateKey), old = attempt ? await attempt.json() : null;
  const now = Date.now(), rate = old && old.until > now ? old : { count: 0, until: now + 9e5 };
  if (rate.count >= 5) return { status: 429, error: "\uB85C\uADF8\uC778 \uC2DC\uB3C4\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. 15\uBD84 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." };
  const a = (await account(store)).value;
  if (username !== a.username || await passwordHash(password, a.salt) !== a.hash) {
    const saved = await store.put(rateKey, JSON.stringify({ ...rate, count: rate.count + 1 }), { onlyIf: attempt ? { etagMatches: attempt.etag } : { etagDoesNotMatch: "*" } });
    return { status: saved ? 401 : 429, error: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  await store.delete(rateKey);
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((x) => x.toString(16).padStart(2, "0")).join("");
  await store.put("auth/sessions/" + await digest(token), JSON.stringify({ version: a.version, expires: now + 288e5 }));
  return { status: 200, token, initial: a.initial };
}
async function changePassword(store, current, next) {
  const a = await account(store);
  if (await passwordHash(current, a.value.salt) !== a.value.hash) return { status: 400, error: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  if (next.length < 4 || next.length > 128 || next === current) return { status: 400, error: "\uC0C8 \uBE44\uBC00\uBC88\uD638\uB294 \uD604\uC7AC\uC640 \uB2E4\uB978 4~128\uC790\uB85C \uC785\uB825\uD558\uC138\uC694." };
  const salt = crypto.randomUUID();
  const saved = await store.put(key, JSON.stringify({ ...a.value, salt, hash: await passwordHash(next, salt), version: crypto.randomUUID(), initial: false }), { onlyIf: { etagMatches: a.etag } });
  return saved ? { status: 200 } : { status: 409, error: "\uACC4\uC815 \uC815\uBCF4\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." };
}
export {
  account,
  changePassword,
  cookie,
  digest,
  login,
  passwordHash,
  session
};
