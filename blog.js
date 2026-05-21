// ---- Blog wiring: GitHub Issues → articles ------------------------------
// Convention: an issue with label "blog" = published article.
// Other labels = tags. URL of article = post.html?id=<issue_number>.

window.BLOG_CONFIG = {
  repo: "khalilbenaz/khalilbenaz.github.io",
  publishedLabel: "blog",
  draftLabel: "draft",
  // Tag labels surfaced in the UI (lowercase). Anything else is shown as a generic tag.
  tagLabels: ["dotnet", "fintech", "payments", "ai", "architecture", "tutorial", "open-source", "leadership", "anthropic", "openai", "mcp", "security", "chromium", "gemini", "typescript", "javascript", "postgres", "rust", "kubernetes", "tailwind", "webgpu", "bun", "astro", "vue", "svelte", "nextjs", "react", "deno", "nodejs", "vite", "go", "java", "kotlin", "swift", "sqlite", "duckdb", "redis", "terraform", "cloudflare", "css", "webassembly", "aws", "python", "kafka", "docker", "mongodb", "zig", "linux", "pulumi"],
  tagDisplay: {
    "dotnet": ".NET", "fintech": "Fintech", "payments": "Payments",
    "ai": "IA / LLM", "architecture": "Architecture", "tutorial": "Tutoriel",
    "open-source": "Open source", "leadership": "Leadership",
    "anthropic": "Anthropic", "openai": "OpenAI", "mcp": "MCP",
    "security": "Sécurité", "chromium": "Chromium", "gemini": "Gemini",
    "typescript": "TypeScript", "javascript": "JavaScript",
    "postgres": "PostgreSQL", "rust": "Rust", "kubernetes": "Kubernetes",
    "tailwind": "Tailwind", "webgpu": "WebGPU", "bun": "Bun",
    "astro": "Astro", "vue": "Vue", "svelte": "Svelte", "nextjs": "Next.js",
    "react": "React", "deno": "Deno", "nodejs": "Node.js", "vite": "Vite",
    "go": "Go", "java": "Java", "kotlin": "Kotlin", "swift": "Swift",
    "sqlite": "SQLite", "duckdb": "DuckDB", "redis": "Redis / Valkey",
    "terraform": "Terraform", "cloudflare": "Cloudflare", "css": "CSS",
    "webassembly": "WebAssembly", "aws": "AWS", "python": "Python",
    "kafka": "Kafka", "docker": "Docker", "mongodb": "MongoDB",
    "zig": "Zig", "linux": "Linux", "pulumi": "Pulumi",
    "mistral": "Mistral", "tauri": "Tauri", "tooling": "Tooling",
    "frontend": "Frontend", "webrtc": "WebRTC", "crystal": "Crystal",
    "fsharp": "F#", "networking": "Networking", "api": "API",
    "observability": "Observability", "data": "Data", "devops": "DevOps",
    "testing": "Testing", "mobile": "Mobile", "scylla": "ScyllaDB",
    "elixir": "Elixir", "hono": "Hono", "htmx": "HTMX"
  },
  // Cache TTL (sessionStorage) — 5 minutes
  cacheTtlMs: 5 * 60 * 1000,
  // Words/min for reading time
  wordsPerMin: 180
};

