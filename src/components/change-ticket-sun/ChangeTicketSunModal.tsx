import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  Search,
  X,
  Plane,
  CheckCircle2,
  Users,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useChangeTicketSun } from '@/hooks/useChangeTicketSun';
import type { SunPQTrip, SunPQItinerarySegment } from '@/types/sunpq';
import type { SunPQCurrentSegment, SunPQPaxPricing } from '@/types/changeTicketSun';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trip: SunPQTrip | null;
}

// ---------- helpers ----------

const fmtMoney = (v: number | undefined | null, currency: string) => {
  if (v === undefined || v === null) return '-';
  return `${new Intl.NumberFormat('en-US').format(v)} ${currency}`;
};

/** "2026-12-19T00:15:00" hoặc "2026-12-19 00:15:00" -> { date: "2026-12-19", time: "00:15" } — giữ nguyên giờ địa phương từ chuỗi API */
const parseApiDateTime = (s?: string): { date: string; time: string } => {
  if (!s) return { date: '', time: '' };
  const [d, t] = s.split(/T|\s+/);
  const date = d || '';
  const time = t ? t.slice(0, 5) : '';
  return { date, time };
};

const flightNoOf = (seg: { carrier?: string; flight_number?: number | string }) => {
  const fn = seg.flight_number != null ? String(seg.flight_number) : '';
  if (!fn) return '';
  return seg.carrier && !fn.startsWith(seg.carrier) ? `${seg.carrier}${fn}` : fn;
};

const paxTypeLabel = (t?: string) => {
  switch ((t || '').toUpperCase()) {
    case 'ADULT':
      return 'Người lớn';
    case 'CHILD':
      return 'Trẻ em';
    case 'INFANT':
      return 'Em bé';
    default:
      return t || '-';
  }
};

// ---------- segment row ----------

interface SegRowProps {
  selected: boolean;
  onSelect?: () => void;
  readOnly?: boolean;
  highlight?: boolean;
  flightNo: string;
  from: string;
  to: string;
  date: string;
  arrDate?: string;
  time: string;
  arrTime: string;
  bookingClass?: string;
  status?: string;
}

const SegmentRow: React.FC<SegRowProps> = ({
  selected,
  onSelect,
  readOnly,
  highlight,
  flightNo,
  from,
  to,
  date,
  arrDate,
  time,
  arrTime,
  bookingClass,
  status,
}) => (
  <div
    className={[
      'border rounded-lg p-3 transition-colors',
      selected
        ? 'border-orange-400 bg-orange-50'
        : highlight
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-gray-200 bg-white',
    ].join(' ')}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Plane className="h-4 w-4 text-orange-500" />
          <span>{flightNo || 'Chuyến bay'}</span>
          {bookingClass && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-700">
              Hạng {bookingClass}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-700">
          <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
            <MapPin className="h-3 w-3 text-orange-500" />
            {from} <span className="text-gray-400">→</span> {to}
          </span>
          {date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              {date}
              {arrDate && arrDate !== date ? ` → ${arrDate}` : ''}
            </span>
          )}
          {time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              {time}
              {arrTime ? ` - ${arrTime}` : ''}
            </span>
          )}
        </div>
        {status && (
          <div className="mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
              {status}
            </span>
          </div>
        )}
      </div>
      {!readOnly && onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className={[
            'shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors',
            selected
              ? 'border-orange-400 bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          ].join(' ')}
        >
          {selected ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Bỏ chọn
            </>
          ) : (
            'Chọn'
          )}
        </button>
      )}
    </div>
  </div>
);

// ---------- main modal ----------

