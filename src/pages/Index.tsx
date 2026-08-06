
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FlightSearchForm from '../components/FlightSearchForm';
import FlightResults from '../components/FlightResults';
import AirlineFilter from '../components/AirlineFilter';
import FlightTypeFilter from '../components/FlightTypeFilter';
import LowFareChart from '../components/LowFareChart';
import { CustomerTypeModal } from '../components/CustomerTypeModal';
import { EmailTicketModal } from '../components/EmailTicketModal';
import { PNRCheckModal } from '../components/PNRCheckModal';
import { CheckinModal } from '../components/CheckinModal';
import { RepriceModal } from '../components/RepriceModal';
import { VJTicketModal } from '../components/VJTicketModal';
import { VNATicketModal } from '../components/VNATicketModal';
import { OtherTicketModal } from '../components/OtherTicketModal';
import { SunPQTicketModal } from '../components/SunPQTicketModal';
import { AddPNRModal } from '../components/AddPNRModal';
import { CurrentOnlineStatus } from '../components/attendance/CurrentOnlineStatus';
import { EmployeeIdentityBadge } from '../components/attendance/EmployeeIdentityBadge';
import { Button } from '@/components/ui/button';
import { searchAllFlights } from '../services/flightService';
import { searchLowFare, LowFareDay } from '../services/lowfareService';
import { shouldSkipVietjet } from '../utils/flightValidation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePriceConfigs } from '@/hooks/usePriceConfigs';
import { SearchHistorySidebar } from '../components/searchCache/SearchHistorySidebar';
import { CacheWarningDialog } from '../components/searchCache/CacheWarningDialog';
import {
  buildSearchKey,
  cleanupCache,
  extractCheapest,
  findValidSummaryByKey,
  loadSnapshotDetail,
  minutesAgo,
  saveSnapshot,
} from '@/lib/searchCache/cache';
import type { AirlineStatus, SnapshotSummary } from '@/lib/searchCache/types';

