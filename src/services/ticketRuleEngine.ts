import type {
  ActionContext,
  ActionHandler,
  RuleEffects,
  RuleTicketInput,
  RuleSegmentInput,
  TicketCampaign,
  TicketRule,
} from "@/types/ticketRules";

/* ================================================================== *
 *  Action Handler Registry (Strategy Pattern)                        *
 *  Add new actions by calling registerActionHandler(...) — no need   *
 *  to modify existing code (Open/Closed Principle).                  *
 * ================================================================== */

const handlers = new Map<string, ActionHandler>();

export function registerActionHandler(action: string, handler: ActionHandler): void {
  handlers.set(action, handler);
}

export function getRegisteredActions(): string[] {
  return Array.from(handlers.keys());
}

/* ----------------------- default action handlers ------------------ */

registerActionHandler("append_note", ({ effects, rule }) => {
  const v = (rule.value ?? "").trim();
  if (v && !effects.notes.includes(v)) effects.notes.push(v);
});

registerActionHandler("append_warning", ({ effects, rule }) => {
  const v = (rule.value ?? "").trim();
  if (v && !effects.warnings.includes(v)) effects.warnings.push(v);
});

registerActionHandler("replace_baggage", ({ effects, rule }) => {
  if (rule.value) effects.baggage = rule.value;
});

registerActionHandler("change_price", ({ effects, rule }) => {
  const n = Number(rule.value);
  if (Number.isFinite(n)) effects.priceOverride = n;
});

registerActionHandler("hide_ticket", ({ effects }) => {
  effects.hidden = true;
});

registerActionHandler("highlight_ticket", ({ effects, rule }) => {
  effects.highlight = rule.value ?? "red";
});

registerActionHandler("change_text", ({ effects, rule }) => {
  // value format: "field=text" or json {field:text}
  const raw = rule.value ?? "";
  const eq = raw.indexOf("=");
  if (eq > 0) {
    const key = raw.slice(0, eq).trim();
    const val = raw.slice(eq + 1).trim();
    if (key) effects.textOverrides[key] = val;
  }
});

/* ================================================================== *
 *  Matching helpers                                                  *
 * ================================================================== */

const AIRLINE_ALIASES: Record<string, string[]> = {
  vn: ["vn", "vna", "vietnam airlines", "vietnamairlines"],
  vna: ["vn", "vna"],
  vj: ["vj", "vja", "vietjet"],
  sun: ["sun", "sunpq", "vu"],
};

function normAirline(a?: string | null): string {
  return (a ?? "").trim().toLowerCase();
}

function airlineMatches(ruleAirline: string | null, segAirline?: string | null): boolean {
  const r = normAirline(ruleAirline);
  if (!r) return true;
  const s = normAirline(segAirline);
  if (!s) return false;
  if (r === s) return true;
  const aliases = AIRLINE_ALIASES[r] ?? [r];
  return aliases.includes(s);
}

