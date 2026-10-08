// lib/table-engine.ts
function calculate(s) {
  const cache = /* @__PURE__ */ new Map(), active = /* @__PURE__ */ new Set();
  function cell(r, c) {
    const key = `${r}:${c}`;
    if (cache.has(key)) return cache.get(key);
    if (r < 0 || r >= s.rows.length || c < 0 || c >= s.columns.length) throw Error("\uCC38\uC870 \uBC94\uC704 \uC624\uB958");
    if (active.has(key)) throw Error("\uC21C\uD658 \uCC38\uC870");
    if (active.size > 100) throw Error("\uCC38\uC870 \uAE4A\uC774 \uCD08\uACFC");
    active.add(key);
    try {
      const raw = s.columns[c].formula ? s.columns[c].formula.replaceAll("{row}", String(r + 1)) : s.rows[r][c] || "";
      const v = raw.trim().startsWith("=") ? expression(raw.trim().slice(1)) : raw.trim() !== "" && Number.isFinite(Number(raw.replaceAll(",", ""))) ? Number(raw.replaceAll(",", "")) : raw;
      cache.set(key, v);
      return v;
    } finally {
      active.delete(key);
    }
  }
  function numeric(r, c) {
    const v = cell(r, c);
    if (typeof v !== "number") throw Error(v === "" ? "\uBE48 \uC140 \uCC38\uC870" : "\uC22B\uC790\uAC00 \uC544\uB2CC \uC140 \uCC38\uC870");
    return v;
  }
  function expression(src) {
    const tokens = src.toUpperCase().match(/\d+(?:\.\d*)?|\.\d+|[A-Z]+\d+|[A-Z]+|[+\-*/^(),:%]|\S/g) || [];
    let pos = 0;
    const ref = (t) => {
      const m = /^([A-Z])([1-9]\d*)$/.exec(t);
      if (!m) throw Error("\uC140 \uC8FC\uC18C \uC624\uB958");
      return [Number(m[2]) - 1, m[1].charCodeAt(0) - 65];
    };
    function atom() {
      let t = tokens[pos++];
      if (t === "+" || t === "-") return (t === "-" ? -1 : 1) * atom();
      let n;
      if (t === "(") {
        n = add();
        if (tokens[pos++] !== ")") throw Error("\uB2EB\uB294 \uAD04\uD638 \uD544\uC694");
      } else if (/^\d|^\./.test(t || "")) n = Number(t);
      else if (/^[A-Z]\d+$/.test(t || "")) {
        const [r, c] = ref(t);
        n = numeric(r, c);
      } else if (["SUM", "AVG", "AVERAGE", "MIN", "MAX", "ROUND", "ABS"].includes(t)) {
        if (tokens[pos++] !== "(") throw Error("\uD568\uC218 \uAD04\uD638 \uD544\uC694");
        const values = [];
        if (tokens[pos] !== ")") while (true) {
          if (/^[A-Z]\d+$/.test(tokens[pos] || "") && tokens[pos + 1] === ":") {
            const [r1, c1] = ref(tokens[pos++]);
            pos++;
            const [r2, c2] = ref(tokens[pos++]);
            if (r2 < r1 || c2 < c1 || (r2 - r1 + 1) * (c2 - c1 + 1) > 1e4) throw Error("\uBC94\uC704 \uC624\uB958");
            for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
              const v = cell(r, c);
              if (v === "") continue;
              if (typeof v !== "number") throw Error("\uBC94\uC704\uC5D0 \uC22B\uC790\uAC00 \uC544\uB2CC \uAC12");
              values.push(v);
            }
          } else values.push(add());
          if (tokens[pos] !== ",") break;
          pos++;
        }
        if (tokens[pos++] !== ")" || !values.length) throw Error("\uD568\uC218 \uC778\uC218 \uC624\uB958");
        const sum = values.reduce((a, b) => a + b, 0);
        n = t === "SUM" ? sum : t === "AVG" || t === "AVERAGE" ? sum / values.length : t === "MIN" ? Math.min(...values) : t === "MAX" ? Math.max(...values) : t === "ABS" ? Math.abs(values[0]) : Math.round(values[0] * 10 ** (values[1] || 0)) / 10 ** (values[1] || 0);
        if (t === "ABS" && values.length !== 1 || t === "ROUND" && (values.length > 2 || !Number.isInteger(values[1] || 0) || Math.abs(values[1] || 0) > 10)) throw Error("\uD568\uC218 \uC778\uC218 \uC624\uB958");
      } else throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC218\uC2DD");
      while (tokens[pos] === "%") {
        pos++;
        n /= 100;
      }
      return n;
    }
    function power() {
      let n = atom();
      if (tokens[pos] === "^") {
        pos++;
        n = n ** power();
      }
      return n;
    }
    function mul() {
      let n = power();
      while (["*", "/"].includes(tokens[pos])) {
        const op = tokens[pos++], v = power();
        if (op === "/" && v === 0) throw Error("0\uC73C\uB85C \uB098\uB20C \uC218 \uC5C6\uC74C");
        n = op === "*" ? n * v : n / v;
      }
      return n;
    }
    function add() {
      let n = mul();
      while (["+", "-"].includes(tokens[pos])) {
        const op = tokens[pos++], v = mul();
        n = op === "+" ? n + v : n - v;
      }
      return n;
    }
    const result = add();
    if (pos !== tokens.length || !Number.isFinite(result)) throw Error("\uC218\uC2DD \uB610\uB294 \uACB0\uACFC \uC624\uB958");
    return result;
  }
  return s.rows.map((row, r) => s.columns.map((_, c) => {
    try {
      return { value: cell(r, c), error: "" };
    } catch (e) {
      return { value: "", error: e.message };
    }
  }));
}

