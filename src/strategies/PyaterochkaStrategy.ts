import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class PyaterochkaStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Pyaterochka";
    this.selectors = {
      card: '[data-qa^="product-card-"], [class*="productFilterGrid_cardContainer"]',
      price: '[class*="priceContainer_totalContainer_"], [data-qa="price-tag-rubles"]',
      discountPrice: '[class*="priceContainer_discountContainer"]',
      name: '[class*="mainInformation_weight"], [data-qa="product-card-title"]',
      volume: 'p[type="caption"]:not([data-qa])',
      unitPrice: '[data-testid="unit-price"]',
      renderRoot: '[class*="priceContainer_priceContainerCatalog"], [itemprop="offers"], [data-qa="price-tag-rubles"]',
    };
  }

  private parsePriceFromRublesPennies(container: Element): number | null {
    const rubles = container.querySelector('[data-qa="price-tag-rubles"]')?.textContent?.trim().replace(/\s/g, "");
    const pennies = container.querySelector('[data-qa="price-tag-pennies"]')?.textContent?.trim();
    if (!rubles) return null;
    if (pennies) {
      return parseFloat(`${rubles}.${pennies}`);
    }
    return parseFloat(rubles);
  }

  private findWeightText(cardEl: HTMLElement): string {
    const legacyWeight = cardEl.querySelector('[class*="mainInformation_weight"]')?.textContent?.trim();
    if (legacyWeight) return legacyWeight;

    const weightPattern = /^[\d.,]+\s*(г|гр|кг|мл|л|шт)/i;
    for (const el of cardEl.querySelectorAll(this.selectors.volume!)) {
      const text = el.textContent?.trim() ?? "";
      if (weightPattern.test(text)) return text;
    }

    return cardEl.querySelector('[data-qa="product-card-title"]')?.textContent?.trim() ?? "";
  }

  private findRenderRoot(cardEl: HTMLElement): HTMLElement {
    const rublesEls = cardEl.querySelectorAll('[data-qa="price-tag-rubles"]');
    const lastRubles = rublesEls.length > 0 ? rublesEls[rublesEls.length - 1] : null;

    const roots = [
      cardEl.querySelector('[itemprop="offers"]'),
      cardEl.querySelector('[class*="priceContainer_priceContainerCatalog"]'),
      lastRubles?.closest(".chakra-stack"),
      cardEl.querySelector('[class*="priceContainer_totalContainer_"]')?.closest("div"),
    ];

    for (const root of roots) {
      if (root) return root as HTMLElement;
    }

    throw new Error("Не найден элемент для отображения цены");
  }

  parsePrice(cardEl: HTMLElement): number {
    const metaPrice = cardEl.querySelector('meta[itemprop="price"]')?.getAttribute("content");
    if (metaPrice) {
      const value = parseFloat(metaPrice);
      if (!isNaN(value)) return value;
    }

    const rublesEls = cardEl.querySelectorAll('[data-qa="price-tag-rubles"]');
    if (rublesEls.length > 0) {
      const lastBlock = rublesEls[rublesEls.length - 1].closest("div");
      if (lastBlock) {
        const price = this.parsePriceFromRublesPennies(lastBlock);
        if (price !== null && !isNaN(price)) return price;
      }
    }

    const discountPriceString = this.selectors?.discountPrice
      ? cardEl.querySelector(this.selectors.discountPrice)?.textContent || ""
      : "";
    const regularPriceString = cardEl.querySelector('[class*="priceContainer_totalContainer_"]')?.textContent || "";

    const priceString = discountPriceString || regularPriceString;

    this.log("parsed price text", priceString);
    const priceRegex = /(?<!\d)([0-9]+(?:[ \u00A0][0-9]{3})*(?:[.,][0-9]+)?)[ \u00A0]*₽/u;

    const match = priceString?.match(priceRegex);
    if (!match) {
      throw new Error("Цена не распознана: " + priceString);
    }

    const textPrice = match[1].replace(/[ \u00A0]/g, "").replace(",", ".");

    const value = parseFloat(textPrice);
    if (isNaN(value)) {
      throw new Error("Цена не распознана: " + priceString);
    }

    const kopeckInRuble = 100;
    return value / kopeckInRuble;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const nameText = this.findWeightText(cardEl);

    const s = nameText.trim().toLowerCase().replace(/,/g, ".");
    const mulMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)/i);
    let total: number;
    let unit: string;
    if (mulMatch) {
      const count = parseFloat(mulMatch[1]);
      const per = parseFloat(mulMatch[2]);
      unit = mulMatch[3];
      total = count * per;
    } else {
      const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
      if (!m) throw new Error(`не распознано количество: "${nameText}"`);
      total = parseFloat(m[1]);
      unit = m[2];
    }
    return getConvertedUnit(total, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const wrapper = this.findRenderRoot(cardEl);

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error неизвестно наличие стилей
    wrapper.parentElement?.style && (wrapper.parentElement.style.fontSize = fz);

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;
    Object.assign(span.style, {
      display: "inline-block",
      marginLeft: "0.5em",
      color: "#000",
      background: "var(--accent-color, #00C66A20)",
      padding: "2px 6px",
      borderRadius: "4px",
      fontWeight: "900",
      fontSize: fz,
    });
    wrapper.append(span);
  }

  renderNoneUnitPrice(cardEl: HTMLElement): void {
    const wrapper = this.findRenderRoot(cardEl);

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error неизвестно наличие стилей
    wrapper.parentElement?.style && (wrapper.parentElement.style.fontSize = fz);

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";
    Object.assign(span.style, {
      display: "inline-block",
      marginLeft: "0.5em",
      color: "#000",
      background: "var(--accent-color,rgba(0, 69, 198, 0.13))",
      padding: "2px 6px",
      borderRadius: "4px",
      fontWeight: "900",
      fontSize: fz,
    });
    wrapper.append(span);
  }
}
