export type TicketRuleAction =
  | "append_note"
  | "replace_baggage"
  | "change_price"
  | "hide_ticket"
  | "highlight_ticket"
  | "append_warning"
  | "change_text";

export interface TicketCampaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketRule {
  id: string;
  campaign_id: string;
  airline: string | null;
  route: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  action: TicketRuleAction | string;
  value: string | null;
  priority: number;
  enabled: boolean;
  /** 1 = only match segment #1 in its leg, 2 = #2, null = any */
  segment_position: number | null;
  /** 'direct' = only match when the leg is a direct flight (single segment), 'any'/null = default */
  match_scope: string | null;
  /**
   * Booking-class filter. Syntax:
   *   - null / "" = any
   *   - "V"        = exact match
   *   - "V,W,U"    = any of the listed classes
   *   - ">=V"      = alphabetical >= V (i.e. V, W, X, Y, Z)
   *   - "<=V"      = alphabetical <= V (i.e. A..V)
   */
  booking_class: string | null;
  /** 'outbound' = only chiều đi, 'return' = only chiều về, null/'any' = cả hai */
  leg_scope: string | null;
  /** Nếu true: rule chỉ khớp khi chiều còn lại của vé cũng là bay thẳng (leg_size = 1). */
  require_other_leg_direct: boolean;
  created_at: string;
  updated_at: string;
}

/** Minimal shape any leg/segment must expose for the engine. */
export interface RuleSegmentInput {
  airline?: string | null;
  from?: string | null;
  to?: string | null;
  departure_time?: string | null;
  arrival_time?: string | null;
  /** dd/MM/yyyy or yyyy-MM-dd */
  departure_date?: string | null;
  /** 1-based order within its leg (outbound or return) */
  segment_order?: number | null;
  /** 0 = outbound, 1 = return */
  leg_index?: number | null;
  /** total number of segments in this leg (1 = direct, 2+ = connecting) */
  leg_size?: number | null;
  /** Booking class letter for this leg (e.g. "V", "U", "W") */
  booking_class?: string | null;
}

export interface RuleTicketInput {
  segments: RuleSegmentInput[];
  /** original ticket, opaque to engine */
  raw?: unknown;
}

export interface RuleEffects {
  notes: string[];
  warnings: string[];
  hidden: boolean;
  highlight?: string;
  baggage?: string;
  priceOverride?: number;
  textOverrides: Record<string, string>;
  matchedRuleIds: string[];
}

export interface ActionContext {
  effects: RuleEffects;
  rule: TicketRule;
  segment: RuleSegmentInput;
  ticket: RuleTicketInput;
}

export type ActionHandler = (ctx: ActionContext) => void;
