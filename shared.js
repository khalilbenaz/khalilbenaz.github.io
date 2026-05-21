// Theme + locale toggle, persisted in localStorage.
(function () {
  const root = document.documentElement;

  // ----- theme -----
  const savedTheme = localStorage.getItem("kb.theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initialTheme);

  // ----- locale -----
  const savedLocale = localStorage.getItem("kb.locale");
  const browserLocale = (navigator.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
  const initialLocale = savedLocale || browserLocale;
  root.setAttribute("data-locale", initialLocale);
  document.documentElement.lang = initialLocale;

  function reflectButtons() {
    document.querySelectorAll("[data-action='toggle-theme']").forEach((b) => {
      const t = root.getAttribute("data-theme");
      b.setAttribute("aria-label", t === "dark" ? "Passer en mode clair" : "Passer en mode sombre");
      b.querySelector("[data-icon='sun']")?.toggleAttribute("hidden", t !== "dark");
      b.querySelector("[data-icon='moon']")?.toggleAttribute("hidden", t === "dark");
    });
    document.querySelectorAll("[data-action='toggle-locale']").forEach((b) => {
      const l = root.getAttribute("data-locale");
      b.textContent = l === "fr" ? "EN" : "FR";
      b.setAttribute("aria-label", l === "fr" ? "Switch to English" : "Passer en français");
    });
  }

  document.addEventListener("click", (e) => {
    const themeBtn = e.target.closest("[data-action='toggle-theme']");
    const localeBtn = e.target.closest("[data-action='toggle-locale']");
    if (themeBtn) {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("kb.theme", next);
      reflectButtons();
    }
    if (localeBtn) {
      const next = root.getAttribute("data-locale") === "fr" ? "en" : "fr";
      root.setAttribute("data-locale", next);
      document.documentElement.lang = next;
      localStorage.setItem("kb.locale", next);
      reflectButtons();
      document.dispatchEvent(new CustomEvent("kb:locale-change", { detail: { locale: next } }));
    }
  });

  document.addEventListener("DOMContentLoaded", reflectButtons);
})();
