import React from 'react';
import { Users, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import type { SunPQTrip } from '@/types/sunpq';
import { calculateSunPQFinalPrice } from './SunPQModal';
import { useTicketRulesDataset } from '@/hooks/useTicketRules';
import { applyTicketRules, formatNotesLine } from '@/services/ticketRuleEngine';
import type { RuleSegmentInput } from '@/types/ticketRules';

interface SearchDataLike {
  tripType: 'OW' | 'RT';
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
  trip: SunPQTrip;
  searchData: SearchDataLike | null;
  onBook?: () => void;
}

const formatPrice = (price: number) => {
  const r = Math.round(price / 100) * 100;
  return new Intl.NumberFormat('de-DE').format(r);
};

const fmtDate = (d?: string) => {
  if (!d) return '';
  const m = d.split('/');
  if (m.length >= 2) return `${m[0]}/${m[1]}`;
  return d;
};

const buildRouteStr = (leg?: { nơi_đi: string; nơi_đến: string; điểm_dừng_1?: string }) => {
  if (!leg) return '';
  return leg.điểm_dừng_1 ? `${leg.nơi_đi}-${leg.điểm_dừng_1}-${leg.nơi_đến}` : `${leg.nơi_đi}-${leg.nơi_đến}`;
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

const buildSunPQRuleSegments = (trip: SunPQTrip): RuleSegmentInput[] => {
  const segs: RuleSegmentInput[] = [];
  const mk = (leg: SunPQTrip['chiều_đi'] | undefined, legIndex: number) => {
    if (!leg) return;
    const hasStop = !!leg.điểm_dừng_1;
    const legSize = hasStop ? 2 : 1;
    const to = hasStop ? (leg.điểm_dừng_1 as string) : leg.nơi_đến;
    segs.push({
      airline: 'SUN',
      from: leg.nơi_đi,
      to,
      departure_time: leg.giờ_cất_cánh,
      arrival_time: leg.giờ_hạ_cánh,
      departure_date: leg.ngày_cất_cánh,
      segment_order: 1,
      leg_index: legIndex,
      leg_size: legSize,
      booking_class: leg.loại_vé,
    });
  };
  mk(trip.chiều_đi, 0);
  mk(trip.chiều_về, 1);
  return segs;
};

const generateBodyText = (trip: SunPQTrip, finalPrice: number, baggageLine?: string) => {
  const out = trip.chiều_đi;
  const ret = trip.chiều_về;
  const lines: string[] = [];
  lines.push(`${buildRouteStr(out)} ${out.giờ_cất_cánh} ngày ${fmtDate(out.ngày_cất_cánh)}`);
  if (ret) lines.push(`${buildRouteStr(ret)} ${ret.giờ_cất_cánh} ngày ${fmtDate(ret.ngày_cất_cánh)}`);
  lines.push(`SunPQ 7kg xách tay, ${baggageLine || '23kg ký gửi'}, giá vé = ${formatPrice(finalPrice)}w`);
  return lines.join('\n');
};

export const SunPQFlightCard: React.FC<Props> = ({ trip, searchData, onBook }) => {
  const { data: rulesDataset } = useTicketRulesDataset();
  const tripType = searchData?.tripType || 'OW';
  const base = getBasePrice(trip);
  const finalPrice = calculateSunPQFinalPrice(base, tripType, searchData);
  const seats = getSeats(trip);
  const out = trip.chiều_đi;
  const ret = trip.chiều_về;
  const classSummary = ret ? `Khứ hồi: ${out?.loại_vé}-${ret.loại_vé}` : `Một chiều: ${out?.loại_vé}`;
  const effects = rulesDataset
    ? applyTicketRules({ segments: buildSunPQRuleSegments(trip), raw: trip }, rulesDataset)
    : null;
  const bodyText = generateBodyText(trip, finalPrice, effects?.baggage);
  const noteLine = effects?.notes?.length ? formatNotesLine(effects.notes) : '';
  const copyText = noteLine ? `${bodyText}\n${noteLine}` : bodyText;

  return (
    <div className="border-2 border-orange-400 rounded-lg p-3 bg-white shadow h-full flex flex-col">
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
      <pre className="bg-gray-50 p-2 rounded font-sans font-medium whitespace-pre-line min-h-[60px] text-xl text-black flex-1">
{bodyText}
{noteLine && (
  <>
    {"\n"}
    <span className="text-red-600 font-bold">{noteLine}</span>
  </>
)}
</pre>
      {onBook && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={onBook}>
            Giữ vé
          </Button>
        </div>
      )}
    </div>
  );
};

export default SunPQFlightCard;
