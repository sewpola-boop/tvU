// lib/access.ts
function accessibleConfig(config, plan = "free") {
  if (plan === "admin") return config;
  const level = { free: 0, plus: 1, pro: 2 }, allowed = (access) => level[plan] >= level[access || "free"];
  const entries = Object.entries(config.home.blocks), denied = entries.filter(([, b]) => !allowed(b.access)), open = entries.filter(([, b]) => allowed(b.access));
  const ids = new Set(denied.flatMap(([, b]) => b.attachments.map((a) => a.datasetId))), publicIds = new Set(open.flatMap(([, b]) => b.attachments.map((a) => a.datasetId)));
  for (const id of publicIds) ids.delete(id);
  const news = new Set(denied.flatMap(([, b]) => b.newsIds || []));
  for (const [, b] of open) for (const id of b.newsIds || []) news.delete(id);
  return { ...config, datasets: config.datasets.filter((s) => !ids.has(s.id)), stories: config.stories.filter((s) => !news.has(s.id)), ranking: { ...config.ranking, rules: config.ranking.rules.filter((r) => !ids.has(r.datasetId)) }, home: { ...config.home, blocks: Object.fromEntries(entries.map(([id, b]) => [id, allowed(b.access) ? { ...b, locked: false } : { ...b, locked: true, body: "", attachments: [], newsIds: [], photos: [], rankingTheme: void 0 }])) } };
}

// lib/government-api.ts
async function fetchGovernmentAPI(source, secrets, fetcher = fetch) {
  const url = new URL(source.url);
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443" || !(/(^|\.)go\.kr$/.test(url.hostname) || ["kosis.kr", "www.kosis.kr", "apis.data.go.kr", "openapi.localfinance.go.kr"].includes(url.hostname))) throw Error("\uC815\uBD80\uAE30\uAD00 HTTPS API \uC8FC\uC18C\uB9CC \uC5F0\uACB0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
  const key = source.keyName ? secrets[source.keyName] : null;
  if (source.keyName && typeof key !== "string") throw Error("\uC11C\uBC84\uC5D0 \uD574\uB2F9 API \uC778\uC99D\uD0A4 \uBCC0\uC218\uB97C \uC124\uC815\uD558\uC138\uC694.");
  if (key) url.searchParams.set(source.keyParam || "serviceKey", String(key));
  const response = await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(1e4), headers: { Accept: "application/json, application/xml, text/xml" } });
  if (!response.ok) throw Error("API \uC751\uB2F5 \uC624\uB958: " + response.status);
  const reader = response.body?.getReader();
  if (!reader) throw Error("API \uC751\uB2F5\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 1e6) throw Error("\uBBF8\uB9AC\uBCF4\uAE30 \uC751\uB2F5\uC740 1MB \uC774\uD558\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4.");
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    await reader.cancel();
  }
  if (key) text = text.split(String(key)).join("[\uC778\uC99D\uD0A4 \uC228\uAE40]").split(encodeURIComponent(String(key))).join("[\uC778\uC99D\uD0A4 \uC228\uAE40]");
  return { ok: true, status: response.status, receivedAt: (/* @__PURE__ */ new Date()).toISOString(), bytes: size, preview: text.slice(0, 2e4), truncated: text.length > 2e4 };
}
export {
  accessibleConfig,
  fetchGovernmentAPI
};
