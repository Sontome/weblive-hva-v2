import { VNAFlightSearchRequest, FlightSearchData } from '../types/flight';

const KOREAN_AIRPORTS = ['ICN', 'GMP', 'PUS', 'CJU', 'TAE'];

/** VNA fares from check-ve-v4 (same response shape as v3). */
const fetchVNAv4 = async (searchData: FlightSearchData): Promise<any[]> => {
  const fromKorea = KOREAN_AIRPORTS.includes((searchData.departure || '').toUpperCase());
  const body: Record<string, unknown> = {
    trip_type: searchData.tripType,
    origin: searchData.departure,
    destination: searchData.arrival,
    depart_date: searchData.departureDate,
    adult: searchData.adults,
    child: searchData.children,
    infant: searchData.infants,
    cabin_class: 'Y',
    ptc_code: fromKorea ? (searchData.ptcCode || 'VFR') : 'ADT',
  };
  if (searchData.tripType === 'RT' && searchData.returnDate) body.return_date = searchData.returnDate;
  try {
    const res = await fetch('https://apilive.hanvietair.com/vna/check-ve-v4', {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.body) ? data.body : [];
  } catch (e) {
    console.error('VNA v4 error:', e);
    return [];
  }
};

/** v3 is used only for other airlines; VNA fares come from v4. */
export const searchVietnamAirlinesFlights = async (
  searchData: FlightSearchData,
  directFlightsOnly: boolean = true,
  onVNAEarly?: (result: any) => void,
) => {
  // Fire VNA (v4) results as soon as they arrive, without waiting for v3
  const v4Promise = fetchVNAv4(searchData).then((v4) => {
    if (onVNAEarly && v4.length > 0) {
      onVNAEarly({ status_code: 200, body: v4 });
    }
    return v4;
  });
  const [v3, v4] = await Promise.all([
    searchVietnamAirlinesFlightsV3(searchData, directFlightsOnly).catch((e) => {
      console.error('VNA v3 error:', e);
      return { status_code: 500, body: [] } as any;
    }),
    v4Promise,
  ]);
  const others = (Array.isArray(v3?.body) ? v3.body : []).filter(
    (r: any) => r?.['chiều_đi']?.['hãng'] !== 'VNA',
  );
  const merged = [...v4, ...others];
  if (merged.length === 0) return { status_code: 404, body: [], error: 'No flights found' };
  return { ...(v3 || {}), status_code: 200, body: merged };
};


const searchVietnamAirlinesFlightsV3 = async (
  searchData: FlightSearchData,
  directFlightsOnly: boolean = true,
  isRetry: boolean = false,
  overrideRequestData?: Partial<VNAFlightSearchRequest> // thêm option để override
) => {
  let requestData: VNAFlightSearchRequest = {
    dep0: searchData.departure,
    arr0: searchData.arrival,
    depdate0: searchData.departureDate,
    activedVia: "0",
    activedIDT: "ADT,VFR",
    adt: searchData.adults.toString(),
    chd: searchData.children.toString(),
    inf: searchData.infants.toString(),
    page: "1",
    sochieu: searchData.tripType,
    filterTimeSlideMin0: "5",
    filterTimeSlideMax0: "2355",
    filterTimeSlideMin1: "5",
    filterTimeSlideMax1: "2355",
    session_key: ""
  };

  if (searchData.tripType === 'RT' && searchData.returnDate) {
    requestData.depdate1 = searchData.returnDate;
  }

  // Gộp override vào requestData nếu có
  if (overrideRequestData) {
    requestData = { ...requestData, ...overrideRequestData };
  }

  try {
    const response = await fetch('https://apilive.hanvietair.com/vna/check-ve-v3', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('=== VNA DEBUG UPDATED ===');
    console.log('Raw VNA response:', data);

    // Nếu body null thì retry 1 lần với session_key + activedVia mới
    if (!isRetry && (data.body === "null" || data.body === null)) {
      console.log('VNA: body null, retry with session_key and activedVia 0,1,2');
      return await searchVietnamAirlinesFlightsV3(
        searchData,
        directFlightsOnly,
        true,
        {
          session_key: data.session_key || "",
          activedVia: "0,1,2"
        }
      );
    }

    console.log('VNA status_code:', data.status_code);
    console.log('VNA body type:', typeof data.body);
    console.log('VNA flights count from API:', data.body ? data.body.length : 0);
    console.log('DirectFlightsOnly parameter:', directFlightsOnly);

    if (!data.body || data.body.length === 0) {
      console.log('VNA: No flights found, returning 404 status');
      return {
        status_code: 404,
        body: [],
        error: 'No flights found'
      };
    }

    return {
      ...data,
      status_code: data.status_code || 200
    };
  } catch (error) {
    console.error('Error searching VNA flights:', error);
    throw error;
  }
};