export const ChangeTicketSunModal: React.FC<Props> = ({ isOpen, onClose, trip }) => {
  const {
    stage,
    pnr,
    setPnr,
    checkedPnr,
    checkData,
    oldSegment,
    newSegment,
    selectOld,
    selectNew,
    result,
    checking,
    changing,
    canConfirm,
    runCheck,
    runChange,
    reset,
    markClosed,
    markOpen,
  } = useChangeTicketSun();

  useEffect(() => {
    if (isOpen) {
      markOpen();
    } else {
      markClosed();
      reset();
    }
  }, [isOpen, reset, markClosed, markOpen]);

  // Hành trình mới: các object gốc từ list_itinerary của thẻ kết quả SUN đã nhấn
  const newLegs = useMemo(
    () =>
      [
        { label: 'Chiều đi', segs: trip?.chiều_đi?.list_itinerary ?? [] },
        { label: 'Chiều về', segs: trip?.chiều_về?.list_itinerary ?? [] },
      ].filter((g) => g.segs.length > 0),
    [trip]
  );

  // Hành trình hiện tại từ checkpnr
  const oldLegs = useMemo(
    () =>
      [
        { label: 'Chiều đi', segs: checkData?.chieudi ?? [] },
        { label: 'Chiều về', segs: checkData?.chieuve ?? [] },
      ].filter((g) => g.segs.length > 0),
    [checkData]
  );

  // Chỉ có đúng 1 chặng -> chọn sẵn
  useEffect(() => {
    if (stage === 'segments' && checkData) {
      const all = [...(checkData.chieudi ?? []), ...(checkData.chieuve ?? [])];
      if (all.length === 1 && !oldSegment) selectOld(all[0]);
    }
  }, [stage, checkData, oldSegment, selectOld]);

  useEffect(() => {
    const all = newLegs.flatMap((g) => g.segs);
    if (all.length === 1 && !newSegment) selectNew(all[0]);
  }, [newLegs, newSegment, selectNew]);

  // Giá hiển thị sau khi đổi thành công — bấm vào từng khoản để sửa
  const [editingField, setEditingField] = useState<'giagoc' | 'thuephi' | 'phidoi' | null>(null);
  const [giaGoc, setGiaGoc] = useState(0);
  const [thuePhi, setThuePhi] = useState(0);
  const [phiDoi, setPhiDoi] = useState(0);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    if (!result?.data) return;
    setGiaGoc(Number(result.data.chenhlech_giagoc) || 0);
    setThuePhi(Number(result.data.chenhlech_thuephi) || 0);
    setPhiDoi(Number(result.data.phi_doi_ve) || 0);
  }, [result]);

  const total = useMemo(() => giaGoc + thuePhi + phiDoi, [giaGoc, thuePhi, phiDoi]);

  const startEdit = (field: 'giagoc' | 'thuephi' | 'phidoi') => {
    setEditingField(field);
    setTempValue(String(field === 'giagoc' ? giaGoc : field === 'thuephi' ? thuePhi : phiDoi));
  };

  const saveEdit = () => {
    const parsed = Number(tempValue);
    if (!isNaN(parsed) && editingField) {
      const min =
        editingField === 'giagoc'
          ? Number(result?.data?.chenhlech_giagoc) || 0
          : editingField === 'thuephi'
            ? Number(result?.data?.chenhlech_thuephi) || 0
            : Number(result?.data?.phi_doi_ve) || 0;
      if (parsed < min) {
        toast.error(`Giá trị mới không được nhỏ hơn ${min.toLocaleString()}`);
        return;
      }
      if (editingField === 'giagoc') setGiaGoc(parsed);
      else if (editingField === 'thuephi') setThuePhi(parsed);
      else if (editingField === 'phidoi') setPhiDoi(parsed);
    }
    setEditingField(null);
  };

  const renderEditableValue = (field: 'giagoc' | 'thuephi' | 'phidoi', value: number) => {
    if (editingField === field) {
      return (
        <div className="flex items-center justify-end gap-1">
          <Input
            type="number"
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') setEditingField(null);
            }}
            className="h-7 w-28 text-right text-sm"
          />
          <Button size="sm" className="h-7 px-2" onClick={saveEdit}>
            OK
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => setEditingField(null)}
          >
            Cancel
          </Button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => startEdit(field)}
        className="font-medium hover:underline"
      >
        {fmtMoney(value, currency)}
      </button>
    );
  };

  const segLabel = (s: {
    departure?: string;
    arrival?: string;
    flight_date?: string;
    flight_number?: number | string;
    carrier?: string;
  }) => {
    const fn = flightNoOf(s);
    return `${s.departure ?? ''}→${s.arrival ?? ''}${fn ? ` ${fn}` : ''}${
      s.flight_date ? ` ${s.flight_date}` : ''
    }`;
  };

  const currency = result?.data?.currency || checkData?.currency || 'KRW';

  const renderOldSeg = (seg: SunPQCurrentSegment, key: React.Key) => {
    const dep = parseApiDateTime(seg.departure_info?.datetime);
    const arr = parseApiDateTime(seg.arrival_info?.datetime);
    return (
      <SegmentRow
        key={key}
        selected={oldSegment === seg}
        onSelect={() => selectOld(seg)}
        flightNo={flightNoOf(seg)}
        from={seg.departure || ''}
        to={seg.arrival || ''}
        date={dep.date || seg.flight_date || ''}
        arrDate={arr.date}
        time={dep.time}
        arrTime={arr.time}
        bookingClass={seg.booking_class}
        status={seg.flight_status}
      />
    );
  };

  const renderNewSeg = (seg: SunPQItinerarySegment, key: React.Key, readOnly = false) => (
    <SegmentRow
      key={key}
      selected={newSegment === seg}
      onSelect={readOnly ? undefined : () => selectNew(seg)}
      readOnly={readOnly}
      flightNo={flightNoOf(seg)}
      from={seg.departure}
      to={seg.arrival}
      date={seg.flight_date}
      time=""
      arrTime=""
      bookingClass={seg.booking_class}
      status={seg.flight_status}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-[760px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Đổi vé SunPQ</h2>
            <p className="text-xs text-gray-500">Đổi 1 chặng cũ sang 1 chặng mới theo PNR</p>
          </div>
        </div>

        {/* Hành trình mới của thẻ đã nhấn — hiển thị ngay khi chưa kiểm tra PNR */}
        {stage === 'input' && newLegs.length > 0 && (
          <div className="py-3 space-y-2 border-b">
            <div className="text-sm font-semibold text-gray-700">
              Hành trình mới (từ kết quả tìm kiếm)
            </div>
            {newLegs.map((g) => (
              <div key={g.label} className="space-y-1.5">
                <div className="text-xs font-medium text-gray-500 uppercase">{g.label}</div>
                {g.segs.map((seg, i) => renderNewSeg(seg, `new-${g.label}-${i}`, true))}
              </div>
            ))}
          </div>
        )}

        {stage === 'input' && (
          <div className="space-y-3 py-3">
            <label className="block text-sm font-medium text-gray-700">Mã đặt chỗ (PNR)</label>
            <Input
              autoFocus
              value={pnr}
              onChange={(e) => setPnr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runCheck();
              }}
              placeholder="VD: 5NPMAY"
              maxLength={6}
              className="uppercase tracking-wider font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose} disabled={checking}>
                <X className="h-4 w-4 mr-1" />
                Hủy
              </Button>
              <Button onClick={runCheck} disabled={checking || !pnr.trim()}>
                <Search className="h-4 w-4 mr-1" />
                {checking ? 'Đang kiểm tra...' : 'Kiểm tra vé'}
              </Button>
            </div>
            {checking && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
          </div>
        )}

        {stage === 'segments' && checkData && (
          <div className="space-y-3 py-3">
            {/* Tóm tắt PNR */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  PNR:{' '}
                  <span className="font-mono font-semibold text-gray-900">
                    {checkData.pnr || checkedPnr}
                  </span>
                </span>
                {checkData.status && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold">
                    {checkData.status}
                  </span>
                )}
              </div>
              {Array.isArray(checkData.passengers) && checkData.passengers.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Users className="h-3.5 w-3.5 mt-0.5" />
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {checkData.passengers.map((p, i) => (
                      <span key={i} className="font-mono">
                        {(p.full_name || `${p.last_name ?? ''} ${p.first_name ?? ''}`.trim() || `HK ${i + 1}`).toUpperCase()}
                        {p.type ? ` (${paxTypeLabel(p.type)})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hành trình hiện tại — chọn 1 chặng cần thay */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-700">
                Hành trình hiện tại — chọn chặng cần thay
              </div>
              {oldLegs.map((g) => (
                <div key={g.label} className="space-y-1.5">
                  <div className="text-xs font-medium text-gray-500 uppercase">{g.label}</div>
                  {g.segs.map((seg, i) => renderOldSeg(seg, `old-${g.label}-${i}`))}
                </div>
              ))}
            </div>

            {/* Hành trình mới của thẻ đã nhấn — chọn chặng thay thế */}
            {newLegs.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">
                  Hành trình mới (từ kết quả tìm kiếm)
                </div>
                {newLegs.map((g) => (
                  <div key={g.label} className="space-y-1.5">
                    <div className="text-xs font-medium text-gray-500 uppercase">{g.label}</div>
                    {g.segs.map((seg, i) => renderNewSeg(seg, `new-${g.label}-${i}`))}
                  </div>
                ))}
              </div>
            )}

            {/* Tóm tắt lựa chọn */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800 flex items-center gap-2 flex-wrap">
              {oldSegment && newSegment ? (
                <>
                  <span>Thay chặng</span>
                  <span className="font-semibold">{segLabel(oldSegment)}</span>
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold">{segLabel(newSegment)}</span>
                </>
              ) : (
                <span className="text-gray-600">
                  Chọn 1 chặng cũ và 1 chặng mới để đổi vé
                </span>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={onClose} disabled={changing}>
                Đóng
              </Button>
              <Button
                onClick={runChange}
                disabled={!canConfirm}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {changing ? 'Đang đổi vé…' : 'Xác nhận đổi vé'}
              </Button>
            </div>
          </div>
        )}

        {stage === 'result' && result?.data && (
          <div className="space-y-3 py-3">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Đổi vé SunPQ thành công — PNR{' '}
                <strong>{result.data.pnr_number || checkedPnr}</strong>
              </span>
            </div>

            {/* Tổng phí — bấm vào từng giá trị để sửa */}
            <div className="rounded-lg border border-gray-200 p-3 space-y-1.5 text-sm">
              <div className="text-[10px] text-gray-400">Bấm vào từng khoản để sửa lại</div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Chênh lệch giá vé</span>
                {renderEditableValue('giagoc', giaGoc)}
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Chênh lệch thuế/phí</span>
                {renderEditableValue('thuephi', thuePhi)}
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-600">Phí đổi vé</span>
                {renderEditableValue('phidoi', phiDoi)}
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="font-semibold text-gray-900">Tổng tiền thay đổi</span>
                <span className="font-bold text-orange-600 text-base">
                  {fmtMoney(total, currency)}
                </span>
              </div>
            </div>

            {/* Chi tiết theo loại khách */}
            {Array.isArray(result.data.pax_pricing) && result.data.pax_pricing.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                  Chi tiết theo hành khách
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="px-3 py-1.5">Loại khách</th>
                        <th className="px-2 py-1.5 text-right">SL</th>
                        <th className="px-2 py-1.5 text-right">Giá gốc cũ</th>
                        <th className="px-2 py-1.5 text-right">Giá gốc mới</th>
                        <th className="px-2 py-1.5 text-right">CL giá vé</th>
                        <th className="px-2 py-1.5 text-right">CL thuế/phí</th>
                        <th className="px-2 py-1.5 text-right">Phí đổi</th>
                        <th className="px-3 py-1.5 text-right">Tổng/khách</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.pax_pricing.map((p: SunPQPaxPricing, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1.5 font-medium">{paxTypeLabel(p.type)}</td>
                          <td className="px-2 py-1.5 text-right">{p.quantity ?? '-'}</td>
                          <td className="px-2 py-1.5 text-right">
                            {fmtMoney(p.old_base_fare, p.currency || currency)}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {fmtMoney(p.new_base_fare, p.currency || currency)}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {fmtMoney(p.chenhlech_giagoc, p.currency || currency)}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {fmtMoney(p.chenhlech_thuephi, p.currency || currency)}
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            {fmtMoney(p.phi_doi_ve, p.currency || currency)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">
                            {fmtMoney(p.tong_moi_khach, p.currency || currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hành trình sau đổi — toàn bộ list_itinerary từ response */}
            {Array.isArray(result.data.list_itinerary) &&
              result.data.list_itinerary.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-gray-700">Hành trình sau đổi</div>
                  {result.data.list_itinerary.map((seg, i) => {
                    const isNew =
                      newSegment &&
                      seg.departure === newSegment.departure &&
                      seg.arrival === newSegment.arrival &&
                      seg.flight_date === newSegment.flight_date &&
                      String(seg.flight_number) === String(newSegment.flight_number);
                    return (
                      <div key={i} className="relative">
                        {renderNewSeg(seg, `after-${i}`, true)}
                        {isNew && (
                          <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                            Chặng vừa đổi
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            {result.trace_id && (
              <div className="text-[10px] text-gray-400 font-mono">trace_id: {result.trace_id}</div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button onClick={onClose}>Đóng</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangeTicketSunModal;
