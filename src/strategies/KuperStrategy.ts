import { ParserStrategy } from "@/core/ParserStrategy";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { getConvertedUnit, roundNumber } from "@/utils/converters";

export class KuperStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "Kuper";
    this.selectors = {
      card: "[class*=ProductCardGridLayout]",
      name: "[data-qa$=_title]",
      volume: "[data-qa$=_volume]",
      price: "[class*=priceText]",
      unitPrice: '[data-testid="unit-price"]',
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceString = cardEl.querySelector(this.selectors.price)?.textContent ?? "";
    // Купер разделяет разряды (неразрывным) пробелом: "1 149,00" -> "1149,00"
    const normalized = priceString.replace(/(\d)\s(?=\d)/g, "$1");
    const match = normalized.match(/(\d+,\d+)/);
    const price = parseFloat(match ? match[1].replace(",", ".") : "");
    if (isNaN(price)) throw new Error("Цена не распознана: " + priceString);
    return price;
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel {
    // Поле объёма у Купера ненадёжно (показывает "1 шт." или прикидку массы),
    // поэтому количество берём из полного названия. Название -- свободный текст
    // продавца, в textContent оно обрезается, а полный текст лежит в title/aria.
    const nameEl = cardEl.querySelector(this.selectors.name);
    const name = (
      nameEl?.getAttribute("title") ||
      nameEl?.getAttribute("aria-label") ||
      nameEl?.textContent ||
      ""
    ).trim();
    this.log("kuper name", name);

    const MASS = "кг|гр|г|мл|л";
    const s = name.toLowerCase();

    // Число перед самостоятельной единицей. Lookahead пропускает проценты
    // ("3,2%") и единицы, склеенные со словом.
    const mass = s.match(new RegExp(`([\\d.,]+)\\s*(${MASS})(?![а-яё%])`, "i"));
    const pieces = s.match(/(\d+)\s*шт/i);

    // 1. Мультипак: в имени одновременно и штуки, и вес ("5 шт х 80 г").
    //    Суммарный вес берём из отдельного блока объёма -- Купер уже посчитал
    //    итог ("400 г"), это надёжнее, чем перемножать свободный текст имени.
    if (mass && pieces) {
      const volumeText = (this.selectors.volume && cardEl.querySelector(this.selectors.volume)?.textContent) || "";
      // В слоте объёма разряд отделён (неразрывным) пробелом: "1 000 г" -> "1000 г".
      const total = volumeText
        .toLowerCase()
        .replace(/(\d)\s(?=\d)/g, "$1")
        .match(new RegExp(`([\\d.,]+)\\s*(${MASS})`, "i"));
      if (total) return getConvertedUnit(parseFloat(total[1].replace(",", ".")), total[2]);
      // Мультипак без итога в слоте -- не угадываем перемножением имени.
      return { unitLabel: null, multiplier: null } as NoneUnitLabel;
    }

    // 2. Одиночная масса/объём.
    if (mass) return getConvertedUnit(parseFloat(mass[1].replace(",", ".")), mass[2]);

    // 3. Чистые штуки (яйца и т.п.): "<N> шт" без массы. Блок объёма тут
    //    ненадёжен (Купер кладёт туда прикидку массы), считаем за штуку из имени.
    if (pieces) return getConvertedUnit(parseInt(pieces[1], 10), "шт");

    // 4. Количество не распознано.
    return { unitLabel: null, multiplier: null } as NoneUnitLabel;
  }

  renderUnitPrice(cardEl: Element, unitPrice: number, unitLabel: string): void {
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");
    if (!wrapper) throw new Error("Wrapper not found");

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el: Element) => el.remove());

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
      fontSize: fz,
    });
    wrapper.appendChild(span);
  }

  renderNoneUnitPrice(cardEl: Element): void {
    const wrapper = cardEl.querySelector(this.selectors.price)?.closest("div");
    if (!wrapper) throw new Error("Wrapper not found");

    const fz = "calc(0.95vw)";

    wrapper.style.fontSize = fz;
    // @ts-expect-error
    wrapper.parentElement.style.fontSize = fz;

    wrapper.querySelectorAll(this.selectors.unitPrice).forEach((el: Element) => el.remove());

    const span = document.createElement("span");
    span.setAttribute("data-testid", "unit-price");
    span.textContent = "Нет инф.";
    Object.assign(span.style, {
      display: "inline-block",
      marginLeft: "0.5em",
      color: "#000",
      background: "var(--accent-color,rgba(0, 69, 198, 0.13))",
      padding: "2px 6px",
      borderRadius: "4px",
      fontWeight: "900",
      fontSize: fz,
    });
    wrapper.appendChild(span);
  }
}