function normRoute(r?: string | null): string {
  return (r ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function routeMatches(ruleRoute: string | null, seg: RuleSegmentInput): boolean {
  const rr = normRoute(ruleRoute);
  if (!rr) return true;
  const from = (seg.from ?? "").trim().toUpperCase();
  const to = (seg.to ?? "").trim().toUpperCase();
  return rr === `${from}-${to}`;
}

function normTime(t?: string | null): string {
  const s = (t ?? "").trim();
  if (!s) return "";
  // Accept "17:55", "1755", "17:55:00"
  const digits = s.replace(/[^0-9]/g, "");
  if (digits.length >= 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  return s;
}

function timeMatches(ruleTime: string | null, segTime?: string | null): boolean {
  const r = normTime(ruleTime);
  if (!r) return true;
  return r === normTime(segTime);
}

/** Parse dd/MM/yyyy or yyyy-MM-dd into yyyy-MM-dd, or "" on failure */
function toISODate(d?: string | null): string {
  const s = (d ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function campaignActiveForDate(camp: TicketCampaign, isoDate: string): boolean {
  if (!camp.enabled) return false;
  if (!isoDate) {
    // No segment date — active if no window OR today is in window
    const today = new Date().toISOString().slice(0, 10);
    return (!camp.start_date || today >= camp.start_date) && (!camp.end_date || today <= camp.end_date);
  }
  if (camp.start_date && isoDate < camp.start_date) return false;
  if (camp.end_date && isoDate > camp.end_date) return false;
  return true;
}

/* ================================================================== *
 *  Public API                                                        *
 * ================================================================== */

export interface RuleEngineDataset {
  campaigns: TicketCampaign[];
  rules: TicketRule[];
}

export function createEmptyEffects(): RuleEffects {
  return {
    notes: [],
    warnings: [],
    hidden: false,
    textOverrides: {},
    matchedRuleIds: [],
  };
}

/** Rules grouped by campaign, sorted by priority desc. */
export function indexRules(dataset: RuleEngineDataset): Map<string, TicketRule[]> {
  const map = new Map<string, TicketRule[]>();
  const enabledCampaigns = new Set(dataset.campaigns.filter((c) => c.enabled).map((c) => c.id));
  for (const r of dataset.rules) {
    if (!r.enabled) continue;
    if (!enabledCampaigns.has(r.campaign_id)) continue;
    const arr = map.get(r.campaign_id) ?? [];
    arr.push(r);
    map.set(r.campaign_id, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => b.priority - a.priority);
  return map;
}

/** Check whether a single rule matches a segment. Pure — reusable in tests / backend. */
export function matchRuleAgainstSegment(rule: TicketRule, seg: RuleSegmentInput): boolean {
  return (
    airlineMatches(rule.airline, seg.airline) &&
    routeMatches(rule.route, seg) &&
    timeMatches(rule.departure_time, seg.departure_time) &&
    timeMatches(rule.arrival_time, seg.arrival_time) &&
    segmentPositionMatches(rule.segment_position ?? null, seg.segment_order ?? null) &&
    legScopeMatches(rule.leg_scope ?? null, seg.leg_index ?? null) &&
    scopeMatches(rule.match_scope ?? null, seg.leg_size ?? null) &&
    bookingClassMatches(rule.booking_class ?? null, seg.booking_class ?? null)
  );
}

function segmentPositionMatches(rulePos: number | null, segOrder: number | null): boolean {
  if (rulePos == null) return true;
  if (segOrder == null) return false;
  return rulePos === segOrder;
}

/** Restrict rule to a specific leg direction. null/'any' = both. */
function legScopeMatches(scope: string | null, legIndex: number | null): boolean {
  const s = (scope ?? "").trim().toLowerCase();
  if (!s || s === "any") return true;
  if (legIndex == null) return true;
  if (s === "outbound") return legIndex === 0;
  if (s === "return") return legIndex === 1;
  return true;
}

function scopeMatches(scope: string | null, legSize: number | null): boolean {
  const s = (scope ?? "").trim().toLowerCase();
  if (!s || s === "any") return true;
  if (s === "direct") return legSize === 1;
  if (s === "connecting") return (legSize ?? 0) >= 2;
  return true;
}

function bookingClassMatches(ruleClass: string | null, segClass: string | null): boolean {
  const raw = (ruleClass ?? "").trim().toUpperCase();
  if (!raw) return true;
  const seg = (segClass ?? "").trim().toUpperCase();
  if (!seg) return false;
  // >=X or <=X — alphabetical comparison on first letter
  const m = raw.match(/^(>=|<=)\s*([A-Z])$/);
  if (m) {
    const op = m[1];
    const target = m[2];
    const first = seg.charAt(0);
    if (op === ">=") return first >= target;
    return first <= target;
  }
  // Comma-separated list or single letter
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(seg);
}

/** Apply active rules to a ticket, returning effects (does not mutate ticket). */
export function applyTicketRules(
  ticket: RuleTicketInput,
  dataset: RuleEngineDataset,
): RuleEffects {
  const effects = createEmptyEffects();
  const campaignsById = new Map(dataset.campaigns.map((c) => [c.id, c]));
  const rulesByCampaign = indexRules(dataset);

  // Precompute leg sizes keyed by leg_index for cross-leg conditions.
  const legSizeByIndex = new Map<number, number>();
  for (const s of ticket.segments) {
    if (s.leg_index == null || s.leg_size == null) continue;
    if (!legSizeByIndex.has(s.leg_index)) legSizeByIndex.set(s.leg_index, s.leg_size);
  }

  for (const seg of ticket.segments) {
    const segDate = toISODate(seg.departure_date);
    for (const [campId, rules] of rulesByCampaign) {
      const camp = campaignsById.get(campId);
      if (!camp) continue;
      if (!campaignActiveForDate(camp, segDate)) continue;
      for (const rule of rules) {
        if (!matchRuleAgainstSegment(rule, seg)) continue;
        if (rule.require_other_leg_direct) {
          // Nếu vé chỉ có 1 chiều (OW) thì không có chiều còn lại → coi như thoả mãn.
          if (seg.leg_index != null && legSizeByIndex.size > 1) {
            const otherIdx = seg.leg_index === 0 ? 1 : 0;
            const otherSize = legSizeByIndex.get(otherIdx);
            if (otherSize != null && otherSize !== 1) continue;
          }
        }
        const handler = handlers.get(rule.action);
        if (!handler) continue;
        const ctx: ActionContext = { effects, rule, segment: seg, ticket };
        handler(ctx);
        effects.matchedRuleIds.push(rule.id);
      }
    }
  }
  return effects;
}

/** Test helper — returns rules that would match a synthetic segment. */
export function testMatch(
  input: RuleSegmentInput & { date?: string; other_leg_size?: number | null },
  dataset: RuleEngineDataset,
): TicketRule[] {
  const seg: RuleSegmentInput = { ...input, departure_date: input.date ?? input.departure_date };
  const campaignsById = new Map(dataset.campaigns.map((c) => [c.id, c]));
  const rulesByCampaign = indexRules(dataset);
  const matched: TicketRule[] = [];
  const segDate = toISODate(seg.departure_date);
  for (const [campId, rules] of rulesByCampaign) {
    const camp = campaignsById.get(campId);
    if (!camp || !campaignActiveForDate(camp, segDate)) continue;
    for (const rule of rules) {
      if (!matchRuleAgainstSegment(rule, seg)) continue;
      if (rule.require_other_leg_direct) {
        // 0/null = không có chiều còn lại (OW) → thoả mãn. 1 = direct → thoả mãn. >=2 = fail.
        const ols = input.other_leg_size;
        if (ols != null && ols !== 0 && ols !== 1) continue;
      }
      matched.push(rule);
    }
  }
  return matched;
}

/** Format multiple notes into the "(A | B | C)" line. */
export function formatNotesLine(notes: string[]): string {
  const unique = Array.from(new Set(notes.map((n) => n.trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  return `(${unique.join(" | ")})`;
}
