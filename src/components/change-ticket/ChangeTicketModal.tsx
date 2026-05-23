import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  RefreshCw,
  Search,
  X,
  Copy,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Users,
} from 'lucide-react';
import { useChangeTicket } from '@/hooks/useChangeTicket';
import { SegmentList } from './SegmentList';
import { PriceSummary } from './PriceSummary';
import { formatDateToApi, formatTimeToApi } from './utils';
import type { FlightContext } from '@/types/changeTicket';

interface VNALeg {
  nơi_đi?: string;
  nơi_đến?: string;
  ngày_cất_cánh?: string;
  giờ_cất_cánh?: string;
  giờ_hạ_cánh?: string;
}

interface FlightLike {
  chiều_đi?: VNALeg;
  chiều_về?: VNALeg;
  [k: string]: unknown;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  flight: FlightLike | null;
}

function buildContext(flight: FlightLike | null): FlightContext | null {
  if (!flight) return null;
  const out = flight.chiều_đi;
  const back = flight.chiều_về;
  if (!out?.nơi_đi || !out?.nơi_đến || !out?.ngày_cất_cánh || !out?.giờ_cất_cánh|| !out?.giờ_hạ_cánh) {
    return null;
  }
  return {
    dep: out.nơi_đi,
    arr: out.nơi_đến,
    depdate: formatDateToApi(out.ngày_cất_cánh),
    deptime: formatTimeToApi(out.giờ_cất_cánh),
    deptimedone: formatTimeToApi(out.giờ_hạ_cánh),
    arrdate: back?.ngày_cất_cánh ? formatDateToApi(back.ngày_cất_cánh) : undefined,
    arrtime: back?.giờ_cất_cánh ? formatTimeToApi(back.giờ_cất_cánh) : undefined,
    arrtimedone: back?.giờ_hạ_cánh ? formatTimeToApi(back.giờ_hạ_cánh) : undefined,
    isRoundTrip: Boolean(back?.ngày_cất_cánh && back?.giờ_cất_cánh),
  };
}

