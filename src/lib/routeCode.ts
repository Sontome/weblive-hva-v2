const MONTH_CODES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const dateCode = (isoDate: string): string => {
  const [, m, day] = isoDate.split("-");
  return `${day}${MONTH_CODES[parseInt(m, 10) - 1]}`;
};

/**
 * Build the search route code for sharing:
 * - One-way: ANVN20NOVICNVII
 * - Round-trip: ANVN20NOVICNVII*ANVN23NOVVIIICN
 * Not applicable to multi-city (returns "").
 */
export const buildRouteCode = (
  input: {
    tripType: "OW" | "RT" | "MD";
    departure: string;
    arrival: string;
    departureDate: string;
    returnDate?: string;
  },
): string => {
  if (input.tripType === "MD") return "";
  const dep = (input.departure || "").toUpperCase();
  const arr = (input.arrival || "").toUpperCase();
  if (!dep || !arr || !input.departureDate) return "";
  const outbound = `ANVN${dateCode(input.departureDate)}${dep}${arr}`;
  if (input.tripType === "RT") {
    if (!input.returnDate) return "";
    return `${outbound}*ANVN${dateCode(input.returnDate)}${arr}${dep}`;
  }
  return outbound;
};
