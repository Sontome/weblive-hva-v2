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
  round_trip_fee_other: number;
  // VNA (5 tiers)
  vna_threshold_1: number;
  vna_discount_ow_1: number;
  vna_discount_rt_1: number;
  vna_threshold_2: number;
  vna_discount_ow_2: number;
  vna_discount_rt_2: number;
  vna_threshold_3: number;
  vna_discount_ow_3: number;
  vna_discount_rt_3: number;
  vna_threshold_4: number;
  vna_discount_ow_4: number;
  vna_discount_rt_4: number;
  vna_threshold_5: number;
  vna_discount_ow_5: number;
  vna_discount_rt_5: number;
  // Vietjet (5 tiers)
  vietjet_threshold_1: number;
  vietjet_discount_ow_1: number;
  vietjet_discount_rt_1: number;
  vietjet_threshold_2: number;
  vietjet_discount_ow_2: number;
  vietjet_discount_rt_2: number;
  vietjet_threshold_3: number;
  vietjet_discount_ow_3: number;
  vietjet_discount_rt_3: number;
  vietjet_threshold_4: number;
  vietjet_discount_ow_4: number;
  vietjet_discount_rt_4: number;
  vietjet_threshold_5: number;
  vietjet_discount_ow_5: number;
  vietjet_discount_rt_5: number;
  // Other airlines (5 tiers)
  other_threshold_1: number;
  other_discount_ow_1: number;
  other_discount_rt_1: number;
  other_threshold_2: number;
  other_discount_ow_2: number;
  other_discount_rt_2: number;
  other_threshold_3: number;
  other_discount_ow_3: number;
  other_discount_rt_3: number;
  other_threshold_4: number;
  other_discount_ow_4: number;
  other_discount_rt_4: number;
  other_threshold_5: number;
  other_discount_ow_5: number;
  other_discount_rt_5: number;
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
            round_trip_fee_other: config.round_trip_fee_other,
            // VNA (5 tiers)
            vna_threshold_1: config.vna_threshold_1,
            vna_discount_ow_1: config.vna_discount_ow_1,
            vna_discount_rt_1: config.vna_discount_rt_1,
            vna_threshold_2: config.vna_threshold_2,
            vna_discount_ow_2: config.vna_discount_ow_2,
            vna_discount_rt_2: config.vna_discount_rt_2,
            vna_threshold_3: config.vna_threshold_3,
            vna_discount_ow_3: config.vna_discount_ow_3,
            vna_discount_rt_3: config.vna_discount_rt_3,
            vna_threshold_4: config.vna_threshold_4,
            vna_discount_ow_4: config.vna_discount_ow_4,
            vna_discount_rt_4: config.vna_discount_rt_4,
            vna_threshold_5: config.vna_threshold_5,
            vna_discount_ow_5: config.vna_discount_ow_5,
            vna_discount_rt_5: config.vna_discount_rt_5,
            // Vietjet (5 tiers)
            vietjet_threshold_1: config.vietjet_threshold_1,
            vietjet_discount_ow_1: config.vietjet_discount_ow_1,
            vietjet_discount_rt_1: config.vietjet_discount_rt_1,
            vietjet_threshold_2: config.vietjet_threshold_2,
            vietjet_discount_ow_2: config.vietjet_discount_ow_2,
            vietjet_discount_rt_2: config.vietjet_discount_rt_2,
            vietjet_threshold_3: config.vietjet_threshold_3,
            vietjet_discount_ow_3: config.vietjet_discount_ow_3,
            vietjet_discount_rt_3: config.vietjet_discount_rt_3,
            vietjet_threshold_4: config.vietjet_threshold_4,
            vietjet_discount_ow_4: config.vietjet_discount_ow_4,
            vietjet_discount_rt_4: config.vietjet_discount_rt_4,
            vietjet_threshold_5: config.vietjet_threshold_5,
            vietjet_discount_ow_5: config.vietjet_discount_ow_5,
            vietjet_discount_rt_5: config.vietjet_discount_rt_5,
            // Other airlines (5 tiers)
            other_threshold_1: config.other_threshold_1,
            other_discount_ow_1: config.other_discount_ow_1,
            other_discount_rt_1: config.other_discount_rt_1,
            other_threshold_2: config.other_threshold_2,
            other_discount_ow_2: config.other_discount_ow_2,
            other_discount_rt_2: config.other_discount_rt_2,
            other_threshold_3: config.other_threshold_3,
            other_discount_ow_3: config.other_discount_ow_3,
            other_discount_rt_3: config.other_discount_rt_3,
            other_threshold_4: config.other_threshold_4,
            other_discount_ow_4: config.other_discount_ow_4,
            other_discount_rt_4: config.other_discount_rt_4,
            other_threshold_5: config.other_threshold_5,
            other_discount_ow_5: config.other_discount_ow_5,
            other_discount_rt_5: config.other_discount_rt_5,
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

  const renderDiscountTiers = (
    config: PriceConfig, 
    mode: string, 
    prefix: 'vna' | 'vietjet' | 'other',
    title: string,
    colorClass: string
  ) => {
    const tiers = [1, 2, 3, 4, 5];
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${colorClass}`}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier} className={`grid grid-cols-4 gap-3 items-end p-3 border rounded-lg ${
                prefix === 'vna' ? 'bg-blue-50/50' : 
                prefix === 'vietjet' ? 'bg-red-50/50' : 'bg-gray-50/50'
              }`}>
                <div className={`font-medium ${
                  prefix === 'vna' ? 'text-blue-800' : 
                  prefix === 'vietjet' ? 'text-red-800' : 'text-gray-800'
                }`}>Mức {tier}</div>
                <div className="space-y-1">
                  <Label className="text-xs">Ngưỡng giá (VND)</Label>
                  <Input
                    type="number"
                    value={config[`${prefix}_threshold_${tier}` as keyof PriceConfig] as number}
                    onChange={(e) => handleConfigChange(mode, `${prefix}_threshold_${tier}` as keyof PriceConfig, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Giảm 1 chiều (VND)</Label>
                  <Input
                    type="number"
                    value={config[`${prefix}_discount_ow_${tier}` as keyof PriceConfig] as number}
                    onChange={(e) => handleConfigChange(mode, `${prefix}_discount_ow_${tier}` as keyof PriceConfig, e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Giảm khứ hồi (VND)</Label>
                  <Input
                    type="number"
                    value={config[`${prefix}_discount_rt_${tier}` as keyof PriceConfig] as number}
                    onChange={(e) => handleConfigChange(mode, `${prefix}_discount_rt_${tier}` as keyof PriceConfig, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
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
            <div className="grid grid-cols-4 gap-4">
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Khứ hồi Other (VND)</Label>
                <Input
                  type="number"
                  value={config.round_trip_fee_other}
                  onChange={(e) => handleConfigChange(mode, "round_trip_fee_other", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vietnam Airlines discounts */}
        {renderDiscountTiers(config, mode, 'vna', 'Giảm giá Vietnam Airlines', 'text-blue-700')}

        {/* Vietjet discounts */}
        {renderDiscountTiers(config, mode, 'vietjet', 'Giảm giá Vietjet', 'text-red-700')}

        {/* Other airlines discounts */}
        {renderDiscountTiers(config, mode, 'other', 'Giảm giá Other Airlines', 'text-gray-700')}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
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
