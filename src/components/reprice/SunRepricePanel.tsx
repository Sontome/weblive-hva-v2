import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plane } from 'lucide-react';
import { toast } from 'sonner';
import {
  beginSunReprice,
  repriceSun,
  type SunBeginRepriceResponse,
} from '@/services/sunRepriceService';

type Step = 'check' | 'reprice' | 'result';

interface SunCheckResult {
  pnr: string;
  status: 'success' | 'error';
  data?: SunBeginRepriceResponse;
  error?: string;
}

interface SunRepriceResult {
  pnr: string;
  ok: boolean;
  message: string;
}

const parsePNRInput = (input: string): string[] => {
  const pnrs = input
    .split(/[\s,;]+/)
    .map((p) => p.trim().toUpperCase())
    .filter((p) => p.length === 6);
  return [...new Set(pnrs)];
};

export const SunRepricePanel: React.FC = () => {
  const [pnrInput, setPnrInput] = useState('');
  const [step, setStep] = useState<Step>('check');
  const [isLoading, setIsLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<SunCheckResult[]>([]);
  const [customerTypes, setCustomerTypes] = useState<Record<string, string>>({});
  const [repriceResults, setRepriceResults] = useState<SunRepriceResult[]>([]);

  const handleReset = () => {
    setPnrInput('');
    setStep('check');
    setCheckResults([]);
    setCustomerTypes({});
    setRepriceResults([]);
  };

  const handleCheck = async () => {
    const pnrs = parsePNRInput(pnrInput);
    if (pnrs.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 mã PNR (mỗi PNR gồm 6 ký tự)');
      return;
    }
    setIsLoading(true);
    const results: SunCheckResult[] = [];
    const types: Record<string, string> = {};

    for (const pnr of pnrs) {
      try {
        const data = await beginSunReprice(pnr);
        if (data?.status === 'OK' || (data?.chang?.length ?? 0) > 0) {
          results.push({ pnr, status: 'success', data });
          const dt = (data.doituong || '').toUpperCase();
          types[pnr] = dt === 'VFR' ? 'VFR' : 'ADT';
        } else {
          results.push({
            pnr,
            status: 'error',
            error: (data as any)?.reason || (data as any)?.response || 'Kiểm tra PNR thất bại',
          });
        }
      } catch (e: any) {
        results.push({ pnr, status: 'error', error: e?.message || 'Lỗi kết nối' });
      }
    }

    setCheckResults(results);
    setCustomerTypes(types);
    setIsLoading(false);

    const successCount = results.filter((r) => r.status === 'success').length;
    if (successCount > 0) {
      setStep('reprice');
      toast.success(`Kiểm tra thành công ${successCount}/${pnrs.length} PNR`);
    } else {
      toast.error('Tất cả PNR đều kiểm tra thất bại');
    }
  };

  const handleReprice = async () => {
    const ok = checkResults.filter((r) => r.status === 'success');
    if (ok.length === 0) {
      toast.error('Không có PNR nào để reprice');
      return;
    }
    setIsLoading(true);
    const results: SunRepriceResult[] = [];

    for (const r of ok) {
      try {
        const res = await repriceSun(r.pnr, customerTypes[r.pnr] || 'ADT');
        if ((res?.status || '').toUpperCase() === 'OK') {
          results.push({ pnr: r.pnr, ok: true, message: 'Reprice thành công' });
        } else {
          const detail = [res?.reason, res?.response].filter(Boolean).join('\n');
          results.push({ pnr: r.pnr, ok: false, message: detail || JSON.stringify(res) });
        }
      } catch (e: any) {
        results.push({ pnr: r.pnr, ok: false, message: e?.message || 'Lỗi kết nối' });
      }
    }

    setRepriceResults(results);
    setIsLoading(false);
    setStep('result');

    const successCount = results.filter((r) => r.ok).length;
    if (successCount > 0) toast.success(`Reprice thành công ${successCount}/${ok.length} PNR`);
    else toast.error('Tất cả PNR đều reprice thất bại');
  };

  return (
    <div className="space-y-6 py-2">
      <div>
        <Label htmlFor="sun-pnr-input">Mã PNR (SunPQ)</Label>
        <Input
          id="sun-pnr-input"
          placeholder="Nhập mã PNR (phân tách bằng space, dấu phẩy hoặc dấu chấm phẩy)"
          value={pnrInput}
          onChange={(e) => setPnrInput(e.target.value)}
          className="mt-1"
          disabled={isLoading || step !== 'check'}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Mỗi PNR gồm 6 ký tự. Ví dụ: EKLC7S EKLC7T hoặc EKLC7S,EKLC7T
        </p>
      </div>

      {step === 'check' && (
        <Button onClick={handleCheck} disabled={isLoading || pnrInput.trim().length === 0} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            'Check'
          )}
        </Button>
      )}

      {step === 'reprice' && (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Kết quả kiểm tra:</h3>
            {checkResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">PNR: {result.pnr}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {result.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>

                {result.status === 'success' && result.data ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {(result.data.chang || []).map((seg) => (
                        <div key={seg.sochang} className="flex items-center gap-2 text-xs">
                          <Plane className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {seg.departure}-{seg.arrival}
                          </span>
                          <span>{seg.giocatcanh}</span>
                          <span className="text-muted-foreground">{seg.ngaycatcanh}</span>
                          <span className="text-muted-foreground">{seg.sohieumaybay}</span>
                          {seg.loaive && (
                            <span className="ml-auto px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold">
                              {seg.loaive}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {(result.data.passengers || []).length > 0 && (
                      <div className="space-y-0.5 pt-1 border-t border-green-200">
                        {(result.data.passengers || []).map((p, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span>
                              {i + 1}. {[p.lastName, p.firstName].filter(Boolean).join('/')}
                            </span>
                            <span className="text-muted-foreground">{p.loaikhach}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!!result.data.tongbillgiagoc && (
                      <div className="flex justify-between text-xs font-bold pt-1 border-t border-green-200">
                        <span>Tổng:</span>
                        <span>{Number(result.data.tongbillgiagoc).toLocaleString()} KRW</span>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Đối Tượng</Label>
                      <Select
                        value={customerTypes[result.pnr] || 'ADT'}
                        onValueChange={(value) =>
                          setCustomerTypes((prev) => ({ ...prev, [result.pnr]: value }))
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADT">ADT</SelectItem>
                          <SelectItem value="VFR">VFR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 whitespace-pre-wrap">{result.error}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline" className="flex-1" disabled={isLoading}>
              Nhập lại
            </Button>
            <Button onClick={handleReprice} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận Reprice'
              )}
            </Button>
          </div>
        </>
      )}

      {step === 'result' && (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Kết quả Reprice:</h3>
            {repriceResults.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  r.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">PNR: {r.pnr}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      r.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {r.ok ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
                <pre
                  className={`text-xs whitespace-pre-wrap font-sans ${
                    r.ok ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {r.message}
                </pre>
              </div>
            ))}
          </div>

          <Button onClick={handleReset} className="w-full">
            Reprice PNR khác
          </Button>
        </>
      )}
    </div>
  );
};
