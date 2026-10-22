import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { checkSunPQPnr, changeSunPQPnr } from '@/services/sunpqService';
import type {
  SunPQCheckPnrData,
  SunPQChangeResponse,
  SunPQCurrentSegment,
} from '@/types/changeTicketSun';
import type { SunPQItinerarySegment, SunPQTrip } from '@/types/sunpq';
import { buildSunChangePayload, pairSunChangeSegments, toggleSunSegment } from '@/lib/sunpqChangeSelection';

type Stage = 'input' | 'segments' | 'result';

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export function useChangeTicketSun(trip: SunPQTrip | null) {
  const [stage, setStage] = useState<Stage>('input');
  const [pnr, setPnrState] = useState('');
  const [checkedPnr, setCheckedPnr] = useState('');
  const [checkData, setCheckData] = useState<SunPQCheckPnrData | null>(null);
  const [oldSelected, setOldSegments] = useState<SunPQCurrentSegment[]>([]);
  const [newSelected, setNewSegments] = useState<SunPQItinerarySegment[]>([]);
  const { oldSegments, newSegments, matched } = useMemo(() => pairSunChangeSegments(
    oldSelected, newSelected,
    [checkData?.chieudi ?? [], checkData?.chieuve ?? []],
    [trip?.chiều_đi?.list_itinerary ?? [], trip?.chiều_về?.list_itinerary ?? []],
  ), [oldSelected, newSelected, checkData, trip]);
  const [result, setResult] = useState<SunPQChangeResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);
  const requestSeq = useRef(0);
  const alive = useRef(true);
  const changeInFlight = useRef(false);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setStage('input');
    setPnrState('');
    setCheckedPnr('');
    setCheckData(null);
    setOldSegments([]);
    setNewSegments([]);
    setResult(null);
    setChecking(false);
    setChanging(false);
    setChanged(false);
  }, []);

  /** Sửa PNR sau khi kiểm tra -> hủy hiệu lực dữ liệu kiểm tra, lựa chọn và kết quả cũ */
  const setPnr = useCallback(
    (value: string) => {
      if (changeInFlight.current) return;
      const next = value.toUpperCase().slice(0, 6);
      setPnrState(next);
      if (next !== checkedPnr) {
        requestSeq.current += 1; // bỏ qua response checkpnr đang chạy
        setCheckData(null);
        setOldSegments([]);
        setResult(null);
        setChanged(false);
        setChecking(false);
        if (stage !== 'input') setStage('input');
      }
    },
    [checkedPnr, stage]
  );

  const runCheck = useCallback(async () => {
    if (changeInFlight.current) return;
    const code = pnr.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập PNR');
      return;
    }
    const seq = ++requestSeq.current;
    setChecking(true);
    try {
      const res = await checkSunPQPnr(code);
      if (seq !== requestSeq.current || !alive.current) return; // PNR đã đổi / modal đã đóng
      const data = res?.data as SunPQCheckPnrData | undefined;
      const segs = [...(data?.chieudi ?? []), ...(data?.chieuve ?? [])];
      if (!res?.success || !data || segs.length === 0) {
        toast.error(
          res?.message || res?.detail || res?.error || 'Không tìm thấy chặng bay cho PNR này'
        );
        return;
      }
      setCheckedPnr(code);
      setCheckData(data);
      setOldSegments([]);
      setResult(null);
      setChanged(false);
      setStage('segments');
    } catch (e) {
      if (seq !== requestSeq.current || !alive.current) return;
      toast.error(errMsg(e, 'Lỗi kiểm tra vé SunPQ'));
    } finally {
      if (seq === requestSeq.current && alive.current) setChecking(false);
    }
  }, [pnr]);

  const selectOld = useCallback((seg: SunPQCurrentSegment) => {
    if (changeInFlight.current || checking || changed) return;
    setOldSegments((prev) => toggleSunSegment(prev, seg));
  }, [checking, changed]);

  const selectNew = useCallback((seg: SunPQItinerarySegment) => {
    if (changeInFlight.current || checking || changed) return;
    setNewSegments((prev) => toggleSunSegment(prev, seg));
  }, [checking, changed]);

  const canConfirm =
    Boolean(checkedPnr && checkData && matched) &&
    !checking &&
    !changing &&
    !changed;

  const runChange = useCallback(async () => {
    if (!canConfirm || changeInFlight.current) return;
    changeInFlight.current = true;
    const seq = requestSeq.current;
    setChanging(true);
    try {
      const payload = buildSunChangePayload(checkedPnr, oldSegments, newSegments);
      const res = await changeSunPQPnr(payload.pnr, payload.old_itinerary, payload.new_itinerary);
      if (!alive.current || seq !== requestSeq.current) return;
      if (!res?.success) {
        toast.error(res?.message || res?.detail || res?.error || 'Đổi vé SunPQ không thành công');
        return;
      }
      setResult(res);
      setChanged(true);
      setStage('result');
      toast.success('Đổi vé SunPQ thành công');
    } catch (e) {
      if (!alive.current || seq !== requestSeq.current) return;
      // Mất kết nối/timeout: không tự gửi lại, yêu cầu kiểm tra lại PNR
      toast.error(
        'Chưa xác định được kết quả đổi vé. Vui lòng kiểm tra lại PNR trước khi thực hiện tiếp.'
      );
      setChanging(false);
      requestSeq.current += 1;
      setCheckData(null);
      setOldSegments([]);
      setCheckedPnr('');
      setStage('input');
    } finally {
      changeInFlight.current = false;
      if (alive.current && seq === requestSeq.current) setChanging(false);
    }
  }, [canConfirm, checkedPnr, oldSegments, newSegments]);

  const markClosed = useCallback(() => {
    alive.current = false;
  }, []);

  const markOpen = useCallback(() => {
    alive.current = true;
  }, []);

  return {
    stage,
    pnr,
    setPnr,
    checkedPnr,
    checkData,
    oldSegments,
    newSegments,
    pairingMatched: matched,
    selectOld,
    selectNew,
    result,
    checking,
    changing,
    changed,
    canConfirm,
    runCheck,
    runChange,
    reset,
    markClosed,
    markOpen,
  };
}
