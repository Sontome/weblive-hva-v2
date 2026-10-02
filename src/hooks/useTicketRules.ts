import { useMemo } from "react";
import type { TicketCampaign, TicketRule } from "@/types/ticketRules";
import type { RuleEngineDataset } from "@/services/ticketRuleEngine";
import { useConfigTable } from "@/lib/configStore";

/** Shared, cached dataset (6h TTL, deduped) — no direct Supabase calls here. */
export function useTicketRulesDataset() {
  const c = useConfigTable<TicketCampaign>("ticket_campaigns");
  const r = useConfigTable<TicketRule>("ticket_rules");
  const data = useMemo<RuleEngineDataset | undefined>(
    () => (c.data && r.data ? { campaigns: c.data, rules: r.data } : undefined),
    [c.data, r.data],
  );
  return { data, isLoading: c.isLoading || r.isLoading, error: c.error || r.error };
}
