import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shuffle, User as UserIcon, Menu, ChevronDown } from 'lucide-react';
import { SubwayMap } from './SubwayMap';
import type { User } from "../App";

type StationDTO = { 
  id: number; 
  name: string; 
  clickable: boolean; 
  color: "green" | "gray"; 
  is_viewed: boolean; 
  has_story: boolean; 
};

interface MainScreenProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void | Promise<void>;
  onGoToMyPage: () => void;
  onStationClick: (stationId: string, episodeId: string) => void; 
  onRandomStation: (stationId: string, episodeId: string) => void;
}

export function MainScreen({ user, onLoginClick, onLogout, onGoToMyPage, onStationClick, onRandomStation }: MainScreenProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [stations, setStations] = useState<StationDTO[]>([]);
  const [showRandomButton, setShowRandomButton] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMain = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pages/v1/main/?line=3`, { credentials: "include" });
      const data = await res.json();
      
      if (data.success && data.stations) {
        // 1. 로컬 저장소에서 시청한 역 '이름' 리스트 가져오기
        const rawLocalViewed = localStorage.getItem('viewed_stations');
        const localViewedNames: string[] = rawLocalViewed ? JSON.parse(rawLocalViewed) : [];
        
        const mergedStations = data.stations.map((s: StationDTO) => {
          // 2. 서버 역 이름에서 '역' 제거 후 로컬 저장소와 대조
          const cleanName = s.name.replace(/역$/, "");
          const isLocallyViewed = localViewedNames.includes(cleanName);
          
          // 서버의 읽음 여부(로그인) OR 로컬 저장소 기록(비로그인)
          const isActuallyViewed = s.is_viewed || isLocallyViewed;

          return {
            ...s,
            is_viewed: isActuallyViewed,
            color: isActuallyViewed ? "green" : "gray",
            // 로그인 시: 스토리 있는 모든 역 / 비로그인 시: 본 역만
            clickable: user ? s.has_story : isActuallyViewed
          };
        });

        setStations(mergedStations);
        setShowRandomButton(data.show_random_button);
      }
    } catch (e) {
      console.error("fetch 에러:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchMain(); }, [fetchMain]);

  const stationByName = useMemo(() => {
    const m = new Map<string | number, StationDTO>();
    stations.forEach(s => {
      const clean = s.name.replace(/역$/, "");
      m.set(s.id, s);
      m.set(clean, s);
    });
    return m;
  }, [stations]);

  // 역 클릭 시 실행될 핵심 로직
  const handleStationClick = async (stationId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pages/v1/episode/pick/?station_id=${stationId}`, { credentials: "include" });
      const data = await res.json();

      if (data.success && data.episode_id) {
        // ✅ [핵심 추가] 비로그인 상태일 때 로컬 스토리지에 시청 기록 저장
        if (!user) {
          const localViewed: number[] = JSON.parse(localStorage.getItem('viewed_stations') || '[]');
          if (!localViewed.includes(stationId)) {
            localViewed.push(stationId);
            localStorage.setItem('viewed_stations', JSON.stringify(localViewed));
          }
        }
        
        // 에피소드 페이지로 이동
        onStationClick(String(stationId), String(data.episode_id));
      } else {
        alert(data.message || "감상 가능한 에피소드가 없습니다.");
      }
    } catch (err) {
      console.error("에피소드 조회 에러:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomStation = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pages/v1/episode/random/?line=3`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.episode_id) {
        // 랜덤 시에도 비로그인 기록을 남기고 싶다면 위 handleStationClick과 동일한 로직 추가 가능
        onRandomStation(String(data.station_name), String(data.episode_id));
      }
    } catch (err) {
      console.error("랜덤 에러:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Menu className="w-6 h-6 text-gray-600 cursor-pointer" />
          <h1 className="absolute left-1/2 -translate-x-1/2 text-blue-600 font-bold text-xl tracking-widest">HISUBTORY</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-1 text-sm font-bold bg-gray-50 px-3 py-2 rounded-xl">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-900">{user.name}님</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-[9999]" style={{ minWidth: '160px' }}>
                    <button onClick={() => { onGoToMyPage(); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 rounded-xl">마이페이지</button>
                    <button onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">로그아웃</button>
                  </div>
                )}
              </div>
            ) : <button onClick={onLoginClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">로그인</button>}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-10 bg-gray-50 rounded-3xl p-4 shadow-inner min-h-[400px] flex flex-col items-center justify-center relative border border-gray-100">
          {stations.length > 0 ? (
            <SubwayMap 
              stationByName={stationByName} 
              onPickEpisode={handleStationClick} 
              isLoggedIn={!!user} // ✅ 추가된 props: 로그인 여부 전달
            />
          ) : !isLoading && <div className="text-blue-600 font-bold">지하철 노선도를 불러오는 중...</div>}
          {isLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-3xl font-bold text-blue-600">처리 중...</div>}
        </div>

        {showRandomButton && (
          <button onClick={handleRandomStation} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
            <Shuffle className="w-5 h-5" /> 오늘의 랜덤 스토리 탐험하기
          </button>
        )}
      </main>
    </div>
  );
}