import React from 'react';
import type { Airline, TicketStatus } from '@/types/heldTicket';
import { TICKET_STATUS_LABEL } from '@/types/heldTicket';

export const AIRLINE_BADGE_CLASS: Record<Airline, string> = {
  VJ: 'border-blue-500 text-blue-600',
  VNA: 'border-red-500 text-red-600',
  SUN: 'border-yellow-500 text-yellow-700',
  OTHER: 'border-gray-400 text-gray-600',
};

export const STATUS_BADGE_CLASS: Record<TicketStatus, string> = {
  holding: 'bg-black text-white',
  paid: 'bg-green-600 text-white',
  ticketed: 'bg-blue-600 text-white',
  cancelled: 'bg-red-600 text-white',
  expired: 'bg-gray-400 text-white',
};

export function AirlineBadge({ airline }: { airline: Airline }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${AIRLINE_BADGE_CLASS[airline]}`}
    >
      {airline}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE_CLASS[status]}`}
    >
      {TICKET_STATUS_LABEL[status]}
    </span>
  );
}

export function formatMoney(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Number(v).toLocaleString('en-US');
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
