import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  ChevronDown as ChevronDownIcon,
  RotateCcw,
  RotateCw,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PriceConfig } from "@/hooks/usePriceConfigs";

interface FlightSearchData {
  departure: string;
  arrival: string;
  departureDate: string;
  returnDate: string;
  tripType: "OW" | "RT";
  adults: number;
  children: number;
  infants: number;
  oneWayFee: number;
  roundTripFeeVietjet: number;
  roundTripFeeVNA: number;
  roundTripFeeOther: number;
  // VNA thresholds and discounts (5 tiers)
  vnaThreshold1: number;
  vnaDiscountOW1: number;
  vnaDiscountRT1: number;
  vnaThreshold2: number;
  vnaDiscountOW2: number;
  vnaDiscountRT2: number;
  vnaThreshold3: number;
  vnaDiscountOW3: number;
  vnaDiscountRT3: number;
  vnaThreshold4: number;
  vnaDiscountOW4: number;
  vnaDiscountRT4: number;
  vnaThreshold5: number;
  vnaDiscountOW5: number;
  vnaDiscountRT5: number;
  // Vietjet thresholds and discounts (5 tiers)
  vietjetThreshold1: number;
  vietjetDiscountOW1: number;
  vietjetDiscountRT1: number;
  vietjetThreshold2: number;
  vietjetDiscountOW2: number;
  vietjetDiscountRT2: number;
  vietjetThreshold3: number;
  vietjetDiscountOW3: number;
  vietjetDiscountRT3: number;
  vietjetThreshold4: number;
  vietjetDiscountOW4: number;
  vietjetDiscountRT4: number;
  vietjetThreshold5: number;
  vietjetDiscountOW5: number;
  vietjetDiscountRT5: number;
  // Other airlines thresholds and discounts (5 tiers)
  otherThreshold1: number;
  otherDiscountOW1: number;
  otherDiscountRT1: number;
  otherThreshold2: number;
  otherDiscountOW2: number;
  otherDiscountRT2: number;
  otherThreshold3: number;
  otherDiscountOW3: number;
  otherDiscountRT3: number;
  otherThreshold4: number;
  otherDiscountOW4: number;
  otherDiscountRT4: number;
  otherThreshold5: number;
  otherDiscountOW5: number;
  otherDiscountRT5: number;
}

interface FlightSearchFormProps {
  onSearch: (data: FlightSearchData) => void;
  isLoading: boolean;
  customerType?: "page" | "live" | "custom" | null;
  priceConfigs?: Record<string, PriceConfig>;
}

// Airport codes with location names
const airportOptions = [
  { code: "ICN", name: "ICN (Seoul)" },
  { code: "PUS", name: "PUS (Busan)" },
  { code: "TAE", name: "TAE (Daegu)" },
  { code: "HAN", name: "HAN (Hà Nội)" },
  { code: "SGN", name: "SGN (TP Hồ Chí Minh)" },
  { code: "DAD", name: "DAD (Đà Nẵng)" },
  { code: "HPH", name: "HPH (Hải Phòng)" },
  { code: "VCA", name: "VCA (Cần Thơ)" },
  { code: "CXR", name: "CXR (Nha Trang – Cam Ranh)" },
  { code: "DLI", name: "DLI (Đà Lạt)" },
  { code: "VDH", name: "VDH (Đồng Hới – Quảng Bình)" },
  { code: "BMV", name: "BMV (Buôn Ma Thuột)" },
  { code: "VII", name: "VII (Vinh)" },
  { code: "UIH", name: "UIH (Quy Nhơn – Phù Cát)" },
  { code: "THD", name: "THD (Thanh Hóa – Thọ Xuân)" },
  { code: "PQC", name: "PQC (Phú Quốc)" },
  { code: "PXU", name: "PXU (Pleiku)" },
  { code: "HUI", name: "HUI (Huế – Phú Bài)" },
  { code: "VCL", name: "VCL (Tam Kỳ – Chu Lai)" },
  { code: "CAH", name: "CAH (Cà Mau)" },
  { code: "DIN", name: "DIN (Điện Biên)" },
  { code: "VKG", name: "VKG (Rạch Giá)" },
  { code: "TBB", name: "TBB (Tuy Hòa – Phú Yên)" },
  { code: "VDO", name: "VDO (Vân Đồn – Quảng Ninh)" },
];

