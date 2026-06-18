import React, { useMemo, useState } from 'react';
import { Plane, Users, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SunPQTrip, SunPQBookingPayload, SunPQPassenger, SunPQPaxType } from '@/types/sunpq';
import { bookingSunPQ, checkSunPQPnr } from '@/services/sunpqService';
import SunPQTicketModal from './SunPQTicketModal';

interface SearchDataLike {
  tripType: 'OW' | 'RT';
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  oneWayFee: number;
  sunpqOneWayFee?: number;
  sunpqRoundTripFee?: number;
  sunpqThreshold1?: number; sunpqDiscountOW1?: number; sunpqDiscountRT1?: number;
  sunpqThreshold2?: number; sunpqDiscountOW2?: number; sunpqDiscountRT2?: number;
  sunpqThreshold3?: number; sunpqDiscountOW3?: number; sunpqDiscountRT3?: number;
  sunpqThreshold4?: number; sunpqDiscountOW4?: number; sunpqDiscountRT4?: number;
  sunpqThreshold5?: number; sunpqDiscountOW5?: number; sunpqDiscountRT5?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  flights: SunPQTrip[];
  searchData: SearchDataLike | null;
}

const formatPrice = (price: number) => {
  const r = Math.round(price / 100) * 100;
  return new Intl.NumberFormat('de-DE').format(r);
};

const fmtDate = (d?: string) => {
  if (!d) return '';
  // 15/09/2026 -> 15/09
  const m = d.split('/');
  if (m.length >= 2) return `${m[0]}/${m[1]}`;
  return d;
};

export const calculateSunPQFinalPrice = (basePrice: number, tripType: 'OW' | 'RT', s?: SearchDataLike | null) => {
  if (!s) return basePrice;
  let final = basePrice;
  const isOW = tripType === 'OW';
  final += isOW ? (s.sunpqOneWayFee ?? 0) : (s.sunpqRoundTripFee ?? 0);
  const t5 = s.sunpqThreshold5 || 0;
  const t4 = s.sunpqThreshold4 || 0;
  const t3 = s.sunpqThreshold3 || 0;
  const t2 = s.sunpqThreshold2 || 0;
  const t1 = s.sunpqThreshold1 || 0;
  if (t5 > 0 && basePrice > t5) final -= isOW ? (s.sunpqDiscountOW5 || 0) : (s.sunpqDiscountRT5 || 0);
  else if (t4 > 0 && basePrice > t4) final -= isOW ? (s.sunpqDiscountOW4 || 0) : (s.sunpqDiscountRT4 || 0);
  else if (t3 > 0 && basePrice > t3) final -= isOW ? (s.sunpqDiscountOW3 || 0) : (s.sunpqDiscountRT3 || 0);
  else if (t2 > 0 && basePrice > t2) final -= isOW ? (s.sunpqDiscountOW2 || 0) : (s.sunpqDiscountRT2 || 0);
  else if (t1 > 0 && basePrice > t1) final -= isOW ? (s.sunpqDiscountOW1 || 0) : (s.sunpqDiscountRT1 || 0);
  return final;
};

const getBasePrice = (trip: SunPQTrip): number => {
  const tic = trip.thông_tin_chung as any;
  if (tic?.giá_vé != null) return Number(tic.giá_vé) || 0;
  if (tic?.giá_vé_gốc != null) return Number(tic.giá_vé_gốc) || 0;
  const out = trip.chiều_đi?.giá_vé_gốc || 0;
  const ret = trip.chiều_về?.giá_vé_gốc || 0;
  return Number(out) + Number(ret);
};

const getSeats = (trip: SunPQTrip): string => {
  const v = (trip.thông_tin_chung as any)?.số_ghế_còn;
  return v != null ? String(v) : '9';
};

const buildRouteStr = (leg?: { nơi_đi: string; nơi_đến: string; điểm_dừng_1?: string }) => {
  if (!leg) return '';
  return leg.điểm_dừng_1 ? `${leg.nơi_đi}-${leg.điểm_dừng_1}-${leg.nơi_đến}` : `${leg.nơi_đi}-${leg.nơi_đến}`;
};

const generateCopyText = (trip: SunPQTrip, finalPrice: number) => {
  const out = trip.chiều_đi;
  const ret = trip.chiều_về;
  const lines: string[] = [];
  lines.push(`${buildRouteStr(out)} ${out.giờ_cất_cánh} ngày ${fmtDate(out.ngày_cất_cánh)}`);
  if (ret) lines.push(`${buildRouteStr(ret)} ${ret.giờ_cất_cánh} ngày ${fmtDate(ret.ngày_cất_cánh)}`);
  lines.push(`SunPQ 7kg xách tay,`);
  lines.push(`23kg ký gửi,`);
  lines.push(`giá vé = ${formatPrice(finalPrice)}w`);
  return lines.join('\n');
};