// lib/access.ts
function accessibleConfig(config, plan = "free") {
  if (plan === "admin") return config;
  const level = { free: 0, plus: 1, pro: 2 }, allowed = (access) => level[plan] >= level[access || "free"];
  const effective = Object.fromEntries(Object.entries(config.home.blocks).map(([id, b]) => [id, b.access || "free"]));
  for (let pass = 0; pass < 100; pass++) {
    let changed = false;
    for (const [id, b] of Object.entries(config.home.blocks)) for (const link of [{ children: b.children, access: effective[id] }, ...b.attachments.map((a) => ({ children: a.children, access: level[a.access || "free"] > level[effective[id]] ? a.access : effective[id] }))]) for (const child of link.children || []) {
      if (effective[child] !== void 0 && level[effective[child]] < level[link.access]) {
        effective[child] = link.access;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const entries = Object.entries(config.home.blocks).map(([id, b]) => [id, { ...b, access: effective[id] }]), denied = entries.filter(([, b]) => !allowed(b.access)), open = entries.filter(([, b]) => allowed(b.access));
  const protectedAttachments = entries.flatMap(([, b]) => b.attachments.filter((a) => !allowed(b.access) || !allowed(a.access))), ids = new Set(protectedAttachments.map((a) => a.datasetId)), publicIds = new Set(open.flatMap(([, b]) => b.attachments.filter((a) => allowed(a.access)).map((a) => a.datasetId)));
  for (const id of publicIds) ids.delete(id);
  const news = new Set(denied.flatMap(([, b]) => b.newsIds || []));
  for (const [, b] of open) for (const id of b.newsIds || []) news.delete(id);
  const blocks = Object.fromEntries(entries.map(([id, b]) => [id, allowed(b.access) ? { ...b, locked: false, attachments: b.attachments.map((a) => ({ ...a, locked: !allowed(a.access), body: allowed(a.access) ? a.body : "", title: config.datasets.find((s) => s.id === a.datasetId)?.title || a.title })) } : { ...b, locked: true, body: "", attachments: b.attachments.map((a) => ({ ...a, body: "", locked: true, access: b.access })), newsIds: [], photos: [], rankingTheme: void 0 }]));
  for (const id of ids) {
    const s = config.datasets.find((s2) => s2.id === id);
    if (s?.visible) blocks["dataset:" + id] = { ...blocks["dataset:" + id], title: s.title, body: "", attachments: [], access: protectedAttachments.find((a) => a.datasetId === id)?.access || denied.find(([, b]) => b.attachments.some((a) => a.datasetId === id))?.[1].access || "plus", locked: true };
  }
  return { ...config, datasets: config.datasets.map((s) => ids.has(s.id) ? { ...s, limit: 2, columns: s.columns.map((c) => ({ ...c, formula: "" })), rows: calculate(s).slice(0, 2).map((r) => r.map((c) => c.error ? "" : String(c.value))), note: "\uACF5\uAC1C \uBBF8\uB9AC\uBCF4\uAE30 \xB7 \uCC98\uC74C 2\uD589", metadata: void 0 } : s), stories: config.stories.filter((s) => !news.has(s.id)), ranking: { ...config.ranking, rules: config.ranking.rules.filter((r) => !ids.has(r.datasetId)) }, home: { ...config.home, blocks } };
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
