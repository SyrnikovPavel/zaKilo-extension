import { ParserStrategy } from "@/core/ParserStrategy";
import { isUnitLabel, type NoneUnitLabel, type UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class PerekrestokStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Perekrestok";
    this.selectors = {
      card: ".product-card",
      price: ".product-card__price .price-new",
      name: ".product-card__title, .product-card__title-link",
      volume: ".product-card__size",
      priceUnit: ".product-card__pricing",
      unitPrice: '[data-testid="unit-price"]',
      renderRoot: ".product-card__price",
    };
  }

  private parseWeightText(text: string): UnitLabel | NoneUnitLabel | null {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, ".");
    const mulMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)/i);
    if (mulMatch) {
      const total = parseFloat(mulMatch[1]) * parseFloat(mulMatch[2]);
      const result = getConvertedUnit(total, mulMatch[3]);
      return isUnitLabel(result) ? result : null;
    }

    const matches = [...normalized.matchAll(/([\d.]+)\s*(г|гр|кг|мл|л|шт)/gi)];
    if (matches.length === 0) return null;

    const preferred = matches.find((m) => m[2] !== "шт") ?? matches[matches.length - 1];
    const result = getConvertedUnit(parseFloat(preferred[1]), preferred[2]);
    return isUnitLabel(result) ? result : null;
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent?.trim() ?? "";
    this.log("parsed price text", priceString);
    const priceRegex = /(?<!\d)([0-9]{1,3}(?:[ \u00A0][0-9]{3})*(?:[.,][0-9]+)?)[ \u00A0]*₽/u;
    const match = priceString.match(priceRegex);
    if (!match) {
      throw new Error("Цена не распознана: " + priceString);
    }

    const value = parseFloat(match[1].replace(/[ \u00A0]/g, "").replace(",", "."));
    if (isNaN(value)) {
      throw new Error("Цена не распознана: " + priceString);
    }

    return value;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const sizeText = cardEl.querySelector(this.selectors.volume!)?.textContent?.trim() ?? "";
    if (sizeText) {
      const fromSize = this.parseWeightText(sizeText);
      if (fromSize && isUnitLabel(fromSize)) return fromSize;
    }

    const pricingText = cardEl.querySelector(this.selectors.priceUnit!)?.textContent?.toLowerCase() ?? "";
    if (/\/кг/.test(pricingText)) return { unitLabel: "1 кг", multiplier: 1 } as UnitLabel;
    if (/\/л/.test(pricingText)) return { unitLabel: "1 л", multiplier: 1 } as UnitLabel;

    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    const fromName = this.parseWeightText(nameText);
    if (fromName && isUnitLabel(fromName)) return fromName;

    return {
      unitLabel: null,
      multiplier: null,
    } as NoneUnitLabel;
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const wrapper = cardEl.querySelector(this.selectors.renderRoot!);
    if (!wrapper) throw new Error("Не найден элемент для отображения цены");

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
      fontSize: "12px",
    });
    wrapper.append(span);
  }

  renderNoneUnitPrice(cardEl: HTMLElement): void {
    const wrapper = cardEl.querySelector(this.selectors.renderRoot!);
    if (!wrapper) throw new Error("Не найден элемент для отображения цены");

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
      fontSize: "12px",
    });
    wrapper.append(span);
  }
}
