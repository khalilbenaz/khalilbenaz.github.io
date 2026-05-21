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
  const rt = Blog.readingTime(body);

  // Title + meta
  document.title = issue.title + " — Khalil Benazzouz";
  setText("article-title", issue.title);
  $("article-eyebrow").textContent = tags.map(Blog.tagLabel).join(" · ") || "Article";

  if (fm.lede || fm.description) {
    $("article-lede").textContent = fm.lede || fm.description;
  } else {
    $("article-lede").textContent = Blog.plainExcerpt(body, 260);
  }

  $("meta-date").textContent = Blog.formatDate(issue.created_at, locale());
  $("meta-read").textContent = rt + " min";
  if (issue.updated_at && issue.updated_at !== issue.created_at) {
    $("meta-updated").textContent = "Mis à jour le " + Blog.formatDate(issue.updated_at, locale());
    $("meta-updated").hidden = false;
  }
  $("github-link").href = Blog.issueUrl(number);
  $("comments-link").href = Blog.issueUrl(number) + "#new_comment";

  // Body
  const html = Blog.renderMarkdown(body);
  $("article-body").innerHTML = html;
  if (window.hljs) {
    $("article-body").querySelectorAll("pre code").forEach((b) => hljs.highlightElement(b));
  }

  // Build TOC
  const tocList = $("toc-list");
  const headings = $("article-body").querySelectorAll("h2[id], h3[id]");
  if (headings.length >= 2) {
    headings.forEach((h) => {
      const li = document.createElement("li");
      if (h.tagName === "H3") li.className = "h3";
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });
    // Scroll spy
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
  } else {
    $("toc").style.display = "none";
  }

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
  if (tags.length) {
    try {
      const all = await Blog.listPublishedIssues();
      const related = all
        .filter((i) => i.number !== number)
        .filter((i) => Blog.tagsOf(i).some((t) => tags.includes(t)))
        .slice(0, 2);
      if (related.length) renderRelated(related);
      else $("related").style.display = "none";
    } catch (_) { $("related").style.display = "none"; }
  } else {
    $("related").style.display = "none";
  }

  function renderRelated(items) {
    const target = $("related-grid");
    target.innerHTML = "";
    items.forEach((i) => {
      const a = document.createElement("a");
      a.className = "card";
      a.href = `post.html?id=${i.number}`;
      a.innerHTML = `
        <div class="meta">${Blog.formatDate(i.created_at, locale())}</div>
        <h3>${i.title}</h3>
        <p>${Blog.plainExcerpt(Blog.parseFrontMatter(i.body || "").body, 160)}</p>
      `;
      target.appendChild(a);
    });
  }
})();
