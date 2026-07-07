import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, FlaskConical, ArrowLeft, Search } from "lucide-react";
import type { TicketCampaign, TicketRule } from "@/types/ticketRules";
import {
  getRegisteredActions,
  testMatch,
} from "@/services/ticketRuleEngine";

const AIRLINE_OPTIONS = [
  { value: "", label: "Tất cả hãng" },
  { value: "VN", label: "Vietnam Airlines (VN)" },
  { value: "VJ", label: "VietJet (VJ)" },
  { value: "SUN", label: "Sun PhuQuoc (SUN)" },
];

const PAGE_SIZE = 10;

export default function TicketRulesAdmin() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<TicketCampaign[]>([]);
  const [rules, setRules] = useState<TicketRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const [campaignDialog, setCampaignDialog] = useState<{ open: boolean; edit: TicketCampaign | null }>({
    open: false,
    edit: null,
  });
  const [ruleDialog, setRuleDialog] = useState<{ open: boolean; edit: TicketRule | null }>({
    open: false,
    edit: null,
  });
  const [testOpen, setTestOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filterEnabled, setFilterEnabled] = useState<"all" | "on" | "off">("all");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const [c, r] = await Promise.all([
      supabase.from("ticket_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("ticket_rules").select("*").order("priority", { ascending: false }),
    ]);
    if (c.error) toast.error(c.error.message);
    if (r.error) toast.error(r.error.message);
    setCampaigns((c.data ?? []) as TicketCampaign[]);
    setRules((r.data ?? []) as TicketRule[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedCampaign && campaigns.length) setSelectedCampaign(campaigns[0].id);
  }, [campaigns, selectedCampaign]);

  const currentRules = useMemo(() => {
    let list = rules.filter((r) => r.campaign_id === selectedCampaign);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) =>
        [r.airline, r.route, r.departure_time, r.arrival_time, r.value, r.action]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (filterEnabled !== "all") {
      const on = filterEnabled === "on";
      list = list.filter((r) => r.enabled === on);
    }
    return list;
  }, [rules, selectedCampaign, search, filterEnabled]);

  const totalPages = Math.max(1, Math.ceil(currentRules.length / PAGE_SIZE));
  const paged = currentRules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [selectedCampaign, search, filterEnabled]);

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaign) ?? null;

  /* ---------------------- Campaign CRUD ---------------------- */
  const saveCampaign = async (data: Partial<TicketCampaign>) => {
    if (!data.name?.trim()) {
      toast.error("Tên campaign không được để trống");
      return;
    }
    const payload = {
      name: data.name,
      description: data.description ?? null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      enabled: data.enabled ?? true,
    };
    if (campaignDialog.edit) {
      const { error } = await supabase.from("ticket_campaigns").update(payload).eq("id", campaignDialog.edit.id);
      if (error) return toast.error(error.message);
      toast.success("Đã cập nhật campaign");
    } else {
      const { error } = await supabase.from("ticket_campaigns").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Đã tạo campaign");
    }
    setCampaignDialog({ open: false, edit: null });
    load();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Xóa campaign và tất cả rule bên trong?")) return;
    const { error } = await supabase.from("ticket_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa");
    if (selectedCampaign === id) setSelectedCampaign(null);
    load();
  };

  const toggleCampaign = async (c: TicketCampaign) => {
    const { error } = await supabase.from("ticket_campaigns").update({ enabled: !c.enabled }).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };

  /* ---------------------- Rule CRUD ---------------------- */
  const saveRule = async (data: Partial<TicketRule>) => {
    if (!selectedCampaign) return;
    if (!data.action) {
      toast.error("Chọn action");
      return;
    }
    const payload = {
      campaign_id: selectedCampaign,
      airline: data.airline || null,
      route: data.route?.trim().toUpperCase() || null,
      departure_time: data.departure_time || null,
      arrival_time: data.arrival_time || null,
      action: data.action,
      value: data.value ?? null,
      priority: Number(data.priority ?? 0),
      enabled: data.enabled ?? true,
    };
    if (ruleDialog.edit) {
      const { error } = await supabase.from("ticket_rules").update(payload).eq("id", ruleDialog.edit.id);
      if (error) return toast.error(error.message);
      toast.success("Đã cập nhật rule");
    } else {
      const { error } = await supabase.from("ticket_rules").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Đã tạo rule");
    }
    setRuleDialog({ open: false, edit: null });
    load();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Xóa rule?")) return;
    const { error } = await supabase.from("ticket_rules").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xóa");
    load();
  };

  const toggleRule = async (r: TicketRule) => {
    const { error } = await supabase.from("ticket_rules").update({ enabled: !r.enabled }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Về trang chính
            </Button>
            <div>
              <h1 className="text-xl font-bold">Ticket Rule Engine</h1>
              <p className="text-xs text-muted-foreground">Quản lý campaign & rule hiển thị vé</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setTestOpen(true)}>
            <FlaskConical className="h-4 w-4 mr-1" /> Test Rule
          </Button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-12 gap-4">
        {/* Sidebar: campaigns */}
        <aside className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Campaigns</CardTitle>
              <Button size="sm" onClick={() => setCampaignDialog({ open: true, edit: null })}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[70vh] overflow-y-auto">
              {loading && <div className="text-xs text-muted-foreground">Đang tải...</div>}
              {!loading && campaigns.length === 0 && (
                <div className="text-xs text-muted-foreground">Chưa có campaign</div>
              )}
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className={`group rounded-md border p-2 cursor-pointer transition-colors ${
                    selectedCampaign === c.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-slate-100"
                  }`}
                  onClick={() => setSelectedCampaign(c.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.start_date || "…"} → {c.end_date || "…"}
                      </div>
                    </div>
                    <Badge variant={c.enabled ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {c.enabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCampaign(c);
                      }}
                    >
                      {c.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCampaignDialog({ open: true, edit: c });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCampaign(c.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Main: rules */}
        <main className="col-span-12 lg:col-span-9">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {activeCampaign?.name ?? "Chọn campaign"}
                  </CardTitle>
                  {activeCampaign?.description && (
                    <p className="text-xs text-muted-foreground mt-1">{activeCampaign.description}</p>
                  )}
                </div>
                <Button
                  disabled={!activeCampaign}
                  onClick={() => setRuleDialog({ open: true, edit: null })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm Rule
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Tìm airline, route, action, value..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={filterEnabled} onValueChange={(v: "all" | "on" | "off") => setFilterEnabled(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="on">Đang bật</SelectItem>
                    <SelectItem value="off">Đang tắt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Airline</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-center">Priority</TableHead>
                    <TableHead className="text-center">Enabled</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!activeCampaign && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Chọn hoặc tạo một campaign để bắt đầu
                      </TableCell>
                    </TableRow>
                  )}
                  {activeCampaign && paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Không có rule nào
                      </TableCell>
                    </TableRow>
                  )}
                  {paged.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.airline || <span className="text-muted-foreground">*</span>}</TableCell>
                      <TableCell className="font-mono text-xs">{r.route || "*"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.departure_time || "*"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.arrival_time || "*"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.action}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate" title={r.value ?? ""}>
                        {r.value}
                      </TableCell>
                      <TableCell className="text-center">{r.priority}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={r.enabled} onCheckedChange={() => toggleRule(r)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setRuleDialog({ open: true, edit: r })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRule(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {currentRules.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-3 text-sm">
                  <div className="text-muted-foreground">
                    {currentRules.length} rules · trang {page}/{totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                      Trước
                    </Button>
                    <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <CampaignDialog
        state={campaignDialog}
        onClose={() => setCampaignDialog({ open: false, edit: null })}
        onSave={saveCampaign}
      />
      <RuleDialog
        state={ruleDialog}
        onClose={() => setRuleDialog({ open: false, edit: null })}
        onSave={saveRule}
      />
      <TestRuleDialog
        open={testOpen}
        onClose={() => setTestOpen(false)}
        dataset={{ campaigns, rules }}
      />
    </div>
  );
}

/* =========================== Dialogs =========================== */

function CampaignDialog({
  state,
  onClose,
  onSave,
}: {
  state: { open: boolean; edit: TicketCampaign | null };
  onClose: () => void;
  onSave: (data: Partial<TicketCampaign>) => void;
}) {
  const [form, setForm] = useState<Partial<TicketCampaign>>({});
  useEffect(() => {
    setForm(
      state.edit ?? {
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        enabled: true,
      },
    );
  }, [state.edit, state.open]);

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.edit ? "Sửa campaign" : "Tạo campaign"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tên</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ngày bắt đầu</Label>
              <Input
                type="date"
                value={form.start_date ?? ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Ngày kết thúc</Label>
              <Input
                type="date"
                value={form.end_date ?? ""}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.enabled ?? true} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label>Enable</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => onSave(form)}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RuleDialog({
  state,
  onClose,
  onSave,
}: {
  state: { open: boolean; edit: TicketRule | null };
  onClose: () => void;
  onSave: (data: Partial<TicketRule>) => void;
}) {
  const [form, setForm] = useState<Partial<TicketRule>>({});
  const actions = getRegisteredActions();
  useEffect(() => {
    setForm(
      state.edit ?? {
        airline: "",
        route: "",
        departure_time: "",
        arrival_time: "",
        action: "append_note",
        value: "",
        priority: 0,
        enabled: true,
      },
    );
  }, [state.edit, state.open]);

  return (
    <Dialog open={state.open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{state.edit ? "Sửa rule" : "Tạo rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Airline</Label>
              <Select
                value={form.airline ?? ""}
                onValueChange={(v) => setForm({ ...form, airline: v === "__all" ? "" : v })}
              >
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Tất cả hãng</SelectItem>
                  {AIRLINE_OPTIONS.filter((o) => o.value).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Route (VD: ICN-SGN)</Label>
              <Input
                value={form.route ?? ""}
                placeholder="ICN-SGN"
                onChange={(e) => setForm({ ...form, route: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Departure Time (HH:mm)</Label>
              <Input
                value={form.departure_time ?? ""}
                placeholder="17:55"
                onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
              />
            </div>
            <div>
              <Label>Arrival Time (optional)</Label>
              <Input
                value={form.arrival_time ?? ""}
                placeholder=""
                onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Action</Label>
              <Select value={form.action ?? "append_note"} onValueChange={(v) => setForm({ ...form, action: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                value={form.priority ?? 0}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              value={form.value ?? ""}
              placeholder="VD: ICN-SGN 23kg"
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.enabled ?? true} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            <Label>Enable</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => onSave(form)}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestRuleDialog({
  open,
  onClose,
  dataset,
}: {
  open: boolean;
  onClose: () => void;
  dataset: { campaigns: TicketCampaign[]; rules: TicketRule[] };
}) {
  const [airline, setAirline] = useState("VN");
  const [route, setRoute] = useState("ICN-SGN");
  const [time, setTime] = useState("17:55");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [from, to] = route.split("-");
  const matched = useMemo(
    () =>
      testMatch(
        {
          airline,
          from: from ?? "",
          to: to ?? "",
          departure_time: time,
          departure_date: date,
        },
        dataset,
      ),
    [airline, from, to, time, date, dataset],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Rule</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Airline</Label>
            <Input value={airline} onChange={(e) => setAirline(e.target.value)} />
          </div>
          <div>
            <Label>Route (VD: ICN-SGN)</Label>
            <Input value={route} onChange={(e) => setRoute(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Departure Time</Label>
            <Input value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-sm font-semibold mb-2">Rules khớp: {matched.length}</div>
          <div className="max-h-[280px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Airline</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matched.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Không có rule nào khớp
                    </TableCell>
                  </TableRow>
                )}
                {matched.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.airline || "*"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.route || "*"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.departure_time || "*"}</TableCell>
                    <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                    <TableCell>{r.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
