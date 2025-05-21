import { ParserStrategy } from "@/core/ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class MagnitStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Magnit";
    this.selectors = {
      card: '[class*="unit-catalog-product-preview"]',
      price: [
        '[class*="unit-catalog-product-preview-prices__sale"] span',
        '[class*="unit-catalog-product-preview-prices__regular"] span',
      ].join(","),
      name: '[class*="unit-catalog-product-preview-title"]',
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  shouldProcess(cardEl: Element): boolean {
    return (
      (cardEl.querySelector(this.selectors.price) &&
        cardEl.querySelector(this.selectors.name) &&
        !cardEl.querySelector(this.selectors.unitPrice)) ||
      false
    );
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent;
    const num = priceString?.replace(/[^\d.,]/g, "").replace(",", ".") ?? "";
    const v = parseFloat(num);
    if (isNaN(v)) throw new Error("Cannot parse price: " + priceString);
    return v;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    const s = nameText.trim().toLowerCase().replace(",", ".");
    const match = s.match(/([\d]+(?:\.\d+)?)\s*(г|гр|кг|мл|л|шт)\.?/i);
    if (!match) {
      return { unitLabel: "1 шт", multiplier: 1 };
    }
    const value = parseFloat(match[1]);
    const unit = match[2];
    return getConvertedUnit(value, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceContainer = cardEl.querySelector('[class*="unit-catalog-product-preview-prices"]');
    if (!priceContainer) throw new Error("Price container not found");

    priceContainer.querySelectorAll(this.selectors.unitPrice).forEach((el: Element) => el.remove());

    const displayValue = unitPrice < 20 ? roundNumber(unitPrice, 2).toString() : roundNumber(unitPrice, 0).toString();

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${displayValue}\u2009₽ за ${unitLabel}`;
    Object.assign(span.style, {
      display: "block",
      color: "rgb(0,0,0)",
      backgroundColor: "rgb(230,245,239)",
      padding: "2px 6px 2px 0.5px",
      borderRadius: "4px",
      fontWeight: "600",
      fontSize: "14px",
      marginBottom: "4px",
    });

    priceContainer.prepend(span);
  }
}