export const ChangeTicketModal: React.FC<Props> = ({ isOpen, onClose, flight }) => {
  const {
    stage,
    pnr,
    setPnr,
    preData,
    segDelete,
    toggleSegment,
    result,
    loading,
    runPreCheck,
    runChange,
    reset,
  } = useChangeTicket();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const ctx = useMemo(() => buildContext(flight), [flight]);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setConfirmOpen(false);
    }
  }, [isOpen, reset]);

  const handleClose = () => onClose();

  const copyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      toast.success('Đã copy command');
    } catch {
      toast.error('Không thể copy');
    }
  };

  const captureToClipboard = async () => {
    if (!captureRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Không thể tạo ảnh');
          return;
        }
        try {
          // @ts-ignore
          await navigator.clipboard.write([
            // @ts-ignore
            new ClipboardItem({ 'image/png': blob }),
          ]);
          toast.success('Đã copy ảnh vào clipboard');
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `doi-ve-${pnr || 'vna'}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Đã tải ảnh xuống');
        }
      }, 'image/png');
    } catch {
      toast.error('Lỗi chụp ảnh');
    }
  };

  const onConfirmChange = async () => {
    if (!ctx) {
      toast.error('Thiếu thông tin hành trình');
      return;
    }
    setConfirmOpen(false);
    await runChange(ctx);
  };

  const onPriceCheck = () => {
    if (!ctx) {
      toast.error('Thiếu thông tin hành trình');
      return;
    }
    if (ctx.isRoundTrip && segDelete.length < 2) {
      toast.error('Vé khứ hồi cần xoá tối thiểu 2 segment');
      return;
    }
    if (segDelete.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 segment để xoá');
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="w-[95vw] max-w-[760px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Đổi vé Vietnam Airlines
            </h2>
            <p className="text-xs text-gray-500">
              Quản lý đổi hành trình theo PNR
            </p>
          </div>
        </div>

        {/* STAGE: input */}
        {stage === 'input' && (
          <div className="space-y-3 py-3">
            <label className="block text-sm font-medium text-gray-700">
              Mã đặt chỗ (PNR)
            </label>
            <Input
              autoFocus
              value={pnr}
              onChange={(e) =>
                setPnr(e.target.value.toUpperCase().slice(0, 6))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') runPreCheck();
              }}
              placeholder="VD: E4BSEW"
              maxLength={6}
              className="uppercase tracking-wider font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                <X className="h-4 w-4 mr-1" /> Hủy
              </Button>
              <Button onClick={runPreCheck} disabled={loading || !pnr.trim()}>
                <Search className="h-4 w-4 mr-1" />
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra vé'}
              </Button>
            </div>
            {loading && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
          </div>
        )}

        {/* STAGE: segments */}
        {stage === 'segments' && preData && (
          <div className="space-y-3 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                PNR:{' '}
                <span className="font-mono font-semibold text-gray-900">
                  {pnr}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({preData.seg.length} segment)
                </span>
              </div>
              <span
                className={[
                  'text-xs px-2 py-1 rounded',
                  ctx?.isRoundTrip
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700',
                ].join(' ')}
              >
                {ctx?.isRoundTrip ? 'Khứ hồi' : 'Một chiều'}
              </span>
            </div>

            <SegmentList
              segments={preData.seg}
              selected={segDelete}
              onToggle={toggleSegment}
            />

            {ctx?.isRoundTrip && segDelete.length > 0 && segDelete.length < 2 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                <AlertTriangle className="h-4 w-4" />
                Vé khứ hồi cần xoá tối thiểu 2 segment
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Đóng
              </Button>
              <Button onClick={onPriceCheck} disabled={loading || segDelete.length === 0}>
                <RefreshCw className="h-4 w-4 mr-1" />
                {loading ? 'Đang xử lý...' : 'Check giá đổi'}
              </Button>
            </div>
          </div>
        )}

        {/* STAGE: result */}
        {stage === 'result' && result && (
          <div className="space-y-3 py-3 relative">
            <button
              type="button"
              onClick={captureToClipboard}
              title="Chụp ảnh kết quả"
              className="absolute -top-1 right-0 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 shadow-sm text-xs"
            >
              <Camera className="h-3.5 w-3.5" />
              Chụp ảnh
            </button>

            <div ref={captureRef} className="space-y-3 bg-white p-1">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {result.status === 'success' ? (
                  <>
                    PNR <strong>{pnr}</strong> với hành trình mới.
                  </>
                ) : (
                  result.message || 'Kết quả đổi vé'
                )}
              </div>

              {Array.isArray(result.namelist) && result.namelist.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                    <Users className="h-3.5 w-3.5" />
                    Danh sách hành khách ({result.namelist.length})
                  </div>
                  <ul className="space-y-1">
                    {result.namelist.map((name, idx) => (
                      <li
                        key={idx}
                        className="text-sm font-mono text-gray-800 bg-white rounded px-2 py-1 border border-gray-100"
                      >
                        <strong>
                          {typeof name === 'string' ? name.trim() : String(name)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(result.seg_new) && result.seg_new.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Hành trình mới
                  </div>
                  <SegmentList
                    segments={result.seg_new}
                    selected={[]}
                    onToggle={() => {}}
                    readOnly
                    highlightHolding
                  />
                </div>
              )}

              {result.new_price && <PriceSummary price={result.new_price} />}
            </div>

            {result.search_command && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                  <ChevronDown className="h-3 w-3" /> Debug command
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 rounded border bg-gray-50 p-2 flex items-start gap-2">
                    <pre className="flex-1 text-[11px] text-gray-700 whitespace-pre-wrap break-all">
                      {result.search_command}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyCommand(result.search_command!)}
                      className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}

        {/* Confirm dialog */}
        {confirmOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-5 w-[90vw] max-w-sm">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-semibold">Check giá đổi vé</h3>
              </div>
              <p className="text-sm text-gray-600">
                Thay {segDelete.length} hành trình cũ sang hành trình mới và check giá đổi?
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={onConfirmChange} disabled={loading}>
                  {loading ? 'Đang đổi...' : 'Xác nhận'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
