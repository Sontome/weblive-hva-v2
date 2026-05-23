import React, { useEffect, useState } from 'react';
import type { ChangePrice } from '@/types/changeTicket';
import { formatCurrencyKRW } from './utils';
import { Input } from '@/components/ui/input';

export const PriceSummary: React.FC<{
  price?: ChangePrice;
}> = ({ price }) => {

  const [editableTotal, setEditableTotal] =
    useState<number>(0);

  useEffect(() => {

    if (price?.total_new != null) {
      setEditableTotal(price.total_new);
    }

  }, [price]);

  if (!price) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50 p-4 shadow-sm">

      <div className="text-sm font-semibold text-gray-700 mb-2">
        Tổng chi phí đổi vé
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">

        <div className="rounded-lg bg-white/70 p-2">
          <div className="text-xs text-gray-500">
            Phí phạt
          </div>

          <div className="font-semibold text-gray-800">
            {formatCurrencyKRW(price.penalty_total)}
          </div>
        </div>

        <div className="rounded-lg bg-white/70 p-2">
          <div className="text-xs text-gray-500">
            Phí chênh lệch
          </div>

          <div className="font-semibold text-gray-800">
            {formatCurrencyKRW(price.GRD_TOTAL)}
          </div>
        </div>

        <div className="rounded-lg bg-emerald-100 p-2">

          <div className="text-xs text-emerald-700 mb-1">
            Tổng phí đổi
          </div>

          <Input
            type="number"
            value={editableTotal}
            onChange={(e) =>
              setEditableTotal(
                Number(e.target.value || 0)
              )
            }
            className="bg-white font-bold"
          />

          <div className="text-[11px] text-emerald-700 mt-1">
            {formatCurrencyKRW(editableTotal)}
          </div>

        </div>
      </div>
    </div>
  );
};
