import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/DateInput';
import { Loader2, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';
import { checkSunPQPnr, addSunPQDocument } from '@/services/sunpqService';

type Step = 'input' | 'form' | 'done';

interface DocForm {
  type: string;
  country: string;
  number: string;
  nationality: string;
  date_of_birth: string;
  expiry_date: string;
  first_name: string;
  last_name: string;
  gender: string;
}

interface PaxForm {
  pax_id: number;
  type: string;
  title: string;
  first_name: string;
  last_name: string;
  locked: Record<keyof DocForm, boolean>;
  doc: DocForm;
}

const PAX_TYPE_LABEL: Record<string, string> = {
  ADULT: 'Người Lớn',
  CHILD: 'Trẻ Em',
  INFANT: 'Em Bé',
};

const toISO = (v: string): string => {
  if (!v) return '';
  // already yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = parse(v, 'dd/MM/yyyy', new Date());
  return isValid(d) ? format(d, 'yyyy-MM-dd') : '';
};

const isoToDate = (v: string): Date | undefined => {
  if (!v) return undefined;
  const d = parse(v, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : undefined;
};

const parseFlightDate = (v: string): Date | undefined => {
  if (!v) return undefined;
  for (const f of ['yyyy-MM-dd', 'dd/MM/yyyy', "yyyy-MM-dd'T'HH:mm:ss"]) {
    const d = parse(v.slice(0, f.length), f, new Date());
    if (isValid(d)) return d;
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
};

const defaultGenderFromTitle = (title: string): string => {
  const t = (title || '').toUpperCase();
  return t === 'MISS' || t === 'MRS' ? 'F' : 'M';
};

export const SunUpdatePnrPanel: React.FC = () => {
  const [step, setStep] = useState<Step>('input');
  const [pnr, setPnr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [traceId, setTraceId] = useState('');
  const [passengers, setPassengers] = useState<PaxForm[]>([]);
  const [minExpiry, setMinExpiry] = useState<Date | undefined>(undefined);

  const handleReset = () => {
    setStep('input');
    setPnr('');
    setTraceId('');
    setPassengers([]);
    setMinExpiry(undefined);
  };

  const handleCheck = async () => {
    const code = pnr.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error('Mã PNR phải gồm đúng 6 ký tự');
      return;
    }
    setIsLoading(true);
    try {
      const res: any = await checkSunPQPnr(code);
      if (!res?.success || !res?.data) {
        toast.error(res?.message || 'Không tìm thấy thông tin PNR');
        return;
      }
      const data = res.data;
      setTraceId(res.trace_id || data.trace_id || '');

      const segs = [...(data.chieudi || []), ...(data.chieuve || [])];
      let latest: Date | undefined;
      for (const s of segs) {
        const d = parseFlightDate(s?.flight_date);
        if (d && (!latest || d > latest)) latest = d;
      }
      setMinExpiry(latest);

      const list: PaxForm[] = (data.passengers || []).map((p: any) => {
        const doc = p.document || {};
        const built: DocForm = {
          type: 'P',
          country: doc.country || 'VN',
          number: (doc.number || 'C123456').toUpperCase(),
          nationality: doc.nationality || 'VN',
          date_of_birth: toISO(doc.date_of_birth || ''),
          expiry_date: toISO(doc.expiry_date || ''),
          first_name: doc.first_name || p.first_name || '',
          last_name: doc.last_name || p.last_name || '',
          gender: doc.gender || defaultGenderFromTitle(p.title),
        };
        const locked: Record<keyof DocForm, boolean> = {
          type: true,
          country: !!doc.country,
          number: !!doc.number,
          nationality: !!doc.nationality,
          date_of_birth: !!doc.date_of_birth,
          expiry_date: !!doc.expiry_date,
          first_name: !!(doc.first_name || p.first_name),
          last_name: !!(doc.last_name || p.last_name),
          gender: !!doc.gender,
        };
        return {
          pax_id: p.pax_id,
          type: p.type,
          title: p.title,
          first_name: p.first_name,
          last_name: p.last_name,
          locked,
          doc: built,
        };
      });
      setPassengers(list);
      setStep('form');
      toast.success(`Đã tải thông tin PNR ${code}`);
    } catch (e: any) {
      toast.error(e?.message || 'Kiểm tra PNR thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDoc = (idx: number, key: keyof DocForm, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, doc: { ...p.doc, [key]: value } } : p))
    );
  };

  const handleSubmit = async () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      const missing = (Object.keys(p.doc) as (keyof DocForm)[]).filter((k) => !p.doc[k]);
      if (missing.length > 0) {
        toast.error(
          `Khách ${i + 1} (${p.last_name} ${p.first_name}) còn thiếu thông tin giấy tờ`
        );
        return;
      }
    }
    setIsLoading(true);
    try {
      const res: any = await addSunPQDocument(
        traceId,
        passengers.map((p) => ({
          pax_id: p.pax_id,
          type: p.type,
          document: {
            type: p.doc.type,
            nationality: p.doc.nationality,
            country: p.doc.country,
            number: p.doc.number,
            expiry_date: p.doc.expiry_date,
            gender: p.doc.gender,
            date_of_birth: p.doc.date_of_birth,
            first_name: p.doc.first_name,
            last_name: p.doc.last_name,
          },
        }))
      );
      if (res?.success === true) {
        setStep('done');
      } else {
        toast.error(res?.message || 'Cập nhật thất bại');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const minExpiryLabel = useMemo(
    () => (minExpiry ? format(minExpiry, 'dd/MM/yyyy') : ''),
    [minExpiry]
  );

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <CheckCircle2 className="h-14 w-14 text-green-600" />
        <p className="text-base font-semibold">Cập nhật thông tin hành khách thành công</p>
        <Button onClick={handleReset}>Cập nhật PNR khác</Button>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sun-update-pnr">Mã PNR (SunPQ)</Label>
          <Input
            id="sun-update-pnr"
            value={pnr}
            maxLength={6}
            onChange={(e) => setPnr(e.target.value.toUpperCase())}
            placeholder="VD: ABC123"
            className="uppercase"
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleCheck} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Xác nhận
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {passengers.map((p, idx) => (
        <div key={p.pax_id} className="border rounded-lg bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <User className="h-4 w-4" />
              <span>
                {idx + 1}. {p.title} {p.last_name} {p.first_name}
              </span>
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary whitespace-nowrap">
              {PAX_TYPE_LABEL[p.type] || p.type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Họ</Label>
              <Input
                value={p.doc.last_name}
                disabled={p.locked.last_name || isLoading}
                onChange={(e) => updateDoc(idx, 'last_name', e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tên</Label>
              <Input
                value={p.doc.first_name}
                disabled={p.locked.first_name || isLoading}
                onChange={(e) => updateDoc(idx, 'first_name', e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loại giấy tờ</Label>
              <Input value="P (Hộ chiếu)" disabled />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Số hộ chiếu</Label>
              <Input
                value={p.doc.number}
                disabled={p.locked.number || isLoading}
                className="uppercase"
                onChange={(e) => updateDoc(idx, 'number', e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quốc tịch</Label>
              <Select
                value={p.doc.nationality}
                disabled={p.locked.nationality || isLoading}
                onValueChange={(v) => updateDoc(idx, 'nationality', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quốc tịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VN">Việt Nam (VN)</SelectItem>
                  <SelectItem value="KR">Hàn Quốc (KR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quốc gia cấp</Label>
              <Select
                value={p.doc.country}
                disabled={p.locked.country || isLoading}
                onValueChange={(v) => updateDoc(idx, 'country', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quốc gia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VN">Việt Nam (VN)</SelectItem>
                  <SelectItem value="KR">Hàn Quốc (KR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Giới tính</Label>
              <Select
                value={p.doc.gender}
                disabled={p.locked.gender || isLoading}
                onValueChange={(v) => updateDoc(idx, 'gender', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Nam (M)</SelectItem>
                  <SelectItem value="F">Nữ (F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ngày sinh</Label>
              <DateInput
                value={isoToDate(p.doc.date_of_birth)}
                disabled={p.locked.date_of_birth || isLoading}
                onChange={(d) => updateDoc(idx, 'date_of_birth', d ? format(d, 'yyyy-MM-dd') : '')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Ngày hết hạn hộ chiếu{minExpiryLabel ? ` (từ ${minExpiryLabel})` : ''}
              </Label>
              <DateInput
                value={isoToDate(p.doc.expiry_date)}
                minDate={minExpiry}
                disabled={p.locked.expiry_date || isLoading}
                onChange={(d) => updateDoc(idx, 'expiry_date', d ? format(d, 'yyyy-MM-dd') : '')}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Nhập lại
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Cập nhật thông tin
        </Button>
      </div>
    </div>
  );
};
