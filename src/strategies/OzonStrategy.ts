import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";

export class OzonStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Ozon";
    this.selectors = {
      card: '[class*="tile-root"]',
      price: '[class*="tsHeadline500Medium"]',
      name: '[class*="tsBody500Medium"]',
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent;
    this.log("parsed price text", priceString);
    const num = priceString?.replace(/[^\d,.]/g, "").replace(",", ".") ?? "";
    const v = parseFloat(num);
    if (isNaN(v)) throw new Error("cannot parse price: " + priceString);
    return v;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    const regex = /([\d.,]+)\s*(г|гр|кг|мл|л|шт)/i;
    const match = nameText.match(regex);

    if (!match) return { unitLabel: null, multiplier: null } as NoneUnitLabel;

    const value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toLowerCase();
    return getUnitParsedWeight(value, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");

    if (!wrapper) {
      throw new Error("wrapper for price not found");
    }

    const fz = "calc(0.95vw)";
    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el: Element) => el.remove());

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
    wrapper.appendChild(span);
  }

  renderNoneUnitPrice(cardEl: HTMLElement): void {
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");

    if (!wrapper) {
      throw new Error("wrapper for price not found");
    }

    const fz = "calc(0.95vw)";
    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el: Element) => el.remove());

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
    wrapper.appendChild(span);
  }
}
