import { ParserStrategy } from "@/core/ParserStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";
import type { UnitLabel } from "@/types/IStrategy";

export class DeliveryClubStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "DeliveryClub";
    this.selectors = {
      card: ['li[data-carousel-item="true"]', ".DesktopGoodsList_list li", 'div[data-testid="product-card-root"]'].join(
        ",",
      ),
      price: '[data-testid="product-card-price"]',
      name: '[data-testid="product-card-weight"]',
      unitPrice: '[data-testid="product-card-unit-price"]',
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
    return getUnitParsedWeight(num, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceEl = cardEl.querySelector(this.selectors.price);
    if (!priceEl) throw new Error("Price element not found");

    const wrapper = priceEl.closest('div[aria-hidden="true"]');
    if (!wrapper) throw new Error("Wrapper not found");

    // удалить старые
    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el) => el.remove());

    const span = document.createElement("span");
    span.className = priceEl.className;
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${roundNumber(unitPrice, 0)}\u2009₽ за ${unitLabel}`;

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
