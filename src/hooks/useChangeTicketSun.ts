import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { checkSunPQPnr, changeSunPQPnr } from '@/services/sunpqService';
import type {
  SunPQCheckPnrData,
  SunPQChangeResponse,
  SunPQCurrentSegment,
} from '@/types/changeTicketSun';
import type { SunPQItinerarySegment } from '@/types/sunpq';

type Stage = 'input' | 'segments' | 'result';

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

export function useChangeTicketSun() {
  const [stage, setStage] = useState<Stage>('input');
  const [pnr, setPnrState] = useState('');
  const [checkedPnr, setCheckedPnr] = useState('');
  const [checkData, setCheckData] = useState<SunPQCheckPnrData | null>(null);
  const [oldSegment, setOldSegment] = useState<SunPQCurrentSegment | null>(null);
  const [newSegment, setNewSegment] = useState<SunPQItinerarySegment | null>(null);
  const [result, setResult] = useState<SunPQChangeResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);
  const requestSeq = useRef(0);
  const alive = useRef(true);

  const reset = useCallback(() => {
    requestSeq.current += 1;
    setStage('input');
    setPnrState('');
    setCheckedPnr('');
    setCheckData(null);
    setOldSegment(null);
    setNewSegment(null);
    setResult(null);
    setChecking(false);
    setChanging(false);
    setChanged(false);
  }, []);

  /** Sửa PNR sau khi kiểm tra -> hủy hiệu lực dữ liệu kiểm tra, lựa chọn và kết quả cũ */
  const setPnr = useCallback(
    (value: string) => {
      const next = value.toUpperCase().slice(0, 6);
      setPnrState(next);
      if (next !== checkedPnr) {
        requestSeq.current += 1; // bỏ qua response checkpnr đang chạy
        setCheckData(null);
        setOldSegment(null);
        setResult(null);
        setChanged(false);
        setChecking(false);
        if (stage !== 'input') setStage('input');
      }
    },
    [checkedPnr, stage]
  );

  const runCheck = useCallback(async () => {
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
      setOldSegment(null);
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
    setOldSegment((prev) => (prev === seg ? null : seg));
  }, []);

  const selectNew = useCallback((seg: SunPQItinerarySegment) => {
    setNewSegment((prev) => (prev === seg ? null : seg));
  }, []);

  const canConfirm =
    Boolean(checkedPnr && checkData && oldSegment && newSegment) &&
    !checking &&
    !changing &&
    !changed;

  const runChange = useCallback(async () => {
    if (!canConfirm || !oldSegment || !newSegment) return;
    setChanging(true);
    try {
      const res = await changeSunPQPnr(checkedPnr, [oldSegment], [newSegment]);
      if (!alive.current) return;
      if (!res?.success) {
        toast.error(res?.message || res?.detail || res?.error || 'Đổi vé SunPQ không thành công');
        return;
      }
      setResult(res);
      setChanged(true);
      setStage('result');
      toast.success('Đổi vé SunPQ thành công');
    } catch (e) {
      if (!alive.current) return;
      // Mất kết nối/timeout: không tự gửi lại, yêu cầu kiểm tra lại PNR
      toast.error(
        'Chưa xác định được kết quả đổi vé. Vui lòng kiểm tra lại PNR trước khi thực hiện tiếp.'
      );
      requestSeq.current += 1;
      setCheckData(null);
      setOldSegment(null);
      setCheckedPnr('');
      setStage('input');
    } finally {
      if (alive.current) setChanging(false);
    }
  }, [canConfirm, checkedPnr, oldSegment, newSegment]);

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
    oldSegment,
    newSegment,
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
