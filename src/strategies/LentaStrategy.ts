import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight, roundNumber } from "@/utils/converters";

export class LentaStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Lenta";
    this.selectors = {
      card: ".product-card",
      name: "[automation-id='catProductName']",
      volume: ".product-position-price .price, .card-name_package",
      price: ".main-price",
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceElement = cardEl.querySelector(this.selectors.price);
    if (!priceElement) throw new Error("Элемент цены не найден");

    const priceText = priceElement.textContent?.trim() || "";
    const priceMatch = priceText.match(/(\d+,\d+)/);

    if (!priceMatch) throw new Error("Цена не распознана: " + priceText);

    const price = parseFloat(priceMatch[1].replace(",", "."));
    if (isNaN(price)) throw new Error("Неверный формат цены: " + priceText);

    return price;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    const existing = cardEl.querySelector('[data-testid="unit-price"]');
    if (existing) {
      const txt = existing.textContent?.trim() || "";
      const m = txt.match(/(\d+)\s*₽\/(г|гр|кг|мл|л|шт)/i);
      if (m) {
        return getUnitParsedWeight(parseInt(m[1], 10), m[2].toLowerCase());
      }
    }

    const pkgEl = cardEl.querySelector(".card-name_package");
    if (pkgEl) {
      const pkgText = pkgEl.textContent?.trim() || "";
      const mPkg = pkgText.match(/(\d+)(г|гр|кг|мл|л|шт)/i);
      if (mPkg) {
        return getUnitParsedWeight(parseInt(mPkg[1], 10), mPkg[2].toLowerCase());
      }
    }

    const nameEl = cardEl.querySelector("[automation-id='catProductName']") as HTMLElement;
    if (nameEl) {
      const title = nameEl.getAttribute("title") || "";
      const mTitle = title.match(/(\d+)(г|гр|кг|мл|л|шт)/i);
      if (mTitle) {
        return getUnitParsedWeight(parseInt(mTitle[1], 10), mTitle[2].toLowerCase());
      }
    }

    const labelEl = cardEl.querySelector(".product-position-price .price");
    if (labelEl) {
      const labelTxt = labelEl.textContent?.trim() || "";
      const mLabel = labelTxt.match(/Цена за\s*(\d+)\s*(г|гр|кг|мл|л|шт)/i);
      if (mLabel) {
        return getUnitParsedWeight(parseInt(mLabel[1], 10), mLabel[2].toLowerCase());
      }
    }

    return {
      unitLabel: null,
      multiplier: null,
    } as NoneUnitLabel;
  }

  renderUnitPrice(cardEl: Element, unitPrice: number, unitLabel: string): void {
    const priceWrapper = cardEl.querySelector(".price-and-buttons") as HTMLElement;
    if (!priceWrapper) {
      throw new Error("Wrapper цены не найден");
    }

    priceWrapper.querySelectorAll('[data-testid="unit-price"]').forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = `${roundNumber(unitPrice, 0)}\u2009₽/${unitLabel}`;

    // 4. Добавить стили
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

    // 5. Найти блок с основной ценой
    const priceBlock = priceWrapper.querySelector(".product-price");
    if (!priceBlock) {
      throw new Error("Блок цены не найден");
    }

    // 6. Вставить span сразу после .product-price
    priceBlock.after(span);
  }

  renderNoneUnitPrice(cardEl: Element): void {
    const priceWrapper = cardEl.querySelector(".price-and-buttons") as HTMLElement;
    if (!priceWrapper) {
      throw new Error("Wrapper цены не найден");
    }

    priceWrapper.querySelectorAll('[data-testid="unit-price"]').forEach((el) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";

    // Добавить стили
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

    // Найти блок с основной ценой
    const priceBlock = priceWrapper.querySelector(".product-price");
    if (!priceBlock) {
      throw new Error("Блок цены не найден");
    }

    // Вставить span сразу после .product-price
    priceBlock.after(span);
  }
}
