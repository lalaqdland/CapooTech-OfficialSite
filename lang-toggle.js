(() => {
  const STORAGE_KEY = "capootech_lang";

  const copy = {
    zh: {
      brand: "咖波科技",
      title: "选择应用",
      subtitle: "一个入口，连接写作与科研工作流。",
      product1Name: "产品1",
      grainDesc: "AI 人性化改写与学术润色工作台",
      openGrain: "备案中",
      product2Name: "产品2",
      neuralDesc: "科研笔记与检索体验",
      openNeural: "备案中",
      galleryTitle: "咖波图库",
      buttonLabel: "切换到英文",
      buttonTitle: "切换语言",
      short: "中",
      htmlLang: "zh-CN",
    },
    en: {
      brand: "CapooTech",
      title: "Choose an App",
      subtitle: "One entry point for writing and research workflows.",
      product1Name: "Product 1",
      grainDesc: "AI humanizer and academic rewriting workspace.",
      openGrain: "Filing in progress",
      product2Name: "Product 2",
      neuralDesc: "Research note-taking and retrieval experience.",
      openNeural: "Filing in progress",
      galleryTitle: "Capoo Gallery",
      buttonLabel: "Switch to Chinese",
      buttonTitle: "Switch language",
      short: "EN",
      htmlLang: "en",
    },
  };

  const keys = [
    "brand",
    "title",
    "subtitle",
    "product1Name",
    "grainDesc",
    "openGrain",
    "product2Name",
    "neuralDesc",
    "openNeural",
    "galleryTitle",
  ];

  const nodes = Object.fromEntries(
    keys.map((key) => [key, document.querySelector(`[data-i18n=\"${key}\"]`)])
  );

  const button = document.getElementById("lang-toggle");
  const label = document.getElementById("lang-label");

  const normalizeLang = (lang) => (lang === "en" ? "en" : "zh");

  const readLang = () => {
    try {
      return normalizeLang(localStorage.getItem(STORAGE_KEY));
    } catch {
      return "zh";
    }
  };

  const writeLang = (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore storage failures (private mode / strict privacy settings).
    }
  };

  const applyLang = (lang) => {
    const data = copy[lang];
    if (!data) return;

    for (const key of keys) {
      if (nodes[key]) nodes[key].textContent = data[key];
    }

    document.documentElement.lang = data.htmlLang;

    if (button) {
      button.setAttribute("aria-label", data.buttonLabel);
      button.setAttribute("title", data.buttonTitle);
    }

    if (label) {
      label.textContent = data.short;
    }

    writeLang(lang);
  };

  let currentLang = readLang();
  applyLang(currentLang);

  if (button) {
    button.addEventListener("click", () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      applyLang(currentLang);
    });
  }
})();
