import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class SamberiStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Samberi";
    this.selectors = {
      card: "article[class*=ProductCard_item]",
      price: "[class*=ProductCard_item__price]",
      name: "[class*=ProductCard_item__name]",
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  private findPriceBlock(cardEl: HTMLElement): HTMLElement {
    const priceBlock = cardEl.querySelector(this.selectors.price);
    if (!priceBlock) throw new Error("Price block not found");
    return priceBlock as HTMLElement;
  }

  private findPriceValueEl(cardEl: HTMLElement): HTMLElement {
    const valueEl = this.findPriceBlock(cardEl).querySelector(
      "[class*=ProductCard_value__]:not([class*=valueSmall])",
    );
    if (!valueEl) throw new Error("Price value not found");
    return valueEl as HTMLElement;
  }

  private parsePriceFromValueEl(valueEl: Element): number {
    const priceDiv = valueEl.querySelector("div");
    if (!priceDiv) throw new Error("Price div not found");

    const centsSpan = priceDiv.querySelector("span");
    if (centsSpan) {
      const integerPart = (priceDiv.firstChild?.textContent ?? "").trim().replace(/\s/g, "");
      const centsPart = centsSpan.textContent?.trim() ?? "00";
      const price = parseFloat(`${integerPart}.${centsPart}`);
      if (!isNaN(price)) return price;
    }

    const cleaned = priceDiv.textContent?.replace(/\s/g, "").replace("₽", "") ?? "";
    const price = parseFloat(cleaned.replace(",", "."));
    if (isNaN(price)) throw new Error("Invalid price: " + priceDiv.textContent);
    return price;
  }

  parsePrice(cardEl: HTMLElement): number {
    const price = this.parsePriceFromValueEl(this.findPriceValueEl(cardEl));
    this.log("parsed price", price);
    return price;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    this.log("parsed name text", nameText);

    const patterns = [
      /(\d+(?:[.,]\d+)?)([а-яёa-z]+)(?:\s|$)/i,
      /(\d+(?:[.,]\d+)?)\s+([а-яёa-z]+)(?:\s|$)/i,
    ];

    let matches: RegExpMatchArray | null = null;
    let lastIndex = -1;

    for (const pattern of patterns) {
      const allMatches = nameText.matchAll(new RegExp(pattern, "gi"));
      for (const match of allMatches) {
        if (match.index! > lastIndex) {
          matches = match;
          lastIndex = match.index!;
        }
      }
    }

    if (!matches) throw new Error("Invalid quantity: " + nameText);

    const num = parseFloat(matches[1].replace(",", "."));
    const unit = matches[2]?.toLowerCase() || "г";

    if (matches[0].includes("%")) {
      return getConvertedUnit(num, "г");
    }

    return getConvertedUnit(num, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const wrapper = this.findPriceBlock(cardEl);
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;
    const formattedText = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;

    if (existingUnitPrice) {
      existingUnitPrice.textContent = formattedText;
      return;
    }

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = formattedText;

    Object.assign(span.style, {
      color: "#000",
      backgroundColor: "rgba(0, 198, 106, 0.1)",
      padding: "2px 6px 2px 0.5px",
      borderRadius: "0.25em",
      fontWeight: "500",
      display: "block",
      marginTop: "4px",
      fontSize: "0.9em",
    });

    wrapper.appendChild(span);
  }

  renderNoneUnitPrice(cardEl: HTMLElement): void {
    const wrapper = this.findPriceBlock(cardEl);
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;

    if (existingUnitPrice) {
      existingUnitPrice.textContent = "Нет инф.";
      return;
    }

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";

    Object.assign(span.style, {
      color: "#000",
      backgroundColor: "var(--accent-color,rgba(0, 69, 198, 0.13))",
      padding: "2px 6px 2px 0.5px",
      borderRadius: "0.25em",
      fontWeight: "500",
      display: "block",
      marginTop: "4px",
      fontSize: "0.9em",
    });

    wrapper.appendChild(span);
  }
}
