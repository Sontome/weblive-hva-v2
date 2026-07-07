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
