(() => {
  const STORAGE_KEY = "capootech_theme";
  const btn = document.getElementById("theme-toggle");
  const icon = document.getElementById("theme-icon");

  const getTheme = () => {
    let t = localStorage.getItem(STORAGE_KEY);
    if (!t) {
      t = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return t;
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (icon) {
      icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  };

  let current = getTheme();
  applyTheme(current);

  if (btn) {
    btn.addEventListener("click", () => {
      current = current === "dark" ? "light" : "dark";
      applyTheme(current);
    });
  }
})();
