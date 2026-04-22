(() => {
  const STORAGE_KEY = "capootech_layout";
  const btn = document.getElementById("layout-toggle");
  const icon = document.getElementById("layout-icon");

  const getLayout = () => {
    return localStorage.getItem(STORAGE_KEY) || "layout-b"; // Default to Option B since user liked it
  };

  const applyLayout = (layout) => {
    document.documentElement.setAttribute("data-layout", layout);
    localStorage.setItem(STORAGE_KEY, layout);
    if (icon) {
      // 🖼️ for frame (Option B), 🫧 for bubbles (Option A)
      icon.textContent = layout === "layout-a" ? "🖼️" : "🫧";
    }
  };

  let current = getLayout();
  applyLayout(current);

  if (btn) {
    btn.addEventListener("click", () => {
      current = current === "layout-b" ? "layout-a" : "layout-b";
      applyLayout(current);
    });
  }
})();
