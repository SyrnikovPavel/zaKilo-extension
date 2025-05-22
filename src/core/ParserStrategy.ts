import { isNoneUnitLabel, isUnitLabel, type IStrategy, type NoneUnitLabel, type UnitLabel } from "@/types/IStrategy";

const isDev = import.meta.env.DEV;

export abstract class ParserStrategy implements IStrategy {
  public strategyName: string;
  public selectors: IStrategy["selectors"];

  protected constructor() {
    this.strategyName = "unknown";
    this.selectors = {
      card: "",
      price: "",
      name: "",
      unitPrice: "",
    };
  }

  public getCardSelector(): string {
    if (!this.selectors.card) throw new Error("card selector not defined");
    return this.selectors.card;
  }

  public shouldProcess(cardEl: HTMLElement): boolean {
    const selectorsSet = this.selectors?.card && this.selectors?.price && this.selectors?.name;

    if (!selectorsSet) {
      throw new Error(`selectors not set for ${this.strategyName} strategy`);
    }

    return Boolean(
      cardEl.querySelector(this.selectors.price!) &&
        cardEl.querySelector(this.selectors.name!) &&
        !cardEl.querySelector(this.selectors.unitPrice!),
    );
  }

  process(cardEl: HTMLElement): void {
    this.log("processing card", cardEl);
    const price = this.parsePrice(cardEl);
    this.log("parsed price", price);

    const parsedQuantity: UnitLabel | NoneUnitLabel = this.parseQuantity(cardEl);

    if (isNoneUnitLabel(parsedQuantity) ) {
      this.log("none information about quantity");
      this.renderNoneUnitPrice(cardEl);
    }

    if (isUnitLabel(parsedQuantity)) {
      const { unitLabel, multiplier } = parsedQuantity;
      this.log("parsed quantity", { unitLabel, multiplier });

      const unitPrice = price * multiplier;
      this.log("calculated unit price", unitPrice);
      this.renderUnitPrice(cardEl, unitPrice, unitLabel);
    }
  }

  log(...args: unknown[]): void {
    if (isDev) {
      console.log(`[${this.strategyName}]`, ...args);
    }
  }

  abstract parsePrice(cardEl: HTMLElement): number;
  abstract parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel;
  abstract renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void;
  abstract renderNoneUnitPrice(cardEl: HTMLElement): void;
}