window.Blog = (function () {
  const cfg = window.BLOG_CONFIG;
  const apiBase = `https://api.github.com/repos/${cfg.repo}`;

  // ---- cached fetch ----
  async function cachedFetch(url) {
    const key = "kb.blog::" + url;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      try {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < cfg.cacheTtlMs) return data;
      } catch (_) { /* fall through */ }
    }
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) {
      if (res.status === 403) throw new Error("RATE_LIMIT");
      throw new Error("HTTP_" + res.status);
    }
    const data = await res.json();
    const isEmptyArray = Array.isArray(data) && data.length === 0;
    if (!isEmptyArray) {
      try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
    }
    return data;
  }

  async function fetchAllPages(stateLabel) {
    // GitHub caps at 100/page; loop until short page or 5 pages max.
    const all = [];
    for (let page = 1; page <= 5; page++) {
      const url = `${apiBase}/issues?state=${stateLabel}&labels=${cfg.publishedLabel}&per_page=100&sort=created&direction=desc&page=${page}`;
      const data = await cachedFetch(url);
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
      if (data.length < 100) break;
    }
    return all;
  }

  async function listPublishedIssues() {
    const [openIssues, closedIssues] = await Promise.all([
      fetchAllPages("open"),
      fetchAllPages("closed"),
    ]);
    const open = openIssues.filter((i) => !i.pull_request);
    const closed = closedIssues.filter((i) => !i.pull_request);

    const seen = new Set();
    const merged = [...open, ...closed].filter((i) => {
      if (seen.has(i.number)) return false;
      seen.add(i.number);
      const isDraft = (i.labels || []).some((l) => (l.name || "").toLowerCase() === cfg.draftLabel);
      return !isDraft;
    });
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged;
  }

  async function getIssue(number) {
    return cachedFetch(`${apiBase}/issues/${number}`);
  }
  async function getComments(number) {
    return cachedFetch(`${apiBase}/issues/${number}/comments?per_page=100`);
  }

  // ---- helpers ----
  function readingTime(text) {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / cfg.wordsPerMin));
  }

  function formatDate(iso, locale) {
    const d = new Date(iso);
    const l = locale === "en" ? "en-US" : "fr-FR";
    return d.toLocaleDateString(l, { year: "numeric", month: "long", day: "numeric" });
  }

  function tagsOf(issue) {
    return (issue.labels || [])
      .map((l) => (l.name || "").toLowerCase())
      .filter((n) => n && n !== cfg.publishedLabel && n !== cfg.draftLabel);
  }

  function tagLabel(name) {
    return cfg.tagDisplay[name] || name;
  }

  function plainExcerpt(md, max = 220) {
    if (!md) return "";
    // strip code blocks, images, headings, links to text
    let t = md
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#>*_`~]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (t.length > max) t = t.slice(0, max - 1) + "…";
    return t;
  }

  // Pull the first image in the markdown body — used as cover, optional
  function firstImage(md) {
    if (!md) return null;
    const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/);
    return m ? m[1] : null;
  }

  // Extract the body block matching the requested locale.
  // Convention: <!--lang:fr-->...<!--/lang:fr--> and <!--lang:en-->...<!--/lang:en-->
  // Fallback: the other locale, then the whole body (mono-language article).
  function stripLangMarkers(s) {
    return (s || "").replace(/<!--\s*\/?\s*lang:(fr|en)\s*-->/gi, "");
  }

  function localizedBody(md, locale) {
    if (!md) return "";
    const hasBlocks = /<!--\s*lang:(fr|en)\s*-->/i.test(md);
    if (!hasBlocks) return md;
    const re = (lang) => new RegExp(`<!--\\s*lang:${lang}\\s*-->([\\s\\S]*?)<!--\\s*/lang:${lang}\\s*-->`, "i");
    const wanted = md.match(re(locale));
    if (wanted) return stripLangMarkers(wanted[1]).trim();
    const other = md.match(re(locale === "fr" ? "en" : "fr"));
    if (other) return stripLangMarkers(other[1]).trim();
    return stripLangMarkers(md).trim();
  }

  function localizedTitle(issue, fm, locale) {
    if (locale === "en" && fm && fm.title_en) return fm.title_en;
    if (locale === "fr" && fm && fm.title_fr) return fm.title_fr;
    return issue.title;
  }

  function localizedLede(fm, locale) {
    if (!fm) return "";
    if (locale === "en") return fm.lede_en || fm.lede || "";
    return fm.lede || fm.lede_en || "";
  }

  // Optional front-matter style: ---\nlang: en\nlede: ...\n--- at top of body
  function parseFrontMatter(md) {
    if (!md) return { fm: {}, body: md || "" };
    const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!m) return { fm: {}, body: md };
    const fm = {};
    m[1].split(/\r?\n/).forEach((line) => {
      const mm = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (mm) fm[mm[1].trim()] = mm[2].trim();
    });
    return { fm, body: md.slice(m[0].length) };
  }

  // ---- markdown rendering ----
  function renderMarkdown(md) {
    md = stripLangMarkers(md || "");
    if (window.marked) {
      const renderer = new marked.Renderer();
      // Add ids to headings for TOC + anchor scrolling
      renderer.heading = function (text, level) {
        const slug = String(text).toLowerCase()
          .replace(/<[^>]+>/g, "")
          .replace(/[^\w\s-]/g, "")
          .trim().replace(/\s+/g, "-");
        return `<h${level} id="${slug}">${text}</h${level}>`;
      };
      marked.setOptions({
        gfm: true, breaks: false, headerIds: false, mangle: false,
        renderer,
        highlight: function (code, lang) {
          if (window.hljs && lang && hljs.getLanguage(lang)) {
            try { return hljs.highlight(code, { language: lang }).value; } catch (_) {}
          }
          return window.hljs ? hljs.highlightAuto(code).value : code;
        }
      });
      return marked.parse(md || "");
    }
    return "<pre>" + (md || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]) + "</pre>";
  }

  function newPostUrl() {
    return `https://github.com/${cfg.repo}/issues/new?labels=${cfg.publishedLabel}&title=Titre%20de%20l%27article&body=%C3%89crivez%20votre%20article%20ici%20en%20Markdown...`;
  }
  function issueUrl(n) { return `https://github.com/${cfg.repo}/issues/${n}`; }

  return {
    cfg, listPublishedIssues, getIssue, getComments,
    readingTime, formatDate, tagsOf, tagLabel,
    plainExcerpt, firstImage, parseFrontMatter,
    localizedBody, localizedTitle, localizedLede,
    renderMarkdown, newPostUrl, issueUrl
  };
})();
