import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Save, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceConfig {
  id: string;
  customer_mode: string;
  one_way_fee: number;
  round_trip_fee_vietjet: number;
  round_trip_fee_vna: number;
  vna_threshold_1: number;
  vna_discount_ow_1: number;
  vna_discount_rt_1: number;
  vna_threshold_2: number;
  vna_discount_ow_2: number;
  vna_discount_rt_2: number;
  vna_threshold_3: number;
  vna_discount_ow_3: number;
  vna_discount_rt_3: number;
  vietjet_threshold_1: number;
  vietjet_discount_ow_1: number;
  vietjet_discount_rt_1: number;
  vietjet_threshold_2: number;
  vietjet_discount_ow_2: number;
  vietjet_discount_rt_2: number;
  vietjet_threshold_3: number;
  vietjet_discount_ow_3: number;
  vietjet_discount_rt_3: number;
}

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [configs, setConfigs] = useState<PriceConfig[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadConfigs();
  }, []);

  const checkAdminAndLoadConfigs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAdminRole = roles?.some(r => r.role === "admin");
      
      if (!hasAdminRole) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn không phải là admin",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      const { data: configData, error } = await supabase
        .from("price_configs")
        .select("*")
        .order("customer_mode");

      if (error) throw error;
      setConfigs(configData || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (mode: string, field: keyof PriceConfig, value: string) => {
    setConfigs(prev =>
      prev.map(config =>
        config.customer_mode === mode ? { ...config, [field]: parseFloat(value) || 0 } : config
      )
    );
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      for (const config of configs) {
        const { error } = await supabase
          .from("price_configs")
          .update({
            one_way_fee: config.one_way_fee,
            round_trip_fee_vietjet: config.round_trip_fee_vietjet,
            round_trip_fee_vna: config.round_trip_fee_vna,
            vna_threshold_1: config.vna_threshold_1,
            vna_discount_ow_1: config.vna_discount_ow_1,
            vna_discount_rt_1: config.vna_discount_rt_1,
            vna_threshold_2: config.vna_threshold_2,
            vna_discount_ow_2: config.vna_discount_ow_2,
            vna_discount_rt_2: config.vna_discount_rt_2,
            vna_threshold_3: config.vna_threshold_3,
            vna_discount_ow_3: config.vna_discount_ow_3,
            vna_discount_rt_3: config.vna_discount_rt_3,
            vietjet_threshold_1: config.vietjet_threshold_1,
            vietjet_discount_ow_1: config.vietjet_discount_ow_1,
            vietjet_discount_rt_1: config.vietjet_discount_rt_1,
            vietjet_threshold_2: config.vietjet_threshold_2,
            vietjet_discount_ow_2: config.vietjet_discount_ow_2,
            vietjet_discount_rt_2: config.vietjet_discount_rt_2,
            vietjet_threshold_3: config.vietjet_threshold_3,
            vietjet_discount_ow_3: config.vietjet_discount_ow_3,
            vietjet_discount_rt_3: config.vietjet_discount_rt_3,
          })
          .eq("id", config.id);

        if (error) throw error;
      }

      toast({ title: "Lưu thành công!" });
    } catch (error: any) {
      toast({
        title: "Lỗi khi lưu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "page": return "Khách PAGE";
      case "live": return "Khách LIVE";
      case "custom": return "TÙY CHỈNH";
      default: return mode;
    }
  };

  const renderModeConfig = (config: PriceConfig) => {
    const mode = config.customer_mode;
    
    return (
      <div className="space-y-6">
        {/* Phí cộng thêm */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Phí cộng thêm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phí 1 chiều (VND)</Label>
                <Input
                  type="number"
                  value={config.one_way_fee}
                  onChange={(e) => handleConfigChange(mode, "one_way_fee", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Khứ hồi Vietjet (VND)</Label>
                <Input
                  type="number"
                  value={config.round_trip_fee_vietjet}
                  onChange={(e) => handleConfigChange(mode, "round_trip_fee_vietjet", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Khứ hồi VNA (VND)</Label>
                <Input
                  type="number"
                  value={config.round_trip_fee_vna}
                  onChange={(e) => handleConfigChange(mode, "round_trip_fee_vna", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vietnam Airlines discounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-700">Giảm giá Vietnam Airlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((tier) => (
                <div key={tier} className="grid grid-cols-4 gap-4 items-end p-3 border rounded-lg bg-blue-50/50">
                  <div className="font-medium text-blue-800">Mức {tier}</div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ngưỡng giá (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vna_threshold_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vna_threshold_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giảm 1 chiều (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vna_discount_ow_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vna_discount_ow_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giảm khứ hồi (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vna_discount_rt_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vna_discount_rt_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vietjet discounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-700">Giảm giá Vietjet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((tier) => (
                <div key={tier} className="grid grid-cols-4 gap-4 items-end p-3 border rounded-lg bg-red-50/50">
                  <div className="font-medium text-red-800">Mức {tier}</div>
                  <div className="space-y-1">
                    <Label className="text-xs">Ngưỡng giá (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vietjet_threshold_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vietjet_threshold_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giảm 1 chiều (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vietjet_discount_ow_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vietjet_discount_ow_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Giảm khứ hồi (VND)</Label>
                    <Input
                      type="number"
                      value={config[`vietjet_discount_rt_${tier}` as keyof PriceConfig] as number}
                      onChange={(e) => handleConfigChange(mode, `vietjet_discount_rt_${tier}` as keyof PriceConfig, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Quản lý cấu hình giá</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveConfigs} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu tất cả
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>

        <Tabs defaultValue="page" className="w-full">
          <TabsList className="mb-4 grid grid-cols-3 w-full max-w-md">
            {configs.map((config) => (
              <TabsTrigger key={config.customer_mode} value={config.customer_mode}>
                {getModeLabel(config.customer_mode)}
              </TabsTrigger>
            ))}
          </TabsList>
          {configs.map((config) => (
            <TabsContent key={config.customer_mode} value={config.customer_mode}>
              {renderModeConfig(config)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
