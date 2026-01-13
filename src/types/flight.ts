
export interface FlightSearchRequest {
  dep0: string;
  arr0: string;
  depdate0: string;
  depdate1?: string;
  adt: string;
  chd: string;
  inf: string;
  sochieu: string;
}

export interface VNAFlightSearchRequest extends FlightSearchRequest {
  activedVia: string;
  activedIDT: string;
  page: string;
  filterTimeSlideMin0: string;
  filterTimeSlideMax0: string;
  filterTimeSlideMin1: string;
  filterTimeSlideMax1: string;
  session_key: string;
}

export interface FlightSearchData {
  departure: string;
  arrival: string;
  departureDate: string;
  returnDate: string;
  tripType: 'OW' | 'RT';
  adults: number;
  children: number;
  infants: number;
  oneWayFee: number;
  roundTripFeeVietjet: number;
  roundTripFeeVNA: number;
  roundTripFeeOther: number;
  // VNA thresholds and discounts (5 tiers)
  vnaThreshold1: number;
  vnaDiscountOW1: number;
  vnaDiscountRT1: number;
  vnaThreshold2: number;
  vnaDiscountOW2: number;
  vnaDiscountRT2: number;
  vnaThreshold3: number;
  vnaDiscountOW3: number;
  vnaDiscountRT3: number;
  vnaThreshold4: number;
  vnaDiscountOW4: number;
  vnaDiscountRT4: number;
  vnaThreshold5: number;
  vnaDiscountOW5: number;
  vnaDiscountRT5: number;
  // Vietjet thresholds and discounts (5 tiers)
  vietjetThreshold1: number;
  vietjetDiscountOW1: number;
  vietjetDiscountRT1: number;
  vietjetThreshold2: number;
  vietjetDiscountOW2: number;
  vietjetDiscountRT2: number;
  vietjetThreshold3: number;
  vietjetDiscountOW3: number;
  vietjetDiscountRT3: number;
  vietjetThreshold4: number;
  vietjetDiscountOW4: number;
  vietjetDiscountRT4: number;
  vietjetThreshold5: number;
  vietjetDiscountOW5: number;
  vietjetDiscountRT5: number;
  // Other airlines thresholds and discounts (5 tiers)
  otherThreshold1: number;
  otherDiscountOW1: number;
  otherDiscountRT1: number;
  otherThreshold2: number;
  otherDiscountOW2: number;
  otherDiscountRT2: number;
  otherThreshold3: number;
  otherDiscountOW3: number;
  otherDiscountRT3: number;
  otherThreshold4: number;
  otherDiscountOW4: number;
  otherDiscountRT4: number;
  otherThreshold5: number;
  otherDiscountOW5: number;
  otherDiscountRT5: number;
}
