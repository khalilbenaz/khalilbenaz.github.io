// post.js — load a single GitHub Issue as an article
(async function () {
  const params = new URLSearchParams(location.search);
  const number = parseInt(params.get("id"), 10);
  const $ = (id) => document.getElementById(id);

  if (!number || isNaN(number)) {
    $("article-body").innerHTML = `<div style="padding:40px 0;color:var(--text-3)">Aucun article spécifié. <a href="blog.html" style="color:var(--accent)">Retour au blog</a>.</div>`;
    return;
  }

  function locale() { return document.documentElement.getAttribute("data-locale") || "fr"; }

  function setText(id, t) { const e = $(id); if (e) e.textContent = t; }

  function renderError(msg) {
    $("article-body").innerHTML = `<div style="padding:40px 0;color:var(--text-3)">${msg}</div>`;
  }

  let issue;
  try {
    issue = await Blog.getIssue(number);
  } catch (e) {
    if (e.message === "RATE_LIMIT") return renderError("Trop de requêtes vers l'API GitHub. Réessayez dans une heure.");
    return renderError("Article introuvable. <a href='blog.html' style='color:var(--accent)'>Retour au blog</a>.");
  }

  // Check it's actually a blog post
  const labels = (issue.labels || []).map((l) => (l.name || "").toLowerCase());
  if (!labels.includes(Blog.cfg.publishedLabel)) {
    return renderError("Cet article n'est pas publié. <a href='blog.html' style='color:var(--accent)'>Retour au blog</a>.");
  }

  const { fm, body } = Blog.parseFrontMatter(issue.body || "");
  const tags = Blog.tagsOf(issue);

  $("article-eyebrow").textContent = tags.map(Blog.tagLabel).join(" · ") || "Article";
  $("github-link").href = Blog.issueUrl(number);
  $("comments-link").href = Blog.issueUrl(number) + "#new_comment";

  function renderLocalized() {
    const lc = locale();
    const localized = Blog.localizedBody(body, lc);
    const title = Blog.localizedTitle(issue, fm, lc);
    const lede = Blog.localizedLede(fm, lc) || Blog.plainExcerpt(localized, 260);
    const rt = Blog.readingTime(localized);

    document.title = title + " — Khalil Benazzouz";
    setText("article-title", title);
    $("article-lede").textContent = lede;
    $("meta-date").textContent = Blog.formatDate(issue.created_at, lc);
    $("meta-read").textContent = rt + " min";
    if (issue.updated_at && issue.updated_at !== issue.created_at) {
      $("meta-updated").textContent = (lc === "en" ? "Updated " : "Mis à jour le ") + Blog.formatDate(issue.updated_at, lc);
      $("meta-updated").hidden = false;
    }

    $("article-body").innerHTML = Blog.renderMarkdown(localized);
    if (window.hljs) {
      $("article-body").querySelectorAll("pre code").forEach((b) => hljs.highlightElement(b));
    }
    buildToc();
  }

  function buildToc() {
    const tocList = $("toc-list");
    tocList.innerHTML = "";
    const headings = $("article-body").querySelectorAll("h2[id], h3[id]");
    if (headings.length < 2) { $("toc").style.display = "none"; return; }
    $("toc").style.display = "";
    headings.forEach((h) => {
      const li = document.createElement("li");
      if (h.tagName === "H3") li.className = "h3";
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });
    const links = new Map();
    tocList.querySelectorAll("a").forEach((a) => links.set(a.getAttribute("href").slice(1), a));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const link = links.get(e.target.id);
        if (!link) return;
        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    headings.forEach((h) => io.observe(h));
  }

  renderLocalized();
  document.addEventListener("kb:locale-change", renderLocalized);

  // Reading progress
  const bar = $("progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = max > 0 ? (document.documentElement.scrollTop / max) * 100 : 0;
    bar.style.width = pct + "%";
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Comments
  try {
    const comments = await Blog.getComments(number);
    renderComments(comments);
  } catch (e) {
    $("comments-list").innerHTML = `<p style="color:var(--text-3)">Impossible de charger les commentaires.</p>`;
  }

  function renderComments(list) {
    const target = $("comments-list");
    target.innerHTML = "";
    $("comments-count").textContent = list.length;
    if (!list.length) {
      target.innerHTML = `<p style="color:var(--text-3);font-size:14px;margin:0">Aucun commentaire pour l'instant — soyez le premier.</p>`;
      return;
    }
    list.forEach((c) => {
      const div = document.createElement("div");
      div.className = "comment";
      div.innerHTML = `
        <div class="comment-head">
          <img src="${c.user.avatar_url}&s=48" alt="" loading="lazy"/>
          <a href="${c.user.html_url}" target="_blank" rel="noopener"><strong>${c.user.login}</strong></a>
          <span class="comment-date">· ${Blog.formatDate(c.created_at, locale())}</span>
        </div>
        <div class="comment-body">${Blog.renderMarkdown(c.body || "")}</div>
      `;
      target.appendChild(div);
    });
  }

  // Related posts: same tag, exclude current
  let relatedItems = [];
  if (tags.length) {
    try {
      const all = await Blog.listPublishedIssues();
      relatedItems = all
        .filter((i) => i.number !== number)
        .filter((i) => Blog.tagsOf(i).some((t) => tags.includes(t)))
        .slice(0, 2);
      if (relatedItems.length) renderRelated(relatedItems);
      else $("related").style.display = "none";
    } catch (_) { $("related").style.display = "none"; }
  } else {
    $("related").style.display = "none";
  }

  // Re-localize the "read next" cards when the language is toggled
  document.addEventListener("kb:locale-change", () => {
    if (relatedItems.length) renderRelated(relatedItems);
  });

  function renderRelated(items) {
    const target = $("related-grid");
    target.innerHTML = "";
    const lc = locale();
    items.forEach((i) => {
      const { fm: rfm, body: rbody } = Blog.parseFrontMatter(i.body || "");
      const rlocalized = Blog.localizedBody(rbody, lc);
      const a = document.createElement("a");
      a.className = "card";
      a.href = `post.html?id=${i.number}`;
      a.innerHTML = `
        <div class="meta">${Blog.formatDate(i.created_at, lc)}</div>
        <h3>${Blog.localizedTitle(i, rfm, lc)}</h3>
        <p>${Blog.localizedLede(rfm, lc) || Blog.plainExcerpt(rlocalized, 160)}</p>
      `;
      target.appendChild(a);
    });
  }
})();
