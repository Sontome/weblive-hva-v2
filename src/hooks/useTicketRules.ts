import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TicketCampaign, TicketRule } from "@/types/ticketRules";
import type { RuleEngineDataset } from "@/services/ticketRuleEngine";

export function useTicketRulesDataset() {
  return useQuery<RuleEngineDataset>({
    queryKey: ["ticket-rules-dataset"],
    staleTime: 60_000,
    queryFn: async () => {
      const [campaignsRes, rulesRes] = await Promise.all([
        supabase.from("ticket_campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("ticket_rules").select("*").order("priority", { ascending: false }),
      ]);
      if (campaignsRes.error) throw campaignsRes.error;
      if (rulesRes.error) throw rulesRes.error;
      return {
        campaigns: (campaignsRes.data ?? []) as TicketCampaign[],
        rules: (rulesRes.data ?? []) as TicketRule[],
      };
    },
  });
}
