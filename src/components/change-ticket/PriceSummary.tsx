import React from 'react';
import type { ChangePrice } from '@/types/changeTicket';
import { formatCurrencyKRW } from './utils';

export const PriceSummary: React.FC<{ price?: ChangePrice }> = ({ price }) => {
  if (!price) return null;
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-4 shadow-sm">
      <div className="text-sm font-semibold text-gray-700 mb-2">Tổng chi phí đổi vé</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-white/70 p-2">
          <div className="text-xs text-gray-500">Phí phạt</div>
          <div className="font-semibold text-gray-800">{formatCurrencyKRW(price.penalty_total)}</div>
        </div>
        <div className="rounded-lg bg-white/70 p-2">
          <div className="text-xs text-gray-500">Phí chênh lệch</div>
          <div className="font-semibold text-gray-800">{formatCurrencyKRW(price.GRD_TOTAL)}</div>
        </div>
        <div className="rounded-lg bg-emerald-100 p-2">
          <div className="text-xs text-emerald-700">Tổng phí đổi</div>
          <div className="font-bold text-emerald-800">{formatCurrencyKRW(price.total_new)}</div>
        </div>
      </div>
    </div>
  );
};
