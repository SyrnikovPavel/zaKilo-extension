import { ParserStrategy } from "@/core/ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";

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
    const priceElement = cardEl.querySelector(this.selectors.price);
    const priceString = priceElement?.textContent;

    if (!priceString) {
      throw new Error("Price string is empty or element not found");
    }

    const normalizedSpaceString = priceString.replace(/\s|&thinsp;/g, " ").trim();
    const match = normalizedSpaceString.match(/^([\d.,]+)/);

    if (match && match[1]) {
      const potentialPrice = match[1].replace(",", ".");
      this.log("parsed price text", potentialPrice);
      const v = parseFloat(potentialPrice);
      if (!isNaN(v)) {
        return v;
      }
    }

    throw new Error("Invalid price: " + priceString + " (normalized: " + normalizedSpaceString + ")");
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    const s = nameText.toLowerCase().replace(",", ".").trim();
    const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
    if (!m) throw new Error("Invalid quantity: " + nameText);
    const num = parseFloat(m[1]);
    const unit = m[2];
    return getUnitParsedWeight(num, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceEl = cardEl.querySelector(this.selectors.price);
    if (!priceEl) throw new Error("Price element not found");

    const wrapper = priceEl.closest('[aria-hidden="true"]');
    if (!wrapper) throw new Error("Wrapper not found");

    // Ищем уже существующий unitPrice-бейдж
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;

    const formattedText = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;


    const styles = {
      color: "#000",
      backgroundColor: "rgba(0, 198, 106, 0.1)",
      padding: "2px 3px 2px 3px",
      borderRadius: "0.25em",
      fontWeight: "500",
    };

    if (existingUnitPrice) {
      existingUnitPrice.textContent = formattedText;
      Object.assign(existingUnitPrice.style, styles);
      return;
    }

    const span = document.createElement("span");
    span.className = priceEl.className;
    span.setAttribute("data-testid", "unit-price");
    span.textContent = formattedText;

    Object.assign(span.style, styles);

    wrapper.appendChild(span);
  }
}
