export const MINIMUM_ORDER = 300;

export const SHIPPING_RATES: Record<string, number> = {
  ACT: 10,
  NSW: 10,
  VIC: 10,
  QLD: 15,
  SA: 15,
  WA: 20,
  TAS: 20,
  NT: 25,
};

export const DEFAULT_SHIPPING = 15;

export function getShippingCost(state: string): number {
  return SHIPPING_RATES[state] || DEFAULT_SHIPPING;
}