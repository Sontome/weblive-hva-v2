import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  label: string;
  options: string[];
  selected: string[]; // empty = all
  onChange: (next: string[]) => void;
}

export function MultiSelectFilter({ label, options, selected, onChange }: Props) {
  const allSelected = selected.length === 0;
  const text = allSelected
    ? 'Tất cả'
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} đã chọn`;

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal h-10">
            <span className="truncate">{text}</span>
            <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1 bg-popover z-50" align="start">
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent"
              onClick={() => onChange([])}
            >
              <span className="w-4">{allSelected && <Check className="w-4 h-4" />}</span>
              Tất cả
            </button>
            {options.map((o) => (
              <button
                key={o}
                type="button"
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
                onClick={() => toggle(o)}
              >
                <span className="w-4">{selected.includes(o) && <Check className="w-4 h-4" />}</span>
                <span className="truncate">{o}</span>
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">Không có dữ liệu</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
