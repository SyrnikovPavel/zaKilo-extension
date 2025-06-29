import { ParserStrategy } from "@/core/ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class MetroStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Metro";
    this.selectors = {
      card: ".product-card__content",
      price: 'span.product-unit-prices__actual, div.price, [data-testid="price-value"]',
      name: '[class*="product-card-name__text"], a[href^="/products/"] span, [data-testid="product-name"]',
      unitPrice: '[data-testid="unit-price"]',
      priceUnit: ".product-price__unit",
      renderRoot: ".product-unit-prices",
    };
  }

  shouldProcess(cardEl: Element): boolean {
    const hasPrice = cardEl.querySelector(this.selectors.price);
    const hasUnitPrice = cardEl.querySelector(this.selectors.unitPrice);

    return Boolean(hasPrice && !hasUnitPrice);
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceEl = cardEl.querySelector(this.selectors.price);
    const priceString = priceEl?.textContent || "";
    const num = priceString.replace(/[^\d.,]/g, "").replace(",", ".");
    const v = parseFloat(num);
    if (isNaN(v)) throw new Error("Не удалось распознать цену: " + priceString);
    return v;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    const nameText = cardEl.querySelector(this.selectors.name)?.textContent?.trim() || "";

    const priceUnitEl = cardEl.querySelector(this.selectors.priceUnit!);
    const priceUnitText = priceUnitEl?.textContent?.toLowerCase() || "";

    if (/(\/|)\s*кг/.test(priceUnitText)) return { unitLabel: "1 кг", multiplier: 1 } as UnitLabel;
    if (/(\/|)\s*л/.test(priceUnitText)) return { unitLabel: "1 л", multiplier: 1 } as UnitLabel;

    const regex = /([\d.,]+)\s*(г(?!од)|гр|кг|мл|л|шт)/i;
    const match = nameText.match(regex);

    if (!match) return { unitLabel: "1 шт", multiplier: 1 } as UnitLabel;
    const value = parseFloat(match[1].replace(",", "."));
    const unit = match[2];
    const result = getConvertedUnit(value, unit);
    if (result.unitLabel === null) {
      return { unitLabel: "1 шт", multiplier: 1 } as UnitLabel;
    }
    return result;
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const renderRootEl = cardEl.querySelector(this.selectors.renderRoot!);
    if (!renderRootEl) return;

    renderRootEl.querySelectorAll(this.selectors.unitPrice).forEach((el) => el.remove());

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

    renderRootEl.appendChild(span);
  }

  renderNoneUnitPrice(cardEl: HTMLElement): void {
    const renderRootEl = cardEl.querySelector(this.selectors.renderRoot!);
    if (!renderRootEl) return;

    renderRootEl.querySelectorAll(this.selectors.unitPrice).forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";

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

    renderRootEl.appendChild(span);
  }
}
