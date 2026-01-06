import { useState, useEffect, useMemo } from 'react';
import { Shuffle, User as UserIcon, Menu, ChevronDown } from 'lucide-react';
import { SubwayMap } from './SubwayMap';
import type { User } from "../App";

type LineDTO = {
  id: number;
  line_name: string;
  is_active: boolean;
};

type StationDTO = {
  id: number;
  name: string;
  clickable: boolean;
  color: "green" | "gray"; 
  is_viewed: boolean;
};

type MainApiResponse = {
  success: boolean;
  lines: LineDTO[];
  selected_line: string | null;
  stations: StationDTO[];
  show_random_button: boolean;
};

interface MainScreenProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void | Promise<void>;
  onGoToMyPage: () => void;
  onStationClick: (stationId: string) => void;
  onRandomStation: (stationId: string, episodeId: string) => void;
}

export function MainScreen({
  user,
  onLoginClick,
  onLogout,
  onGoToMyPage,
  onStationClick,
  onRandomStation,
}: MainScreenProps) {
  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [lineNum, setLineNum] = useState<number>(3);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [stations, setStations] = useState<StationDTO[]>([]);
  const [showRandomButton, setShowRandomButton] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stationByName = useMemo(() => {
    const m = new Map<string, StationDTO>();
    stations.forEach(s => m.set(s.name, s));
    return m;
  }, [stations]);

  const fetchMain = async (ln: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pages/v1/main/?line=${ln}`, {
        method: "GET",
        credentials: "include",
      });
      const data: MainApiResponse = await res.json();
      
      if (data.success) {
        setLines(data.lines || []);
        setStations(data.stations || []);
        setShowRandomButton(data.show_random_button !== false); 
      }
    } catch (e: any) {
      setErrorMsg("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMain(lineNum);
  }, [lineNum, user]);

  const handleRandomStation = async () => {
  try {
    setIsLoading(true);
    const res = await fetch(`/api/pages/v1/episode/random/?line=${lineNum}`, {
      method: "GET",
      credentials: "include",
    });
    
    const data = await res.json();
    console.log("서버에서 받은 랜덤 데이터:", data); 

    // ✅ data.success가 True이거나, data.episode_id가 실재할 때 실행
    if (res.ok && (data.success || data.episode_id)) {
      onRandomStation(
        String(data.station_name), 
        String(data.episode_id)
      );
      // 이 시점에 App.tsx의 setCurrentScreen("story")가 실행되어야 함
    } else {
      alert(data.message || "에피소드 데이터를 처리할 수 없습니다.");
    }
  } catch (err) {
    console.error("연결 에러:", err);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setIsLineDropdownOpen(!isLineDropdownOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="absolute left-1/2 -translate-x-1/2 text-blue-600 font-bold text-xl tracking-widest">HISUBTORY</h1>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-1 text-sm font-medium">
                  <UserIcon className="w-4 h-4" /> {user.name}님 <ChevronDown className="w-4 h-4" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white shadow-xl border rounded-lg py-2 z-50">
                    <button onClick={onGoToMyPage} className="w-full text-left px-4 py-2 hover:bg-gray-50">마이페이지</button>
                    <button onClick={onLogout} className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50">로그아웃</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onLoginClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold">로그인</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">서울 지하철 {lineNum}호선 역사 여행</h2>
          {errorMsg && <p className="text-red-500 mt-2 text-sm">{errorMsg}</p>}
        </div>

        <div className="mb-10 bg-gray-50 rounded-3xl p-4 shadow-inner min-h-[400px] flex flex-col items-center justify-center relative">
          {isLoading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 font-bold text-blue-600">로딩 중...</div>}
          
          <SubwayMap
            user={user}
            stationByName={stationByName}
            onPickEpisode={(stationId) => {
               // 역 클릭 시
               onStationClick(String(stationId));
            }}
          />
        </div>

        {showRandomButton && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-blue-500" /> 랜덤 역 선정
            </h3>
            <button
              onClick={handleRandomStation}
              disabled={isLoading}
              className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-50' : ''}`}
            >
              <Shuffle className="w-5 h-5" />
              오늘의 랜덤 스토리 탐험하기
            </button>
            <p className="text-gray-400 text-xs mt-3 text-center">
              {user ? "방문하지 않은 역을 우선적으로 추천합니다." : "전체 역 중에서 랜덤으로 선택됩니다."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}