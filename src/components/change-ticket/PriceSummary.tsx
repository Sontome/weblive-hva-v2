import React, { useEffect, useState } from 'react';
import type { ChangePrice } from '@/types/changeTicket';
import { formatCurrencyKRW } from './utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const PriceSummary: React.FC<{
  price?: ChangePrice;
}> = ({ price }) => {

  const [editing, setEditing] =
    useState(false);

  const [value, setValue] =
    useState('');

  const [displayValue, setDisplayValue] =
    useState<number>(0);

  useEffect(() => {

    if (price?.total_new != null) {

      setDisplayValue(price.total_new);

      setValue(String(price.total_new));
    }

  }, [price]);

  if (!price) return null;

  const handleSave = () => {

    const parsed = Number(value);

    if (!isNaN(parsed)) {
      setDisplayValue(parsed);
    }

    setEditing(false);
  };

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

          <div className="text-xs text-emerald-700">
            Tổng phí đổi
          </div>

          {!editing ? (

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-bold text-emerald-800 hover:underline"
            >
              {formatCurrencyKRW(displayValue)}
            </button>

          ) : (

            <div className="space-y-2 mt-1">

              <Input
                type="number"
                value={value}
                onChange={(e) =>
                  setValue(e.target.value)
                }
              />

              <div className="flex gap-2">

                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  OK
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setValue(
                      String(displayValue)
                    );
                  }}
                >
                  Cancel
                </Button>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
