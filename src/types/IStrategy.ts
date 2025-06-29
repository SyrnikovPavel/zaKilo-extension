import type { Tagged } from "type-fest";
export type UnitLabel = Tagged<
  {
    unitLabel: string;
    multiplier: number;
  },
  "UnitLabel"
  >;

export type NoneUnitLabel = Tagged<
  {
    unitLabel: null;
    multiplier: null;
  },
  "NoneUnitLabel"
  >;

export const isUnitLabel = (value: UnitLabel | NoneUnitLabel): value is UnitLabel => {
  return (value as UnitLabel).unitLabel !== null;
};

export const isNoneUnitLabel = (value: UnitLabel | NoneUnitLabel): value is NoneUnitLabel => {
  return (value as NoneUnitLabel).unitLabel === null;
};


export interface IStrategy {
  strategyName: string /*  */;
  selectors: {
    card: string;
    price: string;
    discountPrice?: string;
    name: string;
    unitPrice: string;
    volume?: string;
    renderRoot?: string;
    priceUnit?: string;
  };

  getCardSelector(): string;
  parsePrice(cardEl: HTMLElement): number;
  parseQuantity(cardEl: HTMLElement): UnitLabel | NoneUnitLabel;
  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void;
  renderNoneUnitPrice(cardEl: HTMLElement): void;
  shouldProcess(cardEl: HTMLElement): boolean;
  process(cardEl: HTMLElement): void;
  log(...args: any[]): void;
}