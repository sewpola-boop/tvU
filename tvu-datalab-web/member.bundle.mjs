// lib/sysop-auth.ts
var encoder = new TextEncoder();
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))).map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function passwordHash(password, salt) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return Array.from(new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 1e5 }, material, 256))).map((x) => x.toString(16).padStart(2, "0")).join("");
}

// lib/member-auth.ts
var userKey = (username) => digest(username).then((id) => "auth/members/" + id);
var memberCookie = (token2, maxAge = 28800) => `__Host-tvu_member=${token2}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
var token = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map((x) => x.toString(16).padStart(2, "0")).join("");
async function limited(req, store, kind, max) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("oai-authenticated-user-id") || "shared", key = "auth/member-attempts/" + await digest(kind + ip), obj = await store.get(key), old = obj ? await obj.json() : null, now = Date.now(), rate = old && old.until > now ? old : { count: 0, until: now + 9e5 };
  if (rate.count >= max) return { allowed: false, key };
  const saved = await store.put(key, JSON.stringify({ ...rate, count: rate.count + 1 }), { onlyIf: obj ? { etagMatches: obj.etag } : { etagDoesNotMatch: "*" } });
  return { allowed: !!saved, key };
}
async function registerMember(req, store, input) {
  const username = input.username.trim().toLowerCase(), name = input.name.trim();
  if (!/^[a-z0-9][a-z0-9_-]{3,39}$/.test(username) || username === "admin") return { status: 400, error: "\uC544\uC774\uB514\uB294 admin\uC744 \uC81C\uC678\uD55C \uC601\uBB38\xB7\uC22B\uC790\xB7\uBC11\uC904\xB7\uD558\uC774\uD508 4~40\uC790\uB85C \uC785\uB825\uD558\uC138\uC694." };
  if (input.password.length < 8 || input.password.length > 128 || name.length < 1 || name.length > 80) return { status: 400, error: "\uC774\uB984\uACFC 8~128\uC790 \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694." };
  if (!(await limited(req, store, "signup", 10)).allowed) return { status: 429, error: "\uAC00\uC785 \uC694\uCCAD\uC774 \uB9CE\uC2B5\uB2C8\uB2E4. 15\uBD84 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694." };
  const salt = crypto.randomUUID(), key = await userKey(username), value = { username, name, salt, hash: await passwordHash(input.password, salt), version: crypto.randomUUID(), created: (/* @__PURE__ */ new Date()).toISOString() };
  const saved = await store.put(key, JSON.stringify(value), { onlyIf: { etagDoesNotMatch: "*" } });
  return saved ? { status: 201 } : { status: 409, error: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC544\uC774\uB514\uC785\uB2C8\uB2E4." };
}
async function loginMember(req, store, username, password) {
  const rate = await limited(req, store, "login", 10);
  if (!rate.allowed) return { status: 429, error: "\uB85C\uADF8\uC778 \uC2DC\uB3C4\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. 15\uBD84 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694." };
  const key = await userKey(username.trim().toLowerCase()), obj = await store.get(key), a = obj ? await obj.json() : null;
  const check = await passwordHash(password, a?.salt || "tvu-unknown-account");
  if (!a || a.hash !== check) return { status: 401, error: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  await store.delete(rate.key);
  const value = token();
  await store.put("auth/member-sessions/" + await digest(value), JSON.stringify({ key, version: a.version, expires: Date.now() + 288e5 }));
  return { status: 200, token: value, user: { username: a.username, name: a.name } };
}
async function memberSession(req, store) {
  const t = req.headers.get("cookie")?.match(/(?:^|;\s*)__Host-tvu_member=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!t) return null;
  const id = await digest(t), obj = await store.get("auth/member-sessions/" + id);
  if (!obj) return null;
  const s = await obj.json();
  if (s.expires < Date.now() || !/^auth\/members\/[a-f0-9]{64}$/.test(s.key)) return null;
  const objA = await store.get(s.key), a = objA ? await objA.json() : null;
  if (!a || a.version !== s.version) return null;
  return { id, user: { username: a.username, name: a.name } };
}
export {
  loginMember,
  memberCookie,
  memberSession,
  registerMember
};
