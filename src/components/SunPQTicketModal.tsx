import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X, Plane } from 'lucide-react';
import { checkSunPQPnr } from '@/services/sunpqService';
import { toPng } from 'html-to-image';
import sunpqLogo from '@/assets/sunpq-logo.png.asset.json';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPNR?: string;
}

const AIRPORT_NAMES: Record<string, string> = {
  ICN: 'Seoul',
  GMP: 'Seoul',
  PUS: 'Busan',
  HAN: 'Hà Nội',
  SGN: 'TP HCM',
  PQC: 'Phú Quốc',
  DAD: 'Đà Nẵng',
  CXR: 'Nha Trang',
  HPH: 'Hải Phòng',
  VCA: 'Cần Thơ',
  VII: 'Vinh',
  HUI: 'Huế',
};

const PAX_TYPE_MAP: Record<string, string> = {
  ADULT: 'Người Lớn',
  CHILD: 'Trẻ em',
  INFANT: 'Trẻ sơ sinh',
};

const VI_WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const fmtDate = (d: string) => {
  // d may be 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm:ss'
  const dateOnly = d.split(' ')[0];
  const [y, m, day] = dateOnly.split('-');
  return `${day}/${m}/${y}`;
};
const fmtWeekday = (d: string) => {
  const dateOnly = d.split(' ')[0];
  const dt = new Date(dateOnly + 'T00:00:00');
  return VI_WEEKDAYS[dt.getDay()];
};
const fmtTime = (datetime: string) => {
  const t = datetime.split(' ')[1] || '';
  return t.slice(0, 5);
};
const fmtDuration = (d: string) => {
  if (!d) return '';
  if (d.length === 4) return `${d.slice(0, 2)}h${d.slice(2)}m`;
  return d;
};

interface Segment {
  flight_number: number;
  carrier: string;
  duration: string;
  departure: string;
  arrival: string;
  departure_info: { code: string; datetime: string; terminal?: string };
  arrival_info: { code: string; datetime: string; terminal?: string };
  aircraft_info?: { type?: string };
}

const SegmentCard: React.FC<{ seg: Segment }> = ({ seg }) => {
  const fromName = AIRPORT_NAMES[seg.departure] || seg.departure;
  const toName = AIRPORT_NAMES[seg.arrival] || seg.arrival;
  const depDate = seg.departure_info.datetime;
  const arrDate = seg.arrival_info.datetime;
  return (
    <div className="border border-orange-200 rounded-lg overflow-hidden mb-3 shadow-sm">
      {/* Header */}
      <div className="bg-orange-100 px-3 py-2 flex items-center justify-between text-sm">
        <img src={sunpqLogo.url} alt="SUN PhuQuoc" className="h-7 object-contain" crossOrigin="anonymous" />
        <div className="font-semibold text-gray-800">
          {fromName} → {toName}
        </div>
        <div className="font-medium text-gray-700">{fmtDate(depDate)}</div>
      </div>
      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white text-sm">
        <div>
          <div className="text-gray-700">{fromName} ({seg.departure})</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{fmtTime(depDate)}</div>
          <div className="text-gray-600 text-xs mt-1">{fmtWeekday(depDate)}, {fmtDate(depDate)}</div>
        </div>
        <div>
          <div className="text-gray-700">{toName} ({seg.arrival})</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{fmtTime(arrDate)}</div>
          <div className="text-gray-600 text-xs mt-1">{fmtWeekday(arrDate)}, {fmtDate(arrDate)}</div>
        </div>
        <div className="space-y-1">
          <div><span className="font-semibold">Mã chuyến bay:</span> {seg.carrier}{seg.flight_number}</div>
          <div><span className="font-semibold">Thời gian bay:</span> {fmtDuration(seg.duration)}</div>
          <div><span className="font-semibold">Loại máy bay:</span> {seg.aircraft_info?.type || ''}</div>
        </div>
      </div>
    </div>
  );
};

export const SunPQTicketModal: React.FC<Props> = ({ isOpen, onClose, initialPNR }) => {
  const [pnr, setPnr] = useState(initialPNR || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  const reset = () => {
    setPnr('');
    setData(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const code = pnr.trim().toUpperCase();
    if (!code) {
      setError('Vui lòng nhập PNR');
      return;
    }
    setError(null);
    setIsLoading(true);
    setData(null);
    try {
      const res = await checkSunPQPnr(code);
      if (!res?.success || !res?.data) {
        throw new Error('Không tìm thấy vé');
      }
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || 'Không tìm thấy vé hoặc hệ thống lỗi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('de-DE').format(Math.round((n || 0) / 100) * 100);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    setCapturing(true);
    try {
      const dataUrl = await toPng(captureRef.current, { backgroundColor: '#ffffff', pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Đã copy ảnh vào clipboard');
    } catch (e: any) {
      toast.error('Không thể copy ảnh: ' + (e?.message || ''));
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-600">Tra vé SunPQ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sunpq-pnr">Mã đặt chỗ (PNR)</Label>
            <Input
              id="sunpq-pnr"
              ref={inputRef}
              value={pnr}
              onChange={(e) => { setPnr(e.target.value.toUpperCase()); if (error) setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
              placeholder="Nhập PNR (VD: DCXMJK)"
              disabled={isLoading}
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-1" />Đang xử lý...</>) : 'Xác nhận'}
            </Button>
            <Button onClick={handleClose} variant="outline" disabled={isLoading}>
              <X className="h-4 w-4" /> Đóng
            </Button>
          </div>

          {data && (
            <div className="pt-3 border-t space-y-3">
              {/* Tổng tiền + hạn TT: riêng, ngoài capture */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-bold">PNR: {data.pnr}</span>
                <span className={`px-2 py-1 rounded font-semibold ${data.paymentstatus ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  Tổng: {formatMoney(Number(data.tongbillgiagoc || 0))} {data.currency}
                </span>
                {data.hanthanhtoan && !data.paymentstatus && (
                  <span className="px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200">Hạn TT: {data.hanthanhtoan}</span>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCapture} disabled={capturing} variant="outline" size="sm" className="gap-1">
                  <Camera className="h-4 w-4" />
                  {capturing ? 'Đang chụp...' : 'Chụp ảnh'}
                </Button>
              </div>

              <div ref={captureRef} className="space-y-3 bg-white p-3 rounded">
                {/* Hành khách - lên trên */}
                {Array.isArray(data.passengers) && data.passengers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Hành khách</h4>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-2 py-1 text-left">#</th>
                            <th className="px-2 py-1 text-left">Loại</th>
                            <th className="px-2 py-1 text-left">Title</th>
                            <th className="px-2 py-1 text-left">Họ</th>
                            <th className="px-2 py-1 text-left">Tên</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.passengers.map((p: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">{i + 1}</td>
                              <td className="px-2 py-1">{PAX_TYPE_MAP[p.type] || p.type}</td>
                              <td className="px-2 py-1">{p.title}</td>
                              <td className="px-2 py-1 font-medium">{p.last_name}</td>
                              <td className="px-2 py-1 font-medium">{p.first_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Hành trình */}
                {Array.isArray(data.chieudi) && data.chieudi.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Chiều đi</h4>
                    {data.chieudi.map((s: Segment, i: number) => <SegmentCard key={`out-${i}`} seg={s} />)}
                  </div>
                )}
                {Array.isArray(data.chieuve) && data.chieuve.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Chiều về</h4>
                    {data.chieuve.map((s: Segment, i: number) => <SegmentCard key={`ret-${i}`} seg={s} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SunPQTicketModal;
