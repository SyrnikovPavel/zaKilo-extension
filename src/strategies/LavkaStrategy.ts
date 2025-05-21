import { ParserStrategy } from "@/core/ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class LavkaStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Lavka";
    this.selectors = {
      card: "[class*=p19kkpiw]",
      price:
        "[class*=phcb3a1] [class*=b15aiivf][style*='color'], [class*=t18stym3][class*=bw441np][class*=r88klks][style*='color']",
      name: "[class*=m12g4kzj]",
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent;
    this.log("parsed price text", priceString);
    const cleaned = priceString?.replace(/\s|&thinsp;/g, "").replace("₽", "") ?? "";
    const v = parseFloat(cleaned);
    if (isNaN(v)) throw new Error("Invalid price: " + priceString);
    return v;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    const s = nameText.toLowerCase().replace(",", ".").trim();
    const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
    if (!m) throw new Error("Invalid quantity: " + nameText);
    const num = parseFloat(m[1]);
    const unit = m[2];
    return getConvertedUnit(num, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceEl = cardEl.querySelector(this.selectors.price);
    if (!priceEl) throw new Error("Price element not found");

    const wrapper = priceEl.closest('[aria-hidden="true"]');
    if (!wrapper) throw new Error("Wrapper not found");

    // Ищем уже существующий unitPrice-бейдж
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;

    const formattedText = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;

    if (existingUnitPrice) {
      existingUnitPrice.textContent = formattedText;
      return;
    }

    const span = document.createElement("span");
    span.className = priceEl.className;
    span.setAttribute("data-testid", "unit-price");
    span.textContent = formattedText;

    Object.assign(span.style, {
      color: "#000",
      backgroundColor: "rgba(0, 198, 106, 0.1)",
      padding: "2px 6px 2px 0.5px",
      borderRadius: "0.25em",
      fontWeight: "500",
    });

    wrapper.appendChild(span);
  }
}
