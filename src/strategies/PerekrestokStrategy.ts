import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";

export class PerekrestokStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Perekrestok";
    this.selectors = {
      card: "[data-testid=product-card-root]",
      price: "[data-testid=product-card-price]",
      name: "[data-testid=product-card-name]",
      volume: "[data-testid=product-card-weight]",
      unitPrice: "[data-testid='unit-price']",
    };
  }

  shouldProcess(cardEl: HTMLElement): boolean {
    return Boolean(cardEl.querySelector(this.selectors.price) && cardEl.querySelector(this.selectors.name));
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent;
    this.log("parsed price text", priceString);
    const priceRegex = /(?<!\d)([0-9]{1,3}(?:[ \u00A0][0-9]{3})*(?:[.,][0-9]+)?)[ \u00A0]*₽/u;
    const match = priceString?.match(priceRegex);
    if (!match) {
      throw new Error("Цена не распознана: " + priceString);
    }

    const textPrice = match[1].replace(/[ \u00A0]/g, "").replace(",", ".");

    const value = parseFloat(textPrice);
    if (isNaN(value)) {
      throw new Error("Цена не распознана: " + priceString);
    }

    return value;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    let quantityText: string;
    if (this.selectors?.volume) {
      quantityText = cardEl.querySelector(this.selectors.volume)?.textContent?.trim() ?? "";
    } else {
      quantityText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    }

    const s = quantityText.trim().toLowerCase().replace(/,/g, ".");
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
      if (!m) throw new Error(`не распознано количество: "${quantityText}"`);
      total = parseFloat(m[1]);
      unit = m[2];
    }
    return getUnitParsedWeight(total, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");
    if (!wrapper) throw new Error("Не найден элемент для отображения цены");

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

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
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");
    if (!wrapper) throw new Error("Не найден элемент для отображения цены");

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

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