interface FlightSearchData {
  departure: string;
  arrival: string;
  departureDate: string;
  returnDate: string;
  tripType: 'OW' | 'RT';
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

const Index = () => {
  const navigate = useNavigate();
  const { configs: priceConfigs, isLoading: configsLoading } = usePriceConfigs();
  const [searchResults, setSearchResults] = useState([]);
  const [allResults, setAllResults] = useState([]); // Store all results for filtering
  const [vjetResults, setVjetResults] = useState([]);
  const [vnaResults, setVnaResults] = useState([]);
  const [sunpqResults, setSunpqResults] = useState<any[]>([]);
  const [sunpqLowerFare, setSunpqLowerFare] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAirline, setSelectedAirline] = useState<'all' | 'VJ' | 'VNA'>('all');
  const [selectedFlightType, setSelectedFlightType] = useState<'all' | 'direct' | 'connecting'>('all');
  const [searchData, setSearchData] = useState<FlightSearchData | null>(null);
  const [apiStatus, setApiStatus] = useState({ vj: 'pending', vna: 'pending' });
  const [searchMessages, setSearchMessages] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [vietjetDomesticError, setVietjetDomesticError] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerType, setCustomerType] = useState<'page' | 'live' | 'custom' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPNRModal, setShowPNRModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRepriceModal, setShowRepriceModal] = useState(false);
  const [showVJTicketModal, setShowVJTicketModal] = useState(false);
  const [vjTicketInitialPNR, setVjTicketInitialPNR] = useState<string | undefined>(undefined);
  const [showVNATicketModal, setShowVNATicketModal] = useState(false);
  const [vnaTicketInitialPNR, setVnaTicketInitialPNR] = useState<string | undefined>(undefined);
  const [showOtherTicketModal, setShowOtherTicketModal] = useState(false);
  const [showSunPQTicketModal, setShowSunPQTicketModal] = useState(false);
  const [showAddPNRModal, setShowAddPNRModal] = useState(false);
  const [onlineRefreshKey, setOnlineRefreshKey] = useState(0);
  
  // Low fare chart state
  const [lowFareDeparture, setLowFareDeparture] = useState<LowFareDay[]>([]);
  const [lowFareReturn, setLowFareReturn] = useState<LowFareDay[]>([]);
  const [isLoadingLowFare, setIsLoadingLowFare] = useState(false);
  const [lastSearchData, setLastSearchData] = useState<FlightSearchData | null>(null);

  // ----- Search snapshot cache (enhancement layer, does not alter search flow) -----
  const [showHistory, setShowHistory] = useState(false);
  const [cachedInfo, setCachedInfo] = useState<{ id: string; createdAt: number } | null>(null);
  const [cacheWarning, setCacheWarning] = useState<{
    summary: SnapshotSummary;
    pending: FlightSearchData;
  } | null>(null);
  const latestSearchKeyRef = useRef<string>('');

  useEffect(() => {
    void cleanupCache();
  }, []);

  const buildKeyParts = (data: FlightSearchData) => ({
    origin: data.departure,
    destination: data.arrival,
    depart: data.departureDate,
    return: data.returnDate,
    adult: data.adults,
    child: data.children,
    infant: data.infants,
    cabin: '',
    tripType: data.tripType,
  });

  const handleViewSnapshot = async (summary: SnapshotSummary) => {
    const detail = await loadSnapshotDetail(summary.id);
    if (!detail) {
      toast.error('Không tải được kết quả đã lưu');
      return;
    }
    latestSearchKeyRef.current = '';
    const extra = (detail.extra ?? {}) as Record<string, unknown>;
    setShowHistory(false);
    setIsLoading(true);
    setHasSearched(true);
    await new Promise((r) => setTimeout(r, 300));
    setIsLoading(false);
    setHasSearched(true);
    setVnaResults((detail.vnResult as any[]) || []);
    setVjetResults((detail.vjResult as any[]) || []);
    setSunpqResults((detail.sunResult as any[]) || []);
    setSunpqLowerFare(extra.sunpqLowerFare ?? null);
    setSearchData(detail.fullSearchRequest as FlightSearchData);
    setApiStatus((extra.apiStatus as { vj: string; vna: string }) || { vj: 'success', vna: 'success' });
    setSearchMessages([]);
    setLowFareDeparture((extra.lowFareDeparture as LowFareDay[]) || []);
    setLowFareReturn((extra.lowFareReturn as LowFareDay[]) || []);
    setCachedInfo({ id: detail.id, createdAt: detail.createdAt });
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsLoggedIn(true);
      setIsCheckingAuth(false);
      setShowCustomerModal(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const playTingSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play sound:', error);
    }
  };

  // Bỏ hết logic applyFilters(), chỉ combine kết quả
  const combineResults = () => {
    console.log('=== COMBINE RESULTS DEBUG ===');
    console.log('VjetResults count:', vjetResults.length);
    console.log('VnaResults count:', vnaResults.length);
    
    const combinedResults = [...vjetResults, ...vnaResults];
    console.log('Combined results count:', combinedResults.length);
    
    setSearchResults(combinedResults);
    setAllResults(combinedResults);
  };

  // Fetch low fare data from VietJet
  const fetchLowFareData = async (data: FlightSearchData) => {
    setIsLoadingLowFare(true);
    setLowFareDeparture([]);
    setLowFareReturn([]);
    
    try {
      const result = await searchLowFare(
        data.departure,
        data.arrival,
        data.tripType,
        data.departureDate,
        data.returnDate
      );
      
      if (result.status_code === '200' && result.body) {
        setLowFareDeparture(result.body.chiều_đi || []);
        setLowFareReturn(result.body.chiều_về || []);
      }
    } catch (error) {
      console.error('Error fetching low fare data:', error);
    } finally {
      setIsLoadingLowFare(false);
    }
  };

  // Handle search with selected dates from low fare chart
  const handleSearchWithDates = (departureDate: string, returnDate: string) => {
    if (!lastSearchData) return;
    
    const newSearchData: FlightSearchData = {
      ...lastSearchData,
      departureDate,
      returnDate,
      tripType: returnDate ? 'RT' : 'OW',
    };
    
    handleSearch(newSearchData);
  };


  const handleSearch = async (searchData: FlightSearchData) => {
    console.log('Searching with data:', searchData);
    setCachedInfo(null);
    const snapshotKeyParts = buildKeyParts(searchData);
    const snapshotKey = buildSearchKey(snapshotKeyParts);
    latestSearchKeyRef.current = snapshotKey;
    const captured = {
      vj: [] as any[],
      vna: [] as any[],
      sun: [] as any[],
      lowerFare: null as any,
      statusVJ: 'pending' as AirlineStatus,
      statusVN: 'pending' as AirlineStatus,
      statusSUN: 'pending' as AirlineStatus,
    };
    setIsLoading(true);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSunpqResults([]);
    setSunpqLowerFare(null);
    setSearchData(searchData);
    setLastSearchData(searchData);
    setApiStatus({ vj: 'pending', vna: 'pending' });
    setSearchMessages([]);
    setHasSearched(true);
    
    const skipVietjet = shouldSkipVietjet(searchData.departure, searchData.arrival);
    setVietjetDomesticError(skipVietjet);
    
    // Fetch low fare data (don't wait for it to complete)
    fetchLowFareData(searchData);

    let completedAPIs = 0;
    const totalAPIs = 3;

    const checkIfShouldStopLoading = () => {
      completedAPIs++;
      console.log(`Completed APIs: ${completedAPIs}/${totalAPIs}`);
      
      if (completedAPIs === totalAPIs) {
        console.log('Both APIs completed, stopping loading');
        setIsLoading(false);
        // Snapshot only after every airline finished and conditions did not change
        const allFailed =
          captured.statusVJ === 'error' && captured.statusVN === 'error' && captured.statusSUN === 'error';
        if (latestSearchKeyRef.current === snapshotKey && !allFailed) {
          void saveSnapshot({
            keyParts: snapshotKeyParts,
            fullSearchRequest: searchData,
            vnResult: captured.vna,
            vjResult: captured.vj,
            sunResult: captured.sun,
            extra: {
              sunpqLowerFare: captured.lowerFare,
              apiStatus: { vj: captured.statusVJ, vna: captured.statusVN },
            },
            statusVN: captured.statusVN,
            statusVJ: captured.statusVJ,
            statusSUN: captured.statusSUN,
            cheapestVN: extractCheapest(captured.vna, ['giá_vé', 'giá_vé_gốc']),
            cheapestVJ: extractCheapest(captured.vj, ['giá_vé', 'giá_vé_gốc']),
            cheapestSUN: extractCheapest(captured.sun, ['giá_vé', 'giá_vé_gốc', 'tổng_giá', 'giá']),
          });
        }
      }
    };

    const onVietJetResult = (result: any) => {
      console.log('=== VIETJET RESULT DEBUG ===');
      console.log('VietJet result received:', result);
      
      if (result.isDomesticError) {
        setVietjetDomesticError(true);
        setApiStatus(prev => ({ ...prev, vj: 'domestic_error' }));
        captured.statusVJ = 'domestic_error';
        toast.error(result.error, {
          style: {
            color: 'red',
            fontWeight: 'bold'
          }
        });
        checkIfShouldStopLoading();
        return;
      }
      
      playTingSound();
      
      if (result.status_code === 200 && result.body && result.body.length > 0) {
        console.log('VietJet flights from API:', result.body.length);
        console.log('Adding all VietJet flights without filtering');
        const freebag = result.freebag || { 'chiều_đi': false, 'chiều_về': false };
        const vjBody = result.body.map((f: any) => ({ ...f, freebag }));
        setVjetResults(vjBody);
        setApiStatus(prev => ({ ...prev, vj: 'success' }));
        captured.vj = vjBody;
        captured.statusVJ = 'success';
        
        const flightTypeText = result.flightType === 'direct' ? 'bay thẳng' : 'nối chuyến';
        toast.success(`Tìm thấy ${result.body.length} chuyến bay VietJet (${flightTypeText})`);
      } else if (result.status_code === 404) {
        setApiStatus(prev => ({ ...prev, vj: 'no_flights' }));
        captured.statusVJ = 'no_flights';
        setSearchMessages(prev => [...prev, 'Không có chuyến bay VietJet']);
        toast.info('Không có chuyến bay VietJet cho tuyến này');
      } else {
        setApiStatus(prev => ({ ...prev, vj: 'error' }));
        captured.statusVJ = 'error';
        setSearchMessages(prev => [...prev, 'Không có chuyến bay VietJet']);
        toast.error('Lỗi tìm kiếm VietJet');
      }
      
      checkIfShouldStopLoading();
    };

    const onVNAResult = (result: any) => {
      console.log('=== VNA RESULT DEBUG ===');
      console.log('VNA result received:', result);
      console.log('VNA flights from API:', result.body ? result.body.length : 0);
      
      playTingSound();
      
      if (result.status_code === 200 && result.body && result.body.length > 0) {
        console.log('Adding all VNA flights without filtering');
        setVnaResults(result.body);
        setApiStatus(prev => ({ ...prev, vna: 'success' }));
        captured.vna = result.body;
        captured.statusVN = 'success';
        
        // Kiểm tra có chuyến bay thẳng hay không
        const hasDirectFlights = result.body.some((flight: any) => {
          const outbound = flight['chiều_đi'];
          const inbound = flight['chiều_về'];
          
          const isDirectOutbound = outbound && outbound.số_điểm_dừng === '0';
          const isDirectInbound = !inbound || inbound.số_điểm_dừng === '0';
          
          return isDirectOutbound && isDirectInbound;
        });
        
        console.log('Has direct flights:', hasDirectFlights);
        
        // Tự động tick chọn "Bay thẳng" nếu có chuyến bay thẳng, nếu không thì "Tất cả"
        if (hasDirectFlights) {
          setSelectedFlightType('direct');
          console.log('Auto-selected flight type: direct');
        } else {
          setSelectedFlightType('all');
          console.log('Auto-selected flight type: all');
        }
        
        const flightTypeText = result.flightType === 'direct' ? 'bay thẳng' : 'nối chuyến';
        toast.success(`Tìm thấy ${result.body.length} chuyến bay Vietnam Airlines (${flightTypeText})`);
      } else if (result.status_code === 404) {
        console.log('VNA: No flights found, setting empty results');
        setVnaResults([]); // Set empty array to ensure UI displays the no flights message
        setApiStatus(prev => ({ ...prev, vna: 'no_flights' }));
        captured.statusVN = 'no_flights';
        toast.info('Không có chuyến bay Vietnam Airlines cho tuyến này');
      } else {
        console.log('VNA: Error occurred, setting empty results');
        setVnaResults([]); // Set empty array to ensure UI displays the no flights message
        setApiStatus(prev => ({ ...prev, vna: 'error' }));
        captured.statusVN = 'error';
        toast.error('Lỗi tìm kiếm Vietnam Airlines');
      }
      
      checkIfShouldStopLoading();
    };

    const onSunPQResult = (result: any) => {
      console.log('=== SUNPQ RESULT DEBUG ===', result);
      setSunpqLowerFare(result?.lowerfare || null);
      captured.lowerFare = result?.lowerfare || null;
      if (result.status_code === 200 && result.body && result.body.length > 0) {
        setSunpqResults(result.body);
        captured.sun = result.body;
        captured.statusSUN = 'success';
        toast.success(`Tìm thấy ${result.body.length} chuyến bay SunPQ`);
      } else {
        setSunpqResults([]);
        captured.statusSUN = result?.status_code === 200 ? 'no_flights' : 'error';
      }
      checkIfShouldStopLoading();
    };

    try {
      await searchAllFlights(searchData, onVietJetResult, onVNAResult, onSunPQResult);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Có lỗi xảy ra khi tìm kiếm chuyến bay');
      setIsLoading(false);
    }
  };

  // Wrapper used by the search form: warns when a fresh snapshot already exists.
  const handleSearchRequest = async (data: FlightSearchData) => {
    const existing = await findValidSummaryByKey(buildSearchKey(buildKeyParts(data)));
    if (existing) {
      setCacheWarning({ summary: existing, pending: data });
      return;
    }
    void handleSearch(data);
  };

  const handleAirlineChange = (airline: 'all' | 'VJ' | 'VNA') => {
    setSelectedAirline(airline);
  };

  const handleFlightTypeChange = (flightType: 'all' | 'direct' | 'connecting') => {
    setSelectedFlightType(flightType);
  };

  const handleSelectCustomerType = (type: 'page' | 'live' | 'custom') => {
    setCustomerType(type);
    setShowCustomerModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCustomerType(null);
    setShowCustomerModal(false);
    setSearchResults([]);
    setAllResults([]);
    setVjetResults([]);
    setVnaResults([]);
    setSearchData(null);
    setHasSearched(false);
    navigate('/auth');
  };

  // Combine results whenever results change
  React.useEffect(() => {
    if (vjetResults.length > 0 || vnaResults.length > 0) {
      combineResults();
    }
  }, [vjetResults, vnaResults]);

  // Show loading while checking auth
  if (isCheckingAuth || configsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-lg text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <CustomerTypeModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomerType={handleSelectCustomerType}
      />
      <EmailTicketModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
      <PNRCheckModal
        isOpen={showPNRModal}
        onClose={() => setShowPNRModal(false)}
      />
      <CheckinModal
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
      />
      <RepriceModal
        isOpen={showRepriceModal}
        onClose={() => setShowRepriceModal(false)}
      />
      <VJTicketModal
        isOpen={showVJTicketModal}
        onClose={() => {
          setShowVJTicketModal(false);
          setVjTicketInitialPNR(undefined);
        }}
        initialPNR={vjTicketInitialPNR}
      />
      <VNATicketModal
        isOpen={showVNATicketModal}
        onClose={() => {
          setShowVNATicketModal(false);
          setVnaTicketInitialPNR(undefined);
        }}
        initialPNR={vnaTicketInitialPNR}
      />
      <OtherTicketModal
        isOpen={showOtherTicketModal}
        onClose={() => setShowOtherTicketModal(false)}
      />
      <SunPQTicketModal
        isOpen={showSunPQTicketModal}
        onClose={() => setShowSunPQTicketModal(false)}
      />
      <AddPNRModal
        isOpen={showAddPNRModal}
        onClose={() => setShowAddPNRModal(false)}
      />
      <SearchHistorySidebar
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onOpen={() => setShowHistory(true)}
        onView={(summary) => void handleViewSnapshot(summary)}
        highlightId={cachedInfo?.id ?? null}
      />
      <CacheWarningDialog
        open={!!cacheWarning}
        minutes={cacheWarning ? minutesAgo(cacheWarning.summary.createdAt) : 0}
        onViewCached={() => {
          const summary = cacheWarning?.summary;
          setCacheWarning(null);
          if (summary) void handleViewSnapshot(summary);
        }}
        onSearchAgain={() => {
          const pending = cacheWarning?.pending;
          setCacheWarning(null);
          if (pending) void handleSearch(pending);
        }}
      />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <CurrentOnlineStatus refreshKey={onlineRefreshKey} />
            <div className="flex flex-wrap gap-2">
              <EmployeeIdentityBadge />
              <Button
                onClick={() => navigate('/checkin')}
                variant="action-checkin"
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm"
              >
                🟢 Check In
              </Button>
              <Button
                onClick={() => navigate('/attendance-reports')}
                variant="outline"
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm"
              >
                📊 Attendance Reports
              </Button>
              <Button
                onClick={() => setShowHistory(true)}
                variant="outline"
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm"
              >
                🕘 Lịch sử tìm kiếm
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
            <Button
              onClick={() => setShowVJTicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé VJ
            </Button>
            <Button
              onClick={() => setShowVNATicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé VNA
            </Button>
            <Button
              onClick={() => setShowOtherTicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé Other
            </Button>
            <Button
              onClick={() => setShowSunPQTicketModal(true)}
              variant="action-ticket"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Vé SunPQ
            </Button>
            <Button
              onClick={() => navigate('/cart')}
              variant="outline"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🛒 Giỏ Hàng
            </Button>
            <Button
              onClick={() => setShowRepriceModal(true)}
              variant="action-reprice"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              💰 Reprice
            </Button>
            <Button
              onClick={() => setShowCheckinModal(true)}
              variant="action-checkin"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              ✅ Check-in
            </Button>
            <Button
              onClick={() => setShowEmailModal(true)}
              variant="action-email"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              📧 Email
            </Button>
            <Button
              onClick={() => setShowPNRModal(true)}
              variant="action-image"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              🎫 Ảnh vé
            </Button>
            <Button
              onClick={() => setShowAddPNRModal(true)}
              variant="action-reprice"
              size="sm"
              className="px-2 sm:px-5 text-xs sm:text-sm"
            >
              ➕ Thêm PNR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlightSearchForm onSearch={handleSearchRequest} isLoading={isLoading} customerType={customerType} priceConfigs={priceConfigs} />

        {cachedInfo && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="rounded-full bg-amber-500 px-2 py-0.5 font-semibold text-white">Cached Result</span>
            <span>Được lưu {minutesAgo(cachedInfo.createdAt)} phút trước · Giá chỉ mang tính tham khảo.</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 mb-6">
          <AirlineFilter 
            selectedAirline={selectedAirline}
            onAirlineChange={handleAirlineChange}
          />
          <FlightTypeFilter
            selectedFlightType={selectedFlightType}
            onFlightTypeChange={handleFlightTypeChange}
          />
        </div>
        
        {/* Low Fare Chart - show after first search */}
        {hasSearched && (lowFareDeparture.length > 0 || lowFareReturn.length > 0) && (
          <LowFareChart
            departureData={lowFareDeparture}
            returnData={lowFareReturn}
            tripType={searchData?.tripType || 'OW'}
            onSearchWithDates={handleSearchWithDates}
            isLoading={isLoading}
            initialDepartureDate={searchData?.departureDate}
            initialReturnDate={searchData?.returnDate}
          />
        )}
        
        <FlightResults
          results={searchResults} 
          vjetResults={vjetResults}
          vnaResults={vnaResults}
          sunpqResults={sunpqResults}
          sunpqLowerFare={sunpqLowerFare}
          isLoading={isLoading}
          selectedAirline={selectedAirline}
          selectedFlightType={selectedFlightType}
          searchData={searchData}
          apiStatus={apiStatus}
          searchMessages={searchMessages}
          hasSearched={hasSearched}
          vietjetDomesticError={vietjetDomesticError}
          onVJBookingSuccess={(pnr) => {
            setVjTicketInitialPNR(pnr);
            setShowVJTicketModal(true);
          }}
          onVNABookingSuccess={(pnr) => {
            setVnaTicketInitialPNR(pnr);
            setShowVNATicketModal(true);
          }}
        />
      </div>
    </div>
  );
};

export default Index;
