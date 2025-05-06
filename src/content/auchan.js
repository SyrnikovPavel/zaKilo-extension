class AuchanProductCard {
  // селекторы и константы для «Ашан»
  static CARD_SELECTOR = "div[class*=styles_productCard][class*=styles_catalogListPage_item]";
  static PRICE_SEL = "[class*=styles_productCardContentPanel_price]";
  static NAME_SEL = "[class*=styles_productCardContentPanel_name]";
  static PRICE_UNIT_TEXT_SEL = '[class*="styles_productCardContentPanel_type"]';
  static UNIT_PRICE_SEL = '[data-testid="unit-price"]';

  static mutationObserver = null;
  static scrollHandler = null;
  static runAllInterval = null;

  static init() {
    AuchanProductCard.log("=== INIT AuchanProductCard ===");
    AuchanProductCard.runAll("init");
    AuchanProductCard.watchMutations();
    AuchanProductCard.setupScrollListener();
    AuchanProductCard.setupRunAllInterval(5000);
  }

  static log(...args) {
    console.log("[auchan]", ...args);
  }

  static runAll(source) {
    const cards = Array.from(document.querySelectorAll(AuchanProductCard.CARD_SELECTOR));
    AuchanProductCard.log(`${source}: found cards=${cards.length}`);
    cards
      .filter(
        (el) =>
          el.querySelector(AuchanProductCard.PRICE_SEL) &&
          el.querySelector(AuchanProductCard.NAME_SEL) &&
          !el.querySelector(AuchanProductCard.UNIT_PRICE_SEL),
      )
      .forEach((el) => AuchanProductCard.tryProcess(el, source));
  }

  static tryProcess(el, source) {
    const inst = new AuchanProductCard(el);
    inst.log(`tryProcess [${source}]`);
    try {
      inst.process();
      inst.log(`✓ [${source}] success`);
    } catch (err) {
      inst.log(`✗ [${source}] error:`, err.message);
    }
  }

  static watchMutations() {
    const container = document.body;
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches(AuchanProductCard.CARD_SELECTOR)) {
            AuchanProductCard.log("MO: new card", n);
            AuchanProductCard.tryProcess(n, "MO");
          }
          n.querySelectorAll?.(AuchanProductCard.CARD_SELECTOR).forEach((el) => {
            AuchanProductCard.log("MO: nested card", el);
            AuchanProductCard.tryProcess(el, "MO");
          });
        });
      });
    });
    mo.observe(container, { childList: true, subtree: true });
    AuchanProductCard.mutationObserver = mo;
    AuchanProductCard.log("watchMutations: started");
  }

  static setupScrollListener() {
    const handler = AuchanProductCard.debounce(() => {
      AuchanProductCard.runAll("scroll");
    }, 300);
    window.addEventListener("scroll", handler, { passive: true });
    AuchanProductCard.scrollHandler = handler;
    AuchanProductCard.log("scroll listener: started");
  }

  static setupRunAllInterval(ms) {
    AuchanProductCard.runAllInterval = setInterval(() => AuchanProductCard.runAll("interval"), ms);
    AuchanProductCard.log(`interval runAll: every ${ms}ms`);
  }

  static debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  constructor(cardEl) {
    this.cardEl = cardEl;
    this.logPrefix = "[auchan]";
  }

  log(...args) {
    console.log(this.logPrefix, ...args);
  }

  process() {
    const priceEl = this.cardEl.querySelector(AuchanProductCard.PRICE_SEL);
    const unitTextEl = this.cardEl.querySelector(AuchanProductCard.PRICE_UNIT_TEXT_SEL);
    const nameEl = this.cardEl.querySelector(AuchanProductCard.NAME_SEL);
    if (!priceEl || !nameEl) {
      throw new Error("priceEl или nameEl не найдены");
    }

    const wrapper = priceEl.closest("div");
    if (!wrapper) {
      throw new Error("wrapper for price not found");
    }
    const fz = "calc(0.95vw)";
    wrapper.style.fontSize = fz;
    wrapper.parentElement.style.fontSize = fz;

    const price = this._parsePrice(priceEl.textContent);
    this.log("price=", price);

    const nameText = nameEl.textContent.trim();
    this.log("name=", nameText);

    const unitText = unitTextEl?.textContent.trim() ?? "";
    this.log("unitText=", unitText);

    // извлекаем количество и единицу из названия
    const { unitLabel, multiplier } = this._parseQuantityFromName(`${unitText} ${nameText}`);
    this.log("parsed unit:", unitLabel, "multiplier=", multiplier);

    // цена за единицу, округлённая вверх
    const unitPrice = Math.ceil(price * multiplier);
    this.log("unitPrice=", unitPrice);

    wrapper.querySelectorAll(AuchanProductCard.UNIT_PRICE_SEL).forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${unitPrice}\u2009₽ за ${unitLabel}`;
    span.style.display = "inline-block";
    span.style.marginLeft = "0.5em";
    span.style.color = "#000";
    span.style.background = "var(--accent-color, #00C66A20)";
    span.style.padding = "2px 6px";
    span.style.borderRadius = "4px";
    span.style.fontWeight = "900";
    span.style.fontSize = fz;

    wrapper.appendChild(span);
    this.log("unit-price appended");
  }

  _parsePrice(txt) {
    const num = txt.replace(/[^\d,\.]/g, "").replace(",", ".");
    const v = parseFloat(num);
    if (isNaN(v)) throw new Error("cannot parse price: " + txt);
    return v;
  }

  _parseQuantityFromName(text) {
    // Ищем число и единицу (г, кг, мл, л, шт) с учётом неразрывного пробела
    const regex = /([\d.,]+)\s*(г|гр|кг|мл|л|шт)/i;
    const match = text.match(regex);
    if (!match) {
      // нет веса — считаем 1 шт
      return { unitLabel: "1 шт", multiplier: 1 };
    }
    const value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    switch (unit) {
      case "г":
        return { unitLabel: "1 кг", multiplier: 1000 / value };
      case "гр":
        return { unitLabel: "1 кг", multiplier: 1000 / value };
      case "кг":
        return { unitLabel: "1 кг", multiplier: 1 / value };
      case "мл":
        return { unitLabel: "1 л", multiplier: 1000 / value };
      case "л":
        return { unitLabel: "1 л", multiplier: 1 / value };
      case "шт":
        return { unitLabel: "1 шт", multiplier: 1 / value };
      case "шт.":
        return { unitLabel: "1 шт", multiplier: 1 / value };
      default:
        return { unitLabel: `1 ${unit}`, multiplier: 1 / value };
    }
  }
}

// автозапуск
(function boot() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => AuchanProductCard.init());
  } else {
    AuchanProductCard.init();
  }
})();
