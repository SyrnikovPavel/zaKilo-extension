interface SiteConfig {
  match: string[];
  script: string;
}

const api = typeof browser !== "undefined" ? browser : chrome;

const siteMap: SiteConfig[] = [
  {
    match: ["*://*.ozon.ru/*"],
    script: "src/content/ozon.js",
  },
  {
    match: ["*://*.auchan.ru/*"],
    script: "src/content/auchan.js",
  },
  {
    match: ["*://market-delivery.yandex.ru/*"],
    script: "src/content/delivery_club.js",
  },
  {
    match: ["*://eda.yandex.ru/*"],
    script: "src/content/delivery_club.js",
  },
  {
    match: ["*://lavka.yandex.ru/*"],
    script: "src/content/lavka.js",
  },
  {
    match: ["*://kuper.ru/*"],
    script: "src/content/kuper.js",
  },
  {
    match: ["*://lenta.com/*"],
    script: "src/content/lenta.js",
  },
  {
    match: ["*://magnit.ru/*"],
    script: "src/content/magnit.js",
  },
  {
    match: ["*://*.perekrestok.ru/*"],
    script: "src/content/perekrestok.js",
  },
  {
    match: ["*://shop.samberi.com/*"],
    script: "src/content/samberi.js",
  },
  {
    match: ["*://5ka.ru/*"],
    script: "src/content/pyaterochka.js",
  },
  {
    match: ["*://samokat.ru/*"],
    script: "src/content/samokat.js",
  },
  {
    match: ["*://online.metro-cc.ru/*"],
    script: "src/content/metro.js",
  },
];

function matches(url: string, patterns: string[]): boolean {
  return patterns.some((p) => new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(url));
}

// инъекция с учётом Firefox
async function inject(tabId: number, files: string[]): Promise<void> {
  if (api.scripting && api.scripting.executeScript) {
    await api.scripting.executeScript({ target: { tabId }, files });
  } else {
    for (const file of files) {
      await api.tabs.executeScript(tabId, { file });
    }
  }
}

api.tabs.onUpdated.addListener((tabId: number, changeInfo, tab): void => {
  if (changeInfo.status !== "complete" || !tab.url) return;
  for (const site of siteMap) {
    if (matches(tab.url, site.match)) {
      inject(tabId, [site.script])
        .then(() => console.log(`Injected ${site.script} into ${tab.url}`))
        .catch((err) => console.error("Injection failed:", err));
      break;
    }
  }
});

api.runtime.onInstalled.addListener((details) => {
  const currentVersion = api.runtime.getManifest().version;

  if (details.reason === "install") {
    // Первая установка
    api.tabs.create({ url: "https://zakilo.syrnikovpavel.ru/" });
  } else if (details.reason === "update") {
    // Обновление: показываем changelog только для нужных версий
    switch (currentVersion) {
      case "1.0.2":
        api.tabs.create({ url: "https://zakilo.syrnikovpavel.ru/1.0.2" });
        break;
      case "1.0.3":
        api.tabs.create({ url: "https://zakilo.syrnikovpavel.ru/1.0.3" });
        break;
      default:
        // Для остальных версий ничего не открываем
        break;
    }
  }
});
