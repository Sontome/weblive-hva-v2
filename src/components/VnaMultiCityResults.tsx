import React, { useState } from "react";
import { Copy, ChevronDown, Users, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { extractMultiCityLegs } from "@/services/vnaMultiCityService";
import { useRouteDiscounts } from "@/hooks/useRouteDiscounts";
import { calculateVnaRtPrice, type VnaRtPricingConfig } from "@/lib/vnaPricing";

interface Props {
  results: any[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  /** VNA round-trip fee/discount config (same settings as VNA RT search). */
  priceConfig?: VnaRtPricingConfig;
  /** Same behavior as the VNA card student-fare button: switch search type to STU and re-search. */
  canSearchStudentFares?: boolean;
  onSearchStudentFares?: () => void;
}

const formatPriceForCopy = (price: number) =>
  new Intl.NumberFormat("de-DE").format(Math.round(price / 100) * 100);

const formatShortDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const [day, month] = dateStr.split("/");
  return `${day}/${month}`;
};

const VnaMultiCityResults: React.FC<Props> = ({ results, isLoading, error, hasSearched, priceConfig, canSearchStudentFares, onSearchStudentFares }) => {
  const { getDiscount: getRouteDiscount } = useRouteDiscounts();
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy thông tin chuyến bay");
    } catch {
      toast.error("Không thể copy, vui lòng thử lại");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tìm vé VNA nhiều chặng...</div>;
  }
  if (!hasSearched) return null;
  if (error || results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">{error || "Không có chuyến bay VNA nhiều chặng"}</div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {results.map((row, idx) => {
        const legs = extractMultiCityLegs(row);
        const info = row?.["thông_tin_chung"] || {};
        const basePrice = Number(info.giá_vé);
        const finalPrice =
          priceConfig && Number.isFinite(basePrice)
            ? calculateVnaRtPrice(
                basePrice,
                priceConfig,
                legs.map((l) => ({ origin: l?.nơi_đi, destination: l?.nơi_đến })),
                getRouteDiscount,
              )
            : basePrice;

        const classSummary = legs.map((l) => l?.loại_vé).filter(Boolean).join("-");
        const baggageType = info.hành_lý_vna;
        const isStudent = baggageType === "STU";
        const baggageLine =
          baggageType === "VFR" || baggageType === "STU"
            ? `VNairlines ${isStudent ? "DHS " : ""}10kg xách tay, 46kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`
            : `VNairlines 10kg xách tay, 23kg ký gửi, giá vé = ${formatPriceForCopy(finalPrice)}w`;
        const copyTemplate = [
          ...legs.map(
            (leg, i) =>
              `Chặng ${i + 1}: ${leg?.nơi_đi}-${leg?.nơi_đến} ${leg?.giờ_cất_cánh} ngày ${formatShortDate(leg?.ngày_cất_cánh)}`,
          ),
          baggageLine,
        ].join("\n");

        return (
          <div key={info.idx ?? idx} className="relative bg-white rounded-lg shadow-md border flex flex-col">
            {canSearchStudentFares && onSearchStudentFares && (
              <button
                onClick={onSearchStudentFares}
                title="Check giá học sinh"
                aria-label="Check giá học sinh"
                className="absolute top-1 right-1 z-10 inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-md border border-indigo-300 transition-colors"
              >
                <GraduationCap className="h-3 w-3" />
              </button>
            )}
            <div className="p-2 flex-1 flex flex-col">
              <div className="space-y-1 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded text-xs font-medium text-white bg-blue-500">VNA</span>
                  <div className="text-base font-bold text-gray-800">{formatPriceForCopy(finalPrice)} KRW</div>
                </div>
                <div className="text-xs text-gray-600 font-medium leading-tight">
                  Nhiều chặng: {classSummary}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Users className="w-3 h-3 mr-1" />
                  Còn {info.số_ghế_còn} ghế
                  <button
                    onClick={() => setExpandedDetails((p) => ({ ...p, [idx]: !p[idx] }))}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 ml-2"
                  >
                    <ChevronDown
                      className={`w-3 h-3 mr-1 transition-transform ${expandedDetails[idx] ? "rotate-180" : ""}`}
                    />
                    Chi tiết
                  </button>
                </div>
                {expandedDetails[idx] && (
                  <div className="text-xs text-gray-600 space-y-0.5 mt-1 p-1.5 bg-gray-50 rounded">
                    <div>Giá gốc: {formatPriceForCopy(parseInt(info.giá_vé_gốc))} KRW</div>
                    <div>Phí nhiên liệu: {formatPriceForCopy(parseInt(info.phí_nhiên_liệu))} KRW</div>
                    {priceConfig && <div>Phí xuất vé: {formatPriceForCopy(priceConfig.roundTripFeeVNA)} KRW</div>}
                    {legs.map((leg, i) => {
                      const stops = Number(leg?.số_điểm_dừng || 0);
                      return (
                        <div key={i}>
                          Chặng {i + 1}: {leg?.id} · {leg?.nơi_đi} → {leg?.nơi_đến} · {leg?.giờ_cất_cánh} →{" "}
                          {leg?.giờ_hạ_cánh}
                          {leg?.ngày_hạ_cánh && leg.ngày_hạ_cánh !== leg.ngày_cất_cánh
                            ? ` (${formatShortDate(leg.ngày_hạ_cánh)})`
                            : ""}{" "}
                          · Hạng {leg?.loại_vé} ·{" "}
                          {stops > 0
                            ? `${stops} điểm dừng${leg?.điểm_dừng_1 ? `: ${leg.điểm_dừng_1}` : ""}${leg?.điểm_dừng_2 ? `, ${leg.điểm_dừng_2}` : ""}`
                            : "Bay thẳng"}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Copy template — same style as basic VNA card */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-medium text-gray-700">Thông tin gửi khách</h5>
                  <button
                    onClick={() => copyToClipboard(copyTemplate)}
                    className="flex items-center space-x-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-100 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="text-xs font-medium">Copy</span>
                  </button>
                </div>
                <div className="bg-gray-50 p-2 rounded font-sans font-medium whitespace-pre-line min-h-[60px] text-xl text-green-700">
                  {copyTemplate}
                </div>
              </div>

              {/* Hold button — same look as VNA, disabled until developed */}
              <div className="mt-auto pt-2 flex justify-end">
                <button
                  disabled
                  title="Chức năng giữ vé nhiều chặng đang được phát triển"
                  className="flex items-center space-x-1 bg-blue-500 text-white px-2 py-1 rounded text-xs opacity-50 cursor-not-allowed"
                >
                  <span className="text-xs font-medium">Giữ Vé</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VnaMultiCityResults;
