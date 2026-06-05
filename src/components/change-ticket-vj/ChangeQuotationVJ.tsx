import React, { useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { VJQuotation } from '@/types/changeTicketVJ';

/** 759060.93 -> "759.061 w" */
function formatVnd(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '-';
  const rounded = Math.round(n);
  return `${new Intl.NumberFormat('de-DE').format(rounded)} w`;
}

export const ChangeQuotationVJ: React.FC<{ quotation?: VJQuotation }> = ({
  quotation,
}) => {
  const [open, setOpen] = useState(true);
  if (!quotation) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-amber-50 p-3 shadow-sm">
        <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-semibold text-gray-700">
          <span className="inline-flex items-center gap-2">
            <Wallet className="h-4 w-4 text-red-500" />
            Chi phí đổi vé
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="rounded-lg bg-white/80 p-2">
              <div className="text-xs text-gray-500 mb-1">Tổng tiền đổi vé</div>
              <div className="font-bold text-red-700">
                {formatVnd(quotation.total_price_change)}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-100 p-2">
              <div className="text-xs text-emerald-700 mb-1">Credit còn lại</div>
              <div className="font-bold text-emerald-800">
                {formatVnd(quotation.reservationCredits)}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
