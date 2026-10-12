// lib/sysop-auth.ts
var encoder = new TextEncoder();
async function digest(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))).map((x) => x.toString(16).padStart(2, "0")).join("");
}

// lib/article-comments.ts
async function commentPrefix(articleId) {
  return "comments/" + await digest(articleId) + "/";
}
async function addAnonymousComment(store, articleId, body, rateIdentity) {
  if (typeof body !== "string" || !body.trim() || body.trim().length > 2e3) return { status: 400, error: "\uB313\uAE00\uC740 1~2,000\uC790\uB85C \uC785\uB825\uD558\uC138\uC694." };
  const key = "auth/comment-rate/" + await digest(rateIdentity), obj = await store.get(key), old = obj ? await obj.json() : null, now = Date.now(), rate = old && old.until > now ? old : { count: 0, until: now + 6e4 };
  if (rate.count >= 5) return { status: 429, error: "\uB313\uAE00\uC740 1\uBD84\uC5D0 5\uAC1C\uAE4C\uC9C0 \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." };
  const reserved = await store.put(key, JSON.stringify({ ...rate, count: rate.count + 1 }), { onlyIf: obj ? { etagMatches: obj.etag } : { etagDoesNotMatch: "*" } });
  if (!reserved) return { status: 429, error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC791\uC131\uD574 \uC8FC\uC138\uC694." };
  const comment = { id: crypto.randomUUID(), body: body.trim(), created: (/* @__PURE__ */ new Date()).toISOString() };
  await store.put(await commentPrefix(articleId) + comment.created + "_" + comment.id, JSON.stringify(comment));
  return { status: 201, comment };
}
async function listAnonymousComments(store, articleId, cursor) {
  if (!store.list) throw Error("\uB313\uAE00 \uC800\uC7A5\uC18C\uAC00 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  const prefix = await commentPrefix(articleId), page = await store.list({ prefix, limit: 50, cursor });
  const comments = await Promise.all(page.objects.map(async (o) => {
    const obj = await store.get(o.key);
    if (!obj) return null;
    const c = await obj.json();
    return { id: c.id, body: c.body, created: c.created };
  }));
  return { comments: comments.filter(Boolean), cursor: page.truncated ? page.cursor : null };
}
async function deleteAnonymousComment(store, articleId, id, created) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id) || typeof created !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(created)) return false;
  await store.delete(await commentPrefix(articleId) + created + "_" + id);
  return true;
}
function bestComment(comments) {
  return comments.filter((c) => c.likes + c.dislikes >= 3 && c.likes > c.dislikes).sort((a, b) => b.likes / (b.likes + b.dislikes) - a.likes / (a.likes + a.dislikes) || b.likes - a.likes || a.created.localeCompare(b.created))[0] || null;
}
async function voteComment(store, articleId, id, created, vote, identity) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id) || typeof created !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(created) || !["like", "dislike", null].includes(vote)) return { status: 400, error: "\uD3C9\uAC00 \uC815\uBCF4\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  const key = await commentPrefix(articleId) + created + "_" + id, actor = await digest(identity);
  for (let attempt = 0; attempt < 4; attempt++) {
    const obj = await store.get(key);
    if (!obj) return { status: 404, error: "\uC0AD\uC81C\uB418\uC5C8\uAC70\uB098 \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294 \uB313\uAE00\uC785\uB2C8\uB2E4." };
    const comment = await obj.json(), ballots = { ...comment.ballots };
    if (vote === null) delete ballots[actor];
    else ballots[actor] = vote;
    const saved = await store.put(key, JSON.stringify({ ...comment, ballots }), { onlyIf: { etagMatches: obj.etag } });
    if (saved) return { status: 200, comment: rateComment({ ...comment, ballots }, actor) };
  }
  return { status: 409, error: "\uD3C9\uAC00\uAC00 \uB3D9\uC2DC\uC5D0 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694." };
}
function rateComment(c, actor) {
  const votes = Object.values(c.ballots || {});
  return { id: c.id, body: c.body, created: c.created, likes: votes.filter((v) => v === "like").length, dislikes: votes.filter((v) => v === "dislike").length, myVote: actor ? c.ballots?.[actor] || null : null };
}
async function ratedComments(store, articleId, identity, cursor) {
  if (!store.list) throw Error("\uB313\uAE00 \uC800\uC7A5\uC18C\uAC00 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  const prefix = await commentPrefix(articleId), actor = identity ? await digest(identity) : void 0;
  let next;
  const comments = [];
  do {
    const page = await store.list({ prefix, limit: 100, cursor: next });
    for (let i = 0; i < page.objects.length; i += 20) {
      const batch = await Promise.all(page.objects.slice(i, i + 20).map(async (o) => {
        const obj = await store.get(o.key);
        return obj ? rateComment(await obj.json(), actor) : null;
      }));
      comments.push(...batch.filter((c) => !!c));
    }
    next = page.truncated ? page.cursor : void 0;
  } while (next);
  comments.sort((a, b) => a.created.localeCompare(b.created));
  const start = cursor && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  return { comments: comments.slice(start, start + 50), best: bestComment(comments), cursor: start + 50 < comments.length ? String(start + 50) : null };
}
export {
  addAnonymousComment,
  bestComment,
  commentPrefix,
  deleteAnonymousComment,
  listAnonymousComments,
  ratedComments,
  voteComment
};
