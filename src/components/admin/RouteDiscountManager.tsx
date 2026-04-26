import { useState } from "react"; 
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save, Search, X } from "lucide-react";
import { useRouteDiscounts, type RouteDiscount } from "@/hooks/useRouteDiscounts";

const AIRLINE_OPTIONS = ["VNA", "VJ", "OZ", "TW", "LJ", "BX", "KE", "7C", "YP", "RS"];

const RouteDiscountManager = () => {
  const { discounts, isLoading, refetch } = useRouteDiscounts();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<RouteDiscount>>>({});

  // New row form
  const [newRow, setNewRow] = useState({
    airline_code: "VNA",
    origin_code: "",
    destination_code: "",
    discount_amount: 0,
    is_active: true,
  });
  const [adding, setAdding] = useState(false);

  const upper = (s: string) => s.trim().toUpperCase();

  const filtered = discounts.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toUpperCase();
    return (
      d.airline_code.includes(q) ||
      d.origin_code.includes(q) ||
      d.destination_code.includes(q)
    );
  });

  const getValue = <K extends keyof RouteDiscount>(d: RouteDiscount, key: K): RouteDiscount[K] => {
    const draft = drafts[d.id];
    if (draft && key in draft && draft[key] !== undefined) {
      return draft[key] as RouteDiscount[K];
    }
    return d[key];
  };

  const updateDraft = (id: string, patch: Partial<RouteDiscount>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleAdd = async () => {
    const airline = upper(newRow.airline_code);
    const origin = upper(newRow.origin_code);
    const dest = upper(newRow.destination_code);

    if (!airline || !origin || !dest) {
      toast({ title: "Vui lòng điền đủ Hãng, Nơi đi, Nơi đến", variant: "destructive" });
      return;
    }
    if (origin === dest) {
      toast({ title: "Nơi đi và nơi đến phải khác nhau", variant: "destructive" });
      return;
    }

    setAdding(true);
    const { error } = await (supabase as any).from("route_discounts").insert({
      airline_code: airline,
      origin_code: origin,
      destination_code: dest,
      discount_amount: Number(newRow.discount_amount) || 0,
      is_active: newRow.is_active,
    });
    setAdding(false);

    if (error) {
      const msg = error.message?.includes("route_discounts_unique_route")
        ? "Chặng này đã tồn tại cho hãng đã chọn"
        : error.message;
      toast({ title: "Lỗi khi thêm", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Đã thêm chặng mới" });
    setNewRow({ airline_code: "VNA", origin_code: "", destination_code: "", discount_amount: 0, is_active: true });
    refetch();
  };

  const handleSaveRow = async (d: RouteDiscount) => {
    const draft = drafts[d.id];
    if (!draft) return;

    const payload: any = {};
    if (draft.airline_code !== undefined) payload.airline_code = upper(draft.airline_code);
    if (draft.origin_code !== undefined) payload.origin_code = upper(draft.origin_code);
    if (draft.destination_code !== undefined) payload.destination_code = upper(draft.destination_code);
    if (draft.discount_amount !== undefined) payload.discount_amount = Number(draft.discount_amount) || 0;
    if (draft.is_active !== undefined) payload.is_active = draft.is_active;

    if (payload.origin_code && payload.destination_code && payload.origin_code === payload.destination_code) {
      toast({ title: "Nơi đi và nơi đến phải khác nhau", variant: "destructive" });
      return;
    }

    setSavingId(d.id);
    const { error } = await (supabase as any)
      .from("route_discounts")
      .update(payload)
      .eq("id", d.id);
    setSavingId(null);

    if (error) {
      const msg = error.message?.includes("route_discounts_unique_route")
        ? "Chặng này đã tồn tại cho hãng đã chọn"
        : error.message;
      toast({ title: "Lỗi khi lưu", description: msg, variant: "destructive" });
      return;
    }
    toast({ title: "Đã lưu" });
    setDrafts((prev) => {
      const n = { ...prev };
      delete n[d.id];
      return n;
    });
    refetch();
  };

  const handleToggle = async (d: RouteDiscount, value: boolean) => {
    setSavingId(d.id);
    const { error } = await (supabase as any)
      .from("route_discounts")
      .update({ is_active: value })
      .eq("id", d.id);
    setSavingId(null);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      return;
    }
    refetch();
  };

  const handleDelete = async (d: RouteDiscount) => {
    if (!confirm(`Xóa chặng ${d.airline_code} ${d.origin_code} → ${d.destination_code}?`)) return;
    const { error } = await (supabase as any).from("route_discounts").delete().eq("id", d.id);
    if (error) {
      toast({ title: "Lỗi khi xóa", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã xóa" });
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Add new */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Thêm chặng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Hãng</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm"
                value={newRow.airline_code}
                onChange={(e) => setNewRow((p) => ({ ...p, airline_code: e.target.value }))}
              >
                {AIRLINE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nơi đi (IATA)</Label>
              <Input
                placeholder="ICN"
                maxLength={3}
                value={newRow.origin_code}
                onChange={(e) => setNewRow((p) => ({ ...p, origin_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nơi đến (IATA)</Label>
              <Input
                placeholder="SGN"
                maxLength={3}
                value={newRow.destination_code}
                onChange={(e) => setNewRow((p) => ({ ...p, destination_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Số tiền giảm (VND)</Label>
              <Input
                type="number"
                min={0}
                value={newRow.discount_amount}
                onChange={(e) => setNewRow((p) => ({ ...p, discount_amount: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Áp dụng</Label>
              <div className="h-10 flex items-center">
                <Switch
                  checked={newRow.is_active}
                  onCheckedChange={(v) => setNewRow((p) => ({ ...p, is_active: v }))}
                />
              </div>
            </div>
            <div>
              <Button onClick={handleAdd} disabled={adding} className="w-full">
                {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Thêm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">Danh sách chặng ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã sân bay / hãng..."
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              Không có chặng nào.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Hãng</TableHead>
                    <TableHead className="w-28">Nơi đi</TableHead>
                    <TableHead className="w-28">Nơi đến</TableHead>
                    <TableHead className="w-40">Giảm (VND)</TableHead>
                    <TableHead className="w-24">Áp dụng</TableHead>
                    <TableHead className="w-48 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const isDirty = !!drafts[d.id];
                    return (
                      <TableRow key={d.id}>
                        <TableCell>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                            value={getValue(d, "airline_code")}
                            onChange={(e) => updateDraft(d.id, { airline_code: e.target.value })}
                          >
                            {AIRLINE_OPTIONS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            maxLength={3}
                            value={getValue(d, "origin_code")}
                            onChange={(e) =>
                              updateDraft(d.id, { origin_code: e.target.value.toUpperCase() })
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            maxLength={3}
                            value={getValue(d, "destination_code")}
                            onChange={(e) =>
                              updateDraft(d.id, { destination_code: e.target.value.toUpperCase() })
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={Number(getValue(d, "discount_amount")) || 0}
                            onChange={(e) =>
                              updateDraft(d.id, { discount_amount: Number(e.target.value) || 0 })
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(getValue(d, "is_active"))}
                            onCheckedChange={(v) => {
                              if (isDirty) {
                                updateDraft(d.id, { is_active: v });
                              } else {
                                handleToggle(d, v);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!isDirty || savingId === d.id}
                            onClick={() => handleSaveRow(d)}
                          >
                            {savingId === d.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" /> Lưu
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(d)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteDiscountManager;
