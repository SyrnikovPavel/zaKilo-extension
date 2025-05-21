export type UnitLabel = {
  unitLabel: string;
  multiplier: number;
};

export interface IStrategy {
  strategyName: string;
  selectors: {
    card: string;
    price: string;
    discountPrice?: string;
    name: string;
    unitPrice: string;
    volume?: string;
    renderRoot?: string;
  };

  getCardSelector(): string;
  parsePrice(cardEl: HTMLElement): number;
  parseQuantity(cardEl: HTMLElement): UnitLabel;
  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void;
  shouldProcess(cardEl: HTMLElement): boolean;
  process(cardEl: HTMLElement): void;
  log(...args: unknown[]): void;
}
