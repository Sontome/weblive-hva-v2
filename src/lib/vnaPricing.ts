/** Shared VNA round-trip style pricing: fee + 5-tier RT discount + per-leg route discounts. */

export interface VnaRtPricingConfig {
  roundTripFeeVNA: number;
  vnaThreshold1: number;
  vnaDiscountRT1: number;
  vnaThreshold2: number;
  vnaDiscountRT2: number;
  vnaThreshold3: number;
  vnaDiscountRT3: number;
  vnaThreshold4: number;
  vnaDiscountRT4: number;
  vnaThreshold5: number;
  vnaDiscountRT5: number;
}

export interface VnaPricingLeg {
  origin?: string;
  destination?: string;
}

/**
 * Computes the final VNA price using the same rules as VNA round-trip results:
 * round-trip issuing fee, the highest matching RT discount tier (based on base price),
 * then route discounts summed over every leg.
 */
export const calculateVnaRtPrice = (
  basePrice: number,
  config: VnaRtPricingConfig,
  legs: VnaPricingLeg[],
  getRouteDiscount: (airline: string, origin: string, destination: string) => number,
): number => {
  let finalPrice = basePrice + (config.roundTripFeeVNA || 0);

  for (const tier of [5, 4, 3, 2, 1] as const) {
    const threshold = Number((config as any)[`vnaThreshold${tier}`] || 0);
    if (threshold > 0 && basePrice > threshold) {
      finalPrice -= Number((config as any)[`vnaDiscountRT${tier}`] || 0);
      break;
    }
  }

  legs.forEach((leg) => {
    if (leg.origin && leg.destination) {
      finalPrice -= getRouteDiscount('VNA', leg.origin, leg.destination);
    }
  });

  return finalPrice;
};
