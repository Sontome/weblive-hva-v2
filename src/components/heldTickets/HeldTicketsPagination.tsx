import React from 'react';
import { Button } from '@/components/ui/button';

export interface HeldTicketsPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** Sinh danh sách trang hiển thị dạng "1 2 3 4 5 ... 42", luôn giữ trang đầu/cuối. */
function buildPageList(current: number, total: number): (number | '...')[] {
  const SIBLINGS = 1;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];
  const start = Math.max(2, current - SIBLINGS);
  const end = Math.min(total - 1, current + SIBLINGS);

  if (start > 2) pages.push('...');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('...');
  pages.push(total);

  return pages;
}

export function HeldTicketsPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  disabled,
}: HeldTicketsPaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 text-sm">
      <div className="text-gray-600">
        Hiển thị <span className="font-semibold">{from.toLocaleString('en-US')}</span>–
        <span className="font-semibold">{to.toLocaleString('en-US')}</span> trong tổng số{' '}
        <span className="font-semibold">{totalCount.toLocaleString('en-US')}</span> vé
      </div>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Prev
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              className="min-w-[2.25rem]"
              disabled={disabled}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next ›
        </Button>
      </div>
    </div>
  );
}
