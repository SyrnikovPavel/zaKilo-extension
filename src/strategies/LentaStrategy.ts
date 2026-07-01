import { ParserStrategy } from "@/core/ParserStrategy";
import { isUnitLabel, type NoneUnitLabel, type UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class LentaStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Lenta";
    this.selectors = {
      card: 'a.product-card, a[automation-id="productCard"]',
      name: "[automation-id='product-names'], [automation-id='catProductName']",
      volume: ".product-position-price .price, .card-name_package",
      price: '[automation-id="product-price"] .main-price, .price-and-buttons .main-price, .main-price',
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  private findPriceBlock(cardEl: Element): HTMLElement {
    const priceBlock = cardEl.querySelector('[automation-id="product-price"], .price-and-buttons .product-price, .product-price');
    if (!priceBlock) throw new Error("Блок цены не найден");
    return priceBlock as HTMLElement;
  }

  private parseWeightText(text: string): UnitLabel | NoneUnitLabel | null {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
    const match = normalized.match(/([\d.,]+)\s*(г|гр|кг|мл|л|шт)/i);
    if (!match) return null;

    const value = parseFloat(match[1].replace(",", "."));
    if (isNaN(value)) return null;

    return getConvertedUnit(value, match[2]);
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceElement = cardEl.querySelector(this.selectors.price);
    if (!priceElement) throw new Error("Элемент цены не найден");

    const priceText = priceElement.textContent?.trim() || "";
    const priceRegex = /(?<!\d)([0-9]{1,3}(?:[ \u00A0\u202F][0-9]{3})*(?:[.,][0-9]+)?)/u;
    const priceMatch = priceText.match(priceRegex);

    if (!priceMatch) throw new Error("Цена не распознана: " + priceText);

    const price = parseFloat(priceMatch[1].replace(/[ \u00A0\u202F]/g, "").replace(",", "."));
    if (isNaN(price)) throw new Error("Неверный формат цены: " + priceText);

    return price;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const existing = cardEl.querySelector('[data-testid="unit-price"]');
    if (existing) {
      const txt = existing.textContent?.trim() || "";
      const m = txt.match(/(\d+)\s*₽\/(г|гр|кг|мл|л|шт)/i);
      if (m) {
        return getConvertedUnit(parseInt(m[1], 10), m[2].toLowerCase());
      }
    }

    const pkgEl = cardEl.querySelector(".card-name_package");
    if (pkgEl) {
      const fromPackage = this.parseWeightText(pkgEl.textContent ?? "");
      if (fromPackage && isUnitLabel(fromPackage)) return fromPackage;
    }

    const nameEl = cardEl.querySelector(
      "[automation-id='catProductName'], [automation-id='product-names'], .lu-product-card-name[title]",
    ) as HTMLElement | null;
    if (nameEl) {
      const title = nameEl.getAttribute("title") || nameEl.textContent || "";
      const fromTitle = this.parseWeightText(title);
      if (fromTitle && isUnitLabel(fromTitle)) return fromTitle;
    }

    const labelEl = cardEl.querySelector(".product-position-price .price");
    if (labelEl) {
      const labelTxt = labelEl.textContent?.trim() || "";
      const mLabel = labelTxt.match(/Цена за\s*([\d.,]+)\s*(г|гр|кг|мл|л|шт)/i);
      if (mLabel) {
        return getConvertedUnit(parseFloat(mLabel[1].replace(",", ".")), mLabel[2]);
      }
    }

    return {
      unitLabel: null,
      multiplier: null,
    } as NoneUnitLabel;
  }

  renderUnitPrice(cardEl: Element, unitPrice: number, unitLabel: string): void {
    const priceBlock = this.findPriceBlock(cardEl);

    cardEl.querySelectorAll('[data-testid="unit-price"]').forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${roundNumber(unitPrice, 0)}\u2009₽/${unitLabel}`;

    const fz = "calc(0.7vw)";
    Object.assign(span.style, {
      display: "inline-block",
      marginLeft: "0.4em",
      marginRight: "0.4em",
      color: "rgb(0, 0, 0)",
      padding: "2px",
      borderRadius: "4px",
      backgroundColor: "rgb(230, 245, 239)",
      fontWeight: "900",
      fontSize: fz,
    });

    priceBlock.after(span);
  }

  renderNoneUnitPrice(cardEl: Element): void {
    const priceBlock = this.findPriceBlock(cardEl);

    cardEl.querySelectorAll('[data-testid="unit-price"]').forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";

    const fz = "calc(0.7vw)";
    Object.assign(span.style, {
      display: "inline-block",
      marginLeft: "0.4em",
      marginRight: "0.4em",
      color: "rgb(0, 0, 0)",
      padding: "2px",
      borderRadius: "4px",
      backgroundColor: "var(--accent-color,rgba(0, 69, 198, 0.13))",
      fontWeight: "900",
      fontSize: fz,
    });

    priceBlock.after(span);
  }
}
