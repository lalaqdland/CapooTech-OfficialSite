(() => {
  const STORAGE_KEY = "capootech_lang";

  const copy = {
    zh: {
      brand: "咖波科技 · CapooTech",
      title: "咖波的小宇宙",
      subtitle: "咖波科技的所有产品都从这里出发，咖波本喵也住在这儿。",
      grainDesc: "把你的草稿，改成你想说出口的样子。",
      openGrain: "打开 Grain",
      neuralDesc: "和你的科研笔记像聊天一样对话。",
      openNeural: "打开 NeuralNote",
      seekkitDesc: "2026 世界杯竞彩预测与盘口分析工具。",
      openSeekkit: "打开 SeekKit",
      newsDesc: "Hermes 推送的信息流，可搜索、筛选与回看。",
      openNews: "打开 News",
      blogDesc: "咖波的个人博客，记录想法、工具与创作。",
      openBlog: "打开 Blog",
      galleryTitle: "咖波出没",
      buttonLabel: "切换到英文",
      buttonTitle: "切换语言",
      short: "中",
      htmlLang: "zh-CN",
    },
    en: {
      brand: "CapooTech · 咖波科技",
      title: "Capoo's Little Universe",
      subtitle: "Everything CapooTech makes ships from here, and Capoo himself lives here too.",
      grainDesc: "Reshape any draft into what you actually meant to say.",
      openGrain: "Open Grain",
      neuralDesc: "Chat with your research notes — they'll talk back.",
      openNeural: "Open NeuralNote",
      seekkitDesc: "2026 World Cup betting predictions and odds analysis.",
      openSeekkit: "Open SeekKit",
      newsDesc: "Searchable Hermes feed for market, AI, and ops updates.",
      openNews: "Open News",
      blogDesc: "Capoo's personal blog on ideas, tools, and building.",
      openBlog: "Open Blog",
      galleryTitle: "Capoo Sightings",
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
    "grainDesc",
    "openGrain",
    "neuralDesc",
    "openNeural",
    "seekkitDesc",
    "openSeekkit",
    "newsDesc",
    "openNews",
    "blogDesc",
    "openBlog",
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
