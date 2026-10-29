export type VnaBookingType = 'VFR' | 'ADT' | 'STU';

export interface VnaV3Passenger {
  first_name: string;
  last_name: string;
  gender: 'M' | 'F';
  dob?: string;
}

export interface VnaV3Passengers {
  adults: VnaV3Passenger[];
  children: VnaV3Passenger[];
  infants: VnaV3Passenger[];
}

export type VnaMultiCityItinerary = Record<string, any>;

export const buildVnaMultiCityBookingRequest = (
  itinerary: VnaMultiCityItinerary,
  passengers: VnaV3Passengers,
  doiTuong: VnaBookingType,
  contacts: { email?: string; phone?: string },
) => {
  const legs = Object.keys(itinerary).filter((key) => /^chặng_\d+$/.test(key));
  if (legs.length < 2 || legs.length > 4) throw new Error('Hành trình phải có từ 2 đến 4 chặng.');
  if (passengers.adults.length + passengers.children.length === 0) throw new Error('Phải có ít nhất một hành khách chiếm ghế.');
  if (passengers.infants.length > passengers.adults.length) throw new Error('Mỗi em bé phải có một người lớn đi kèm.');
  for (const passenger of [...passengers.children, ...passengers.infants]) {
    if (!passenger.dob) throw new Error('Trẻ em và em bé phải có ngày sinh.');
  }
  const params = new URLSearchParams({ doituong: doiTuong });
  const email = contacts.email?.trim();
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email không đúng định dạng');
    params.set('emailkakao', email);
  }
  const phone = contacts.phone?.trim();
  if (phone) params.set('phonekakao', phone.startsWith('0') || phone.startsWith('+') ? phone : `0${phone}`);
  return {
    url: `https://apilive.hanvietair.com/vna/booking-v3?${params.toString()}`,
    body: { passengers, list_itinerary: itinerary },
  };
};

const apiMessage = (data: any): string => {
  for (const value of [data?.detail, data?.mess, data?.message, data?.error, data?.responses]) {
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value)) {
      const messages = value.map((item) => typeof item === 'string' ? item : item?.msg ?? item?.response).filter(Boolean);
      if (messages.length) return messages.join('; ');
    }
  }
  return 'Không thể giữ vé VNA nhiều chặng. Vui lòng kiểm tra lại thông tin.';
};

export const parseVnaMultiCityBookingResponse = (data: any, httpOk = true) => {
  const pnr = typeof data?.['mã_giữ_vé'] === 'string' ? data['mã_giữ_vé'].trim().toUpperCase() : '';
  if (!httpOk || data?.status === 'Error' || !/^[A-Z0-9]{6}$/.test(pnr)) throw new Error(apiMessage(data));
  return { pnr, deadline: typeof data?.['hạn_thanh_toán'] === 'string' ? data['hạn_thanh_toán'] : undefined };
};

export const bookVnaMultiCity = async (
  itinerary: VnaMultiCityItinerary,
  passengers: VnaV3Passengers,
  doiTuong: VnaBookingType,
  contacts: { email?: string; phone?: string },
) => {
  const request = buildVnaMultiCityBookingRequest(itinerary, passengers, doiTuong, contacts);
  let response: Response;
  try {
    response = await fetch(request.url, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request.body),
    });
  } catch {
    throw new Error('Chưa xác định được kết quả giữ vé. Vui lòng kiểm tra lại trước khi thực hiện tiếp.');
  }
  let data: unknown;
  try { data = await response.json(); } catch {
    throw new Error('Phản hồi giữ vé không hợp lệ. Vui lòng kiểm tra lại trước khi thực hiện tiếp.');
  }
  return parseVnaMultiCityBookingResponse(data, response.ok);
};