// ----- Booking subcomponent -----
interface PaxRow {
  type: SunPQPaxType;
  last_name: string;
  first_name: string;
  title: 'MR' | 'MRS' | 'MSTR' | 'MISS';
  date_of_birth: string;
  parent_id: number | null;
}

const removeDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

const SunPQBookingForm: React.FC<{
  trip: SunPQTrip;
  tripType: 'OW' | 'RT';
  adults: number;
  children: number;
  infants: number;
  onClose: () => void;
  onSuccess?: (pnr: string) => void;
}> = ({ trip, tripType, adults, children, infants, onClose, onSuccess }) => {
  const init: PaxRow[] = [];
  for (let i = 0; i < adults; i++) init.push({ type: 'ADULT', last_name: '', first_name: '', title: 'MR', date_of_birth: '', parent_id: null });
  for (let i = 0; i < children; i++) init.push({ type: 'CHILD', last_name: '', first_name: '', title: 'MSTR', date_of_birth: '', parent_id: null });
  for (let i = 0; i < infants; i++) init.push({ type: 'INFANT', last_name: '', first_name: '', title: 'MSTR', date_of_birth: '', parent_id: 1 });
  if (init.length === 0) init.push({ type: 'ADULT', last_name: '', first_name: '', title: 'MR', date_of_birth: '', parent_id: null });

  const [passengers, setPassengers] = useState<PaxRow[]>(init);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<{ pnr: string; data: any } | null>(null);

  const update = (i: number, k: keyof PaxRow, v: any) => {
    const next = [...passengers];
    (next[i] as any)[k] = v;
    setPassengers(next);
  };

  const add = (type: SunPQPaxType) => {
    setPassengers([...passengers, {
      type, last_name: '', first_name: '',
      title: type === 'INFANT' || type === 'CHILD' ? 'MSTR' : 'MR',
      date_of_birth: '',
      parent_id: type === 'INFANT' ? 1 : null,
    }]);
  };

  const remove = (i: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    try {
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        if (!p.last_name.trim() || !p.first_name.trim()) throw new Error(`Hành khách ${i + 1}: thiếu Họ/Tên`);
        if ((p.type === 'CHILD' || p.type === 'INFANT') && !p.date_of_birth) throw new Error(`Hành khách ${i + 1}: cần Ngày sinh`);
      }
      const list_passenger: SunPQPassenger[] = passengers.map((p, idx) => ({
        pax_id: idx + 1,
        type: p.type,
        title: p.title,
        first_name: removeDiacritics(p.first_name).toUpperCase().trim(),
        last_name: removeDiacritics(p.last_name).toUpperCase().trim().split(' ')[0],
        parent_id: p.type === 'INFANT' ? (p.parent_id ?? 1) : null,
        ...(p.date_of_birth ? { date_of_birth: p.date_of_birth } : {}),
      }));
      const list_itinerary = [
        ...(trip.chiều_đi?.list_itinerary || []),
        ...(trip.chiều_về?.list_itinerary || []),
      ];
      const payload: SunPQBookingPayload = {
        list_itinerary,
        list_passenger,
        contact_info: { email: email.trim(), phone_number: phone.trim(), full_name: fullName.trim() || 'Hanvietair' },
        promo_code: '',
        corporate_code: '',
        currency: 'KRW',
        send_email: true,
      };
      setIsLoading(true);
      const res = await bookingSunPQ(payload);
      if (!res.success || !res.pnr) {
        throw new Error(res.message || 'Không thể giữ vé SunPQ. Vui lòng thử lại.');
      }
      toast.success(`Giữ vé thành công: ${res.pnr}`);
      if (onSuccess) {
        onSuccess(res.pnr);
        return;
      }
      setSuccess({ pnr: res.pnr, data: null });
    } catch (e: any) {
      toast.error(e?.message || 'Không thể giữ vé SunPQ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">🎉 Giữ vé thành công</div>
          <div className="text-2xl font-bold mt-1">PNR: {success.pnr}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded text-xs max-h-[400px] overflow-auto">
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(success.data, null, 2)}</pre>
        </div>
        <Button className="w-full" onClick={onClose}>Đóng</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Họ tên liên hệ</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Hanvietair" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." />
        </div>
        <div>
          <Label>SĐT</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="09..." />
        </div>
      </div>
      {passengers.map((p, i) => (
        <div key={i} className="border rounded p-2 space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold">
              Hành khách {i + 1} ({p.type === 'ADULT' ? 'Người lớn' : p.type === 'CHILD' ? 'Trẻ em' : 'Em bé'})
            </div>
            {passengers.length > 1 && (
              <Button variant="destructive" size="sm" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div>
              <Label className="text-xs">Họ</Label>
              <Input value={p.last_name} onChange={(e) => update(i, 'last_name', e.target.value)} placeholder="NGUYEN" />
            </div>
            <div>
              <Label className="text-xs">Tên</Label>
              <Input value={p.first_name} onChange={(e) => update(i, 'first_name', e.target.value)} placeholder="VAN A" />
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Select value={p.title} onValueChange={(v: any) => update(i, 'title', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MR">MR</SelectItem>
                  <SelectItem value="MRS">MRS</SelectItem>
                  <SelectItem value="MSTR">MSTR</SelectItem>
                  <SelectItem value="MISS">MISS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ngày sinh</Label>
              <Input type="date" value={p.date_of_birth} onChange={(e) => update(i, 'date_of_birth', e.target.value)} />
            </div>
            {p.type === 'INFANT' && (
              <div>
                <Label className="text-xs">Parent pax_id</Label>
                <Input type="number" min={1} value={p.parent_id ?? 1} onChange={(e) => update(i, 'parent_id', Number(e.target.value))} />
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => add('ADULT')}><Plus className="w-3 h-3 mr-1" />Người lớn</Button>
        <Button variant="outline" size="sm" onClick={() => add('CHILD')}><Plus className="w-3 h-3 mr-1" />Trẻ em</Button>
        <Button variant="outline" size="sm" onClick={() => add('INFANT')}><Plus className="w-3 h-3 mr-1" />Em bé</Button>
      </div>
      <Button className="w-full" disabled={isLoading} onClick={submit}>
        {isLoading ? 'Đang giữ vé...' : 'Giữ vé ngay'}
      </Button>
    </div>
  );
};

// ----- Main Modal -----
export const SunPQModal: React.FC<Props> = ({ isOpen, onClose, flights, searchData }) => {
  const tripType = searchData?.tripType || 'OW';
  const sorted = useMemo(
    () => [...flights].sort((a, b) => getBasePrice(a) - getBasePrice(b)),
    [flights],
  );
  const [bookingTrip, setBookingTrip] = useState<SunPQTrip | null>(null);
  const [ticketPNR, setTicketPNR] = useState<string | null>(null);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600 flex items-center">
              <Plane className="w-6 h-6 mr-2" />
              SunPQ ({sorted.length} chuyến bay)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            {sorted.length === 0 && (
              <div className="text-center text-gray-500 py-6">Không có vé SunPQ</div>
            )}
            {sorted.map((trip, idx) => {
              const base = getBasePrice(trip);
              const finalPrice = calculateSunPQFinalPrice(base, tripType, searchData);
              const seats = getSeats(trip);
              const out = trip.chiều_đi;
              const ret = trip.chiều_về;
              const classSummary = ret
                ? `Khứ hồi: ${out?.loại_vé}-${ret.loại_vé}`
                : `Một chiều: ${out?.loại_vé}`;
              const copyText = generateCopyText(trip, finalPrice);
              return (
                <div key={idx} className="border-2 border-orange-400 rounded-lg p-3 bg-white shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">SUNPQ</span>
                      <span className="text-lg font-bold text-gray-800">{formatPrice(finalPrice)} KRW</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Users className="w-3 h-3 mr-1" /> Còn {seats} ghế
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{classSummary}</div>
                  <div className="text-sm text-blue-700 space-y-0.5 mb-2">
                    <div>{buildRouteStr(out)} {out?.giờ_cất_cánh} ngày {fmtDate(out?.ngày_cất_cánh)}</div>
                    {ret && <div>{buildRouteStr(ret)} {ret.giờ_cất_cánh} ngày {fmtDate(ret.ngày_cất_cánh)}</div>}
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-medium text-gray-700">Thông tin gửi khách</h5>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(copyText);
                        toast.success('Đã copy thông tin chuyến bay');
                      }}
                      className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100"
                    >
                      <Copy className="w-3 h-3" /> <span className="font-medium">Copy</span>
                    </button>
                  </div>
                  <pre className="bg-gray-50 p-2 rounded font-sans font-medium whitespace-pre-line min-h-[60px] text-xl text-black">{copyText}</pre>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => setBookingTrip(trip)}>
                      Giữ vé
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {bookingTrip && (
        <Dialog open={!!bookingTrip} onOpenChange={() => setBookingTrip(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Giữ Vé SunPQ ({bookingTrip.chiều_đi?.nơi_đi} → {bookingTrip.chiều_đi?.nơi_đến})
              </DialogTitle>
            </DialogHeader>
            <SunPQBookingForm
              trip={bookingTrip}
              tripType={tripType}
              adults={searchData?.adults ?? 1}
              children={searchData?.children ?? 0}
              infants={searchData?.infants ?? 0}
              onClose={() => setBookingTrip(null)}
              onSuccess={(pnr) => { setBookingTrip(null); setTicketPNR(pnr); }}
            />
          </DialogContent>
        </Dialog>
      )}

      {ticketPNR && (
        <SunPQTicketModal
          isOpen={!!ticketPNR}
          onClose={() => setTicketPNR(null)}
          initialPNR={ticketPNR}
        />
      )}
    </>
  );
};

export default SunPQModal;