const koreanAirports = ["ICN", "PUS", "TAE"];

const AirportSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  excludeCodes?: string[];
}> = ({ value, onChange, label, excludeCodes = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const availableOptions = airportOptions.filter((option) => !excludeCodes.includes(option.code));
  const filteredOptions = availableOptions.filter(
    (option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setSelectedIndex(0);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm("");
    setSelectedIndex(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[selectedIndex].code);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.min(selectedIndex + 1, filteredOptions.length - 1);
      setSelectedIndex(newIndex);
      // Scroll to selected item
      if (listRef.current) {
        const selectedElement = listRef.current.children[newIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(newIndex);
      // Scroll to selected item
      if (listRef.current) {
        const selectedElement = listRef.current.children[newIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setSelectedIndex(0);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOptions]);

  const selectedOption = airportOptions.find((option) => option.code === value);
  const displayValue = selectedOption ? selectedOption.name : value;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-left flex items-center justify-between"
        >
          <span>{displayValue}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Gõ mã sân bay..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
              />
            </div>
            <div ref={listRef} className="overflow-y-auto" style={{ height: "360px" }}>
              {filteredOptions.map((option, index) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 text-sm ${
                    index === selectedIndex ? "bg-blue-100" : ""
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FlightSearchForm: React.FC<FlightSearchFormProps> = ({ onSearch, isLoading, customerType: propCustomerType, priceConfigs }) => {
  // Helper function to get config values from database or fallback to defaults
  const getConfigValues = (mode: string) => {
    const config = priceConfigs?.[mode];
    if (config) {
      return {
        oneWayFee: Number(config.one_way_fee),
        roundTripFeeVietjet: Number(config.round_trip_fee_vietjet),
        roundTripFeeVNA: Number(config.round_trip_fee_vna),
        roundTripFeeOther: Number(config.round_trip_fee_other),
        // VNA (5 tiers)
        vnaThreshold1: Number(config.vna_threshold_1),
        vnaDiscountOW1: Number(config.vna_discount_ow_1),
        vnaDiscountRT1: Number(config.vna_discount_rt_1),
        vnaThreshold2: Number(config.vna_threshold_2),
        vnaDiscountOW2: Number(config.vna_discount_ow_2),
        vnaDiscountRT2: Number(config.vna_discount_rt_2),
        vnaThreshold3: Number(config.vna_threshold_3),
        vnaDiscountOW3: Number(config.vna_discount_ow_3),
        vnaDiscountRT3: Number(config.vna_discount_rt_3),
        vnaThreshold4: Number(config.vna_threshold_4),
        vnaDiscountOW4: Number(config.vna_discount_ow_4),
        vnaDiscountRT4: Number(config.vna_discount_rt_4),
        vnaThreshold5: Number(config.vna_threshold_5),
        vnaDiscountOW5: Number(config.vna_discount_ow_5),
        vnaDiscountRT5: Number(config.vna_discount_rt_5),
        // Vietjet (5 tiers)
        vietjetThreshold1: Number(config.vietjet_threshold_1),
        vietjetDiscountOW1: Number(config.vietjet_discount_ow_1),
        vietjetDiscountRT1: Number(config.vietjet_discount_rt_1),
        vietjetThreshold2: Number(config.vietjet_threshold_2),
        vietjetDiscountOW2: Number(config.vietjet_discount_ow_2),
        vietjetDiscountRT2: Number(config.vietjet_discount_rt_2),
        vietjetThreshold3: Number(config.vietjet_threshold_3),
        vietjetDiscountOW3: Number(config.vietjet_discount_ow_3),
        vietjetDiscountRT3: Number(config.vietjet_discount_rt_3),
        vietjetThreshold4: Number(config.vietjet_threshold_4),
        vietjetDiscountOW4: Number(config.vietjet_discount_ow_4),
        vietjetDiscountRT4: Number(config.vietjet_discount_rt_4),
        vietjetThreshold5: Number(config.vietjet_threshold_5),
        vietjetDiscountOW5: Number(config.vietjet_discount_ow_5),
        vietjetDiscountRT5: Number(config.vietjet_discount_rt_5),
        // Other (5 tiers)
        otherThreshold1: Number(config.other_threshold_1),
        otherDiscountOW1: Number(config.other_discount_ow_1),
        otherDiscountRT1: Number(config.other_discount_rt_1),
        otherThreshold2: Number(config.other_threshold_2),
        otherDiscountOW2: Number(config.other_discount_ow_2),
        otherDiscountRT2: Number(config.other_discount_rt_2),
        otherThreshold3: Number(config.other_threshold_3),
        otherDiscountOW3: Number(config.other_discount_ow_3),
        otherDiscountRT3: Number(config.other_discount_rt_3),
        otherThreshold4: Number(config.other_threshold_4),
        otherDiscountOW4: Number(config.other_discount_ow_4),
        otherDiscountRT4: Number(config.other_discount_rt_4),
        otherThreshold5: Number(config.other_threshold_5),
        otherDiscountOW5: Number(config.other_discount_ow_5),
        otherDiscountRT5: Number(config.other_discount_rt_5),
      };
    }
    // Fallback defaults
    return {
      oneWayFee: 0,
      roundTripFeeVietjet: 0,
      roundTripFeeVNA: 0,
      roundTripFeeOther: 0,
      vnaThreshold1: 0,
      vnaDiscountOW1: 0,
      vnaDiscountRT1: 0,
      vnaThreshold2: 0,
      vnaDiscountOW2: 0,
      vnaDiscountRT2: 0,
      vnaThreshold3: 0,
      vnaDiscountOW3: 0,
      vnaDiscountRT3: 0,
      vnaThreshold4: 0,
      vnaDiscountOW4: 0,
      vnaDiscountRT4: 0,
      vnaThreshold5: 0,
      vnaDiscountOW5: 0,
      vnaDiscountRT5: 0,
      vietjetThreshold1: 0,
      vietjetDiscountOW1: 0,
      vietjetDiscountRT1: 0,
      vietjetThreshold2: 0,
      vietjetDiscountOW2: 0,
      vietjetDiscountRT2: 0,
      vietjetThreshold3: 0,
      vietjetDiscountOW3: 0,
      vietjetDiscountRT3: 0,
      vietjetThreshold4: 0,
      vietjetDiscountOW4: 0,
      vietjetDiscountRT4: 0,
      vietjetThreshold5: 0,
      vietjetDiscountOW5: 0,
      vietjetDiscountRT5: 0,
      otherThreshold1: 0,
      otherDiscountOW1: 0,
      otherDiscountRT1: 0,
      otherThreshold2: 0,
      otherDiscountOW2: 0,
      otherDiscountRT2: 0,
      otherThreshold3: 0,
      otherDiscountOW3: 0,
      otherDiscountRT3: 0,
      otherThreshold4: 0,
      otherDiscountOW4: 0,
      otherDiscountRT4: 0,
      otherThreshold5: 0,
      otherDiscountOW5: 0,
      otherDiscountRT5: 0,
    };
  };

  const defaultConfig = getConfigValues('page');

  const [formData, setFormData] = useState<FlightSearchData>({
    departure: "ICN",
    arrival: "HAN",
    departureDate: "",
    returnDate: "",
    tripType: "RT",
    adults: 1,
    children: 0,
    infants: 0,
    ...defaultConfig,
  });

  // State for DatePicker
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [returnDate, setReturnDate] = useState<Date | undefined>();
  const [departureOpen, setDepartureOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const [customerType, setCustomerType] = useState<"page" | "live">("page");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [discountSectionOpen, setDiscountSectionOpen] = useState(false);

  // Refs for debounce / state sync / throttle
  const departureTimerRef = useRef<number | null>(null);
  const formDataRef = useRef(formData);
  const openThrottleRef = useRef<number>(0);
  const returnDateRef = useRef<HTMLInputElement>(null);

  // Keep a ref copy of latest formData for timers/closures
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Load config from database when priceConfigs changes
  useEffect(() => {
    if (priceConfigs && Object.keys(priceConfigs).length > 0) {
      const mode = isCustomMode ? 'custom' : customerType;
      const configValues = getConfigValues(mode);
      setFormData((prev) => ({
        ...prev,
        ...configValues,
      }));
    }
  }, [priceConfigs]);

  // Update customer type when prop changes
  useEffect(() => {
    if (propCustomerType === "custom") {
      setIsCustomMode(true);
      const configValues = getConfigValues('custom');
      setFormData((prev) => ({
        ...prev,
        ...configValues,
      }));
    } else if (propCustomerType === "page" || propCustomerType === "live") {
      setCustomerType(propCustomerType);
      setIsCustomMode(false);
      const configValues = getConfigValues(propCustomerType);
      setFormData((prev) => ({
        ...prev,
        ...configValues,
      }));
    }
  }, [propCustomerType, priceConfigs]);

  // Set default departure date to today
  useEffect(() => {
    const todayDate = new Date();
    const today = format(todayDate, "yyyy-MM-dd");
    setFormData((prev) => ({ ...prev, departureDate: today }));
    setDepartureDate(todayDate);
  }, []);

  // Sync Date objects with string values
  useEffect(() => {
    if (departureDate) {
      const dateStr = format(departureDate, "yyyy-MM-dd");
      setFormData((prev) => ({ ...prev, departureDate: dateStr }));
    }
  }, [departureDate]);

  useEffect(() => {
    if (returnDate) {
      const dateStr = format(returnDate, "yyyy-MM-dd");
      setFormData((prev) => ({ ...prev, returnDate: dateStr }));
    } else {
      setFormData((prev) => ({ ...prev, returnDate: "" }));
    }
  }, [returnDate]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (departureTimerRef.current) {
        window.clearTimeout(departureTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(formData);
  };

  const handleSwapAirports = () => {
    setFormData((prev) => ({
      ...prev,
      departure: prev.arrival,
      arrival: prev.departure,
    }));
  };

  // Handle departure date change
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
    setDepartureOpen(false);

    // Reset return date if it's before departure date
    if (date && returnDate && returnDate < date) {
      setReturnDate(undefined);
    }

    // Open return date picker for round trip
    if (date && formData.tripType === "RT") {
      setTimeout(() => {
        setReturnOpen(true);
      }, 100);
    }
  };

  // Handle return date change
  const handleReturnDateChange = (date: Date | undefined) => {
    setReturnDate(date);
    setReturnOpen(false);
  };

  // Reset departure date and return date to today
  const handleResetDepartureDate = () => {
    const todayDate = new Date();
    setDepartureDate(todayDate);
    if (formData.tripType === "RT") {
      setReturnDate(todayDate);
    }
  };

  const adjustFee = (type: "oneWay" | "roundTripVietjet" | "roundTripVNA", direction: "up" | "down") => {
    if (!isCustomMode) return; // Only allow adjustment in custom mode

    setFormData((prev) => {
      const key =
        type === "oneWay" ? "oneWayFee" : type === "roundTripVietjet" ? "roundTripFeeVietjet" : "roundTripFeeVNA";
      // @ts-ignore
      const currentValue = prev[key];
      const newValue = direction === "up" ? currentValue + 5000 : Math.max(0, currentValue - 5000);
      // @ts-ignore
      return { ...prev, [key]: newValue };
    });
  };

  const handleCustomerTypeChange = (type: "page" | "live") => {
    setCustomerType(type);
    setIsCustomMode(false); // Turn off custom mode when selecting preset customer type
    const configValues = getConfigValues(type);
    setFormData((prev) => ({
      ...prev,
      ...configValues,
    }));
  };

  const handleCustomModeToggle = () => {
    const wasInCustomMode = isCustomMode;
    setIsCustomMode(!isCustomMode);

    // When switching TO custom mode, load custom config from database
    if (!wasInCustomMode) {
      const configValues = getConfigValues('custom');
      setFormData((prev) => ({
        ...prev,
        ...configValues,
      }));
    }
  };

  // Reset form to initial state (except fees)
  const handleReset = () => {
    const todayDate = new Date();
    const today = format(todayDate, "yyyy-MM-dd");
    setFormData((prev) => ({
      ...prev,
      departure: "ICN",
      arrival: "HAN",
      departureDate: today,
      returnDate: "",
      tripType: "RT",
      adults: 1,
      children: 0,
      infants: 0,
      // Keep oneWayFee, roundTripFeeVietjet and roundTripFeeVNA unchanged
    }));
    setDepartureDate(todayDate);
    setReturnDate(undefined);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get excluded codes for destination based on departure
  const getExcludedCodes = () => {
    const excluded = [formData.departure]; // Exclude same airport

    // If departure is Korean airport, exclude all Korean airports from destination
    if (koreanAirports.includes(formData.departure)) {
      excluded.push(...koreanAirports.filter((code) => code !== formData.departure));
    }

    return excluded;
  };

  // Get fee text color based on customer type and mode
  const getFeeTextColor = () => {
    if (isCustomMode) {
      return "text-green-600"; // Green for custom mode
    } else if (customerType === "page") {
      return "text-blue-600"; // Blue for PAGE customers
    } else {
      return "text-red-600"; // Red for LIVE customers
    }
  };

  // Custom formatter for calendar caption
  const customFormatters = {
    formatCaption: (date: Date) => {
      const month = format(date, "MM");
      const year = format(date, "yyyy");
      return `Th${month} ${year}`;
    },
  };

  // Get minimum date (today)
  const today = format(new Date(), "yyyy-MM-dd");
  // Get minimum return date (departure date or today, whichever is later)
  const minReturnDate = formData.departureDate > today ? formData.departureDate : today;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-6 mb-6">
      {/* Header and Customer Type Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Tìm chuyến bay</h2>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Phí xuất vé:</h3>

          {/* Customer Type Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => handleCustomerTypeChange("page")}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${
                customerType === "page" && !isCustomMode
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              PAGE
            </button>
            <button
              type="button"
              onClick={() => handleCustomerTypeChange("live")}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${
                customerType === "live" && !isCustomMode
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              LIVE
            </button>
            <button
              type="button"
              onClick={handleCustomModeToggle}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-xs sm:text-sm ${
                isCustomMode ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              TÙY CHỈNH
            </button>
          </div>

          {/* Fee Inputs */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">1 chiều</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.oneWayFee}
                  onChange={(e) =>
                    isCustomMode &&
                    setFormData((prev) => ({ ...prev, oneWayFee: Math.max(0, parseInt(e.target.value) || 0) }))
                  }
                  className={`w-16 sm:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-bold ${
                    !isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee("oneWay", "up")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee("oneWay", "down")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">KH VJ</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.roundTripFeeVietjet}
                  onChange={(e) =>
                    isCustomMode &&
                    setFormData((prev) => ({
                      ...prev,
                      roundTripFeeVietjet: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className={`w-16 sm:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-bold ${
                    !isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee("roundTripVietjet", "up")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee("roundTripVietjet", "down")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">KH VNA</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={formData.roundTripFeeVNA}
                  onChange={(e) =>
                    isCustomMode &&
                    setFormData((prev) => ({ ...prev, roundTripFeeVNA: Math.max(0, parseInt(e.target.value) || 0) }))
                  }
                  className={`w-16 sm:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm font-bold ${
                    !isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${getFeeTextColor()}`}
                  min="0"
                  disabled={!isCustomMode}
                />
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => adjustFee("roundTripVNA", "up")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-tr-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustFee("roundTripVNA", "down")}
                    disabled={!isCustomMode}
                    className={`px-1 py-0.5 border border-gray-300 rounded-br-lg ${
                      isCustomMode ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 cursor-not-allowed"
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Configuration - Collapsible */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Giảm giá theo mức vé</h4>
              <button
                type="button"
                onClick={() => setDiscountSectionOpen(!discountSectionOpen)}
                className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                <Settings className="w-3 h-3" />
                <span>{discountSectionOpen ? "Ẩn" : "Hiện"}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${discountSectionOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {discountSectionOpen && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* VNA Discounts */}
                <div>
                  <h5 className="w-full text-xs font-medium text-blue-700 mb-2">VNA</h5>
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <div key={tier} className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">≥</span>
                        <input
                          type="number"
                          value={formData[`vnaThreshold${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vnaThreshold${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-14 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">trừ</span>
                        <input
                          type="number"
                          value={formData[`vnaDiscountOW${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vnaDiscountOW${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">/</span>
                        <input
                          type="number"
                          value={formData[`vnaDiscountRT${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vnaDiscountRT${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* VIETJET Discounts */}
                <div>
                  <h5 className="w-full text-xs font-medium text-red-700 mb-2">VIETJET</h5>
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <div key={tier} className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">≥</span>
                        <input
                          type="number"
                          value={formData[`vietjetThreshold${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vietjetThreshold${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-14 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">trừ</span>
                        <input
                          type="number"
                          value={formData[`vietjetDiscountOW${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vietjetDiscountOW${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">/</span>
                        <input
                          type="number"
                          value={formData[`vietjetDiscountRT${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`vietjetDiscountRT${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* OTHER Discounts */}
                <div>
                  <h5 className="w-full text-xs font-medium text-gray-700 mb-2">OTHER</h5>
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <div key={tier} className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">≥</span>
                        <input
                          type="number"
                          value={formData[`otherThreshold${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`otherThreshold${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-14 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">trừ</span>
                        <input
                          type="number"
                          value={formData[`otherDiscountOW${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`otherDiscountOW${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                        <span className="text-xs text-gray-600">/</span>
                        <input
                          type="number"
                          value={formData[`otherDiscountRT${tier}` as keyof typeof formData] as number}
                          onChange={(e) =>
                            isCustomMode &&
                            setFormData((prev) => ({
                              ...prev,
                              [`otherDiscountRT${tier}`]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className={`w-12 px-1 py-0.5 border border-gray-300 rounded text-xs ${!isCustomMode ? "bg-gray-100 cursor-not-allowed" : ""} ${getFeeTextColor()}`}
                          min="0"
                          disabled={!isCustomMode}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main form layout - responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* Column 1: Trip Type and Reset Button */}
          <div className="md:col-span-2 flex md:flex-col gap-3 md:gap-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại vé</label>
              <div className="flex md:flex-col gap-3 md:gap-0 md:space-y-2 mb-3">
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    value="OW"
                    checked={formData.tripType === "OW"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tripType: e.target.value as "OW" | "RT" }))}
                    className="mr-2"
                  />
                  Một chiều
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="radio"
                    value="RT"
                    checked={formData.tripType === "RT"}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tripType: e.target.value as "OW" | "RT" }))}
                    className="mr-2"
                  />
                  Khứ hồi
                </label>
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              className="md:w-1/2 bg-orange-500 text-white py-2 px-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-xs flex items-center justify-center gap-1 whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              NHẬP LẠI
            </button>
          </div>

          {/* Column 2: Airports and Dates */}
          <div className="md:col-span-7 space-y-3">
            {/* Airports Row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
              <AirportSelect
                value={formData.departure}
                onChange={(value) => setFormData((prev) => ({ ...prev, departure: value }))}
                label="Nơi đi"
              />

              <AirportSelect
                value={formData.arrival}
                onChange={(value) => setFormData((prev) => ({ ...prev, arrival: value }))}
                label="Nơi đến"
                excludeCodes={getExcludedCodes()}
              />

              {/* Swap button positioned between the two fields */}
              <button
                type="button"
                onClick={handleSwapAirports}
                className="absolute left-1/2 top-8 transform -translate-x-1/2 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors z-10"
              >
                ⇄
              </button>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700">Ngày đi</label>
                  <button
                    type="button"
                    onClick={handleResetDepartureDate}
                    className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors"
                    title="Reset ngày đi về hôm nay"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
                <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal px-2 sm:px-3 py-2 h-auto text-xs sm:text-sm",
                        !departureDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày đi</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={handleDepartureDateChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      defaultMonth={departureDate}
                      initialFocus
                      locale={vi}
                      formatters={customFormatters}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Only show return date when round trip is selected */}
              {formData.tripType === "RT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày về</label>
                  <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal px-2 sm:px-3 py-2 h-auto text-xs sm:text-sm",
                          !returnDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày về</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={handleReturnDateChange}
                        disabled={(date) => {
                          const minDate = departureDate || new Date(new Date().setHours(0, 0, 0, 0));
                          return date < minDate;
                        }}
                        defaultMonth={departureDate}
                        initialFocus
                        locale={vi}
                        formatters={customFormatters}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Passenger counts and Search button */}
          <div className="md:col-span-3 space-y-2">
            {/* Adults and Children/Infants - responsive */}
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Người lớn</label>
                <select
                  value={formData.adults}
                  onChange={(e) => setFormData((prev) => ({ ...prev, adults: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trẻ em</label>
                <select
                  value={formData.children}
                  onChange={(e) => setFormData((prev) => ({ ...prev, children: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  {[0, 1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Em bé</label>
                <select
                  value={formData.infants}
                  onChange={(e) => setFormData((prev) => ({ ...prev, infants: parseInt(e.target.value) }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                >
                  {[0, 1, 2, 3].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm text-white ${
                  isCustomMode
                    ? "bg-green-500 hover:bg-green-600"
                    : customerType === "page"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isLoading ? "TÌM KIẾM..." : "TÌM KIẾM"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchForm;
