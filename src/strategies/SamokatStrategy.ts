import { ParserStrategy } from "@/core/ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class SamokatStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Samokat";
    this.selectors = {
      card: "[class*=ProductCard_root]",
      price: "[class*=ProductCardActions_text] span span:last-child",
      name: "[class*=ProductCard_specification] span:first-child",
      unitPrice: '[data-testid="unit-price"]',
      renderRoot: "[class*=ProductCard_details]",
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = this.selectors?.price ? cardEl.querySelector(this.selectors.price)?.textContent || "" : "";
    this.log("parsed price text", priceString);
    const num = priceString?.replace(/[^\d,.]/g, "").replace(",", ".") ?? "";
    const v = parseFloat(num);
    if (isNaN(v)) throw new Error("Цена не распознана: " + priceString);
    return v;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    let nameText: string;
    if (this.selectors?.volume) {
      nameText = cardEl.querySelector(this.selectors.volume)?.textContent?.trim() ?? "";
    } else {
      nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    }

    const s = nameText.toLowerCase().replace(/,/g, ".").trim();
    const mulMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)$/i);
    let total: number;
    let unit: string;
    if (mulMatch) {
      const count = parseFloat(mulMatch[1]);
      const per = parseFloat(mulMatch[2]);
      unit = mulMatch[3];
      total = count * per;
    } else {
      const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
      if (!m) return { unitLabel: "1 шт", multiplier: 1 };
      total = parseFloat(m[1]);
      unit = m[2];
    }

    return getConvertedUnit(total, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const details = cardEl.querySelector(this.selectors?.renderRoot || this.selectors.price);
    if (!details) throw new Error("Не найдены необходимые элементы");

    const rawUnit = unitPrice;
    const calculatedUnitPrice = rawUnit < 20 ? roundNumber(rawUnit, 2) : roundNumber(rawUnit, 0);
    const displayPrice = rawUnit < 20 ? calculatedUnitPrice.toString() : calculatedUnitPrice;

    // Удаляем старые
    details.querySelectorAll(this.selectors.unitPrice).forEach((e) => e.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${displayPrice}\u2009₽ за ${unitLabel}`;
    Object.assign(span.style, {
      display: "inline-block",
      color: "#000",
      backgroundColor: "var(--accent-color, #00C66A20)",
      padding: "2px 6px",
      borderRadius: "4px",
      fontWeight: "600",
      fontSize: "15px",
    });
    details.appendChild(span);
  }
}
