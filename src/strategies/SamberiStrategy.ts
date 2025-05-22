import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";

export class SamberiStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Samberi";
    this.selectors = {
      card: "[class*=product-item-container]",
      price: "[class*=product-item-price-current]",
      name: "[class*=product-item-title] a",
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

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() ?? "";
    this.log("parsed name text", nameText);

    // Ищем все возможные форматы единиц измерения
    const patterns = [
      // Формат "число + единица без пробела" (например, "100г", "1л")
      /(\d+(?:[.,]\d+)?)([а-яёa-z]+)(?:\s|$)/i,
      // Формат "число + пробел + единица" (например, "200 мл")
      /(\d+(?:[.,]\d+)?)\s+([а-яёa-z]+)(?:\s|$)/i,
    ];

    // Ищем все совпадения во всех форматах
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
    // Для процентов используем "г" как единицу измерения
    const unit = matches[2]?.toLowerCase() || "г";

    // Если это процент, конвертируем в граммы (предполагаем, что это процент от 100г)
    if (matches[0].includes("%")) {
      return getUnitParsedWeight(num, "г");
    }

    return getUnitParsedWeight(num, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceEl = cardEl.querySelector(this.selectors.price);
    if (!priceEl) throw new Error("Price element not found");

    const wrapper = priceEl.closest("[class*=product-item-info-container]");
    if (!wrapper) throw new Error("Wrapper not found");

    // Ищем уже существующий unitPrice-бейдж
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;

    const formattedText = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;

    if (existingUnitPrice) {
      existingUnitPrice.textContent = formattedText;
      return;
    }

    const span = document.createElement("span");
    span.className = "product-item-price-current";
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
    const priceEl = cardEl.querySelector(this.selectors.price);
    if (!priceEl) throw new Error("Price element not found");

    const wrapper = priceEl.closest("[class*=product-item-info-container]");
    if (!wrapper) throw new Error("Wrapper not found");

    // Ищем уже существующий unitPrice-бейдж
    const existingUnitPrice = wrapper.querySelector('[data-testid="unit-price"]') as HTMLElement | null;

    if (existingUnitPrice) {
      existingUnitPrice.textContent = "Нет инф.";
      return;
    }

    const span = document.createElement("span");
    span.className = "product-item-price-current";
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
