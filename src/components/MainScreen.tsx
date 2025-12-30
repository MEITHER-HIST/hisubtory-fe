import { useState,useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Shuffle, User, Menu, ChevronDown } from 'lucide-react';
import { SubwayMap } from './SubwayMap';

type LineDTO = {
  id: number;
  line_name: string; // e.g. "3호선", "1호선 (준비중)"
  is_active: boolean;
};

type StationDTO = {
  id: number;
  name: string; // "경복궁" 같은 역명
  clickable: boolean;
  color: "green" | "gray";
};

type MainApiResponse = {
  lines: LineDTO[];
  selected_line: string | null;
  stations: StationDTO[];
  show_random_button: boolean;
};

interface MainScreenProps {
  user: { name: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onGoToMyPage: () => void;

  /** 에피소드 상세 라우팅 베이스(프로젝트마다 다르면 바꿔 쓰기) */
  episodePathBase?: string; // default: "/episodes"
}

export function MainScreen({
  user,
  onLoginClick,
  onLogout,
  onGoToMyPage,
  episodePathBase = "/episodes",
}: MainScreenProps) {
  const navigate = useNavigate();

  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [lineNum, setLineNum] = useState<number>(3);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [stations, setStations] = useState<StationDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stationByName = useMemo(() => {
    const m = new Map<string, StationDTO>();
    for (const s of stations) m.set(s.name, s);
    return m;
  }, [stations]);

  const fetchMain = async (ln: number) => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await fetch(`/api/pages/v1/main/?line=${ln}`, {
      method: "GET",
      credentials: "include",
    });

    const data: MainApiResponse = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      throw new Error((data as any)?.message ?? "main_api_failed");
    }

    setLines(data.lines ?? []);
    setStations(data.stations ?? []);
  };

  useEffect(() => {
    fetchMain(lineNum)
      .catch((e) => setErrorMsg(e?.message ?? "main_load_failed"))
      .finally(() => setIsLoading(false));
  }, [lineNum, !!user]);

  const pickEpisodeByStationId = async (stationId: number) => {
    const res = await fetch(`/api/pages/v1/episode/pick/?station_id=${stationId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(data?.message ?? "pick_failed");

    // ✅ 라우트는 너희 프로젝트에 맞게 episodePathBase만 맞추면 됨
    navigate(`${episodePathBase}/${data.episode_id}`);
  };

  const handleRandomStation = async () => {
    const res = await fetch(`/api/pages/v1/episode/random/?line=${lineNum}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(data?.message ?? "random_failed");

    navigate(`${episodePathBase}/${data.episode_id}`);
  };

  const handleSelectLine = (line: LineDTO) => {
    if (!line.is_active) return;

    // "3호선", "3호선 (준비중)" → 3 추출
    const n = parseInt(line.line_name, 10);
    setLineNum(Number.isFinite(n) ? n : 3);
    setIsLineDropdownOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Hamburger Menu - Left */}
          <div className="relative">
            <button
              onMouseEnter={() => setIsLineDropdownOpen(true)}
              onMouseLeave={() => setIsLineDropdownOpen(false)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="노선 선택"
            >
              <Menu className="w-6 h-6" />
            </button>

            {isLineDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                onMouseEnter={() => setIsLineDropdownOpen(true)}
                onMouseLeave={() => setIsLineDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm text-gray-500">노선 선택</p>
                </div>

                {/* API로 받은 노선 목록 */}
                {(lines.length ? lines : [{ id: 0, line_name: "3호선", is_active: true }]).map((line) => (
                  <button
                    key={line.id}
                    disabled={!line.is_active}
                    onClick={() => handleSelectLine(line)}
                    className={[
                      "w-full px-4 py-3 text-left transition-colors flex items-center gap-2",
                      line.is_active ? "hover:bg-blue-50 text-gray-800" : "text-gray-400 cursor-not-allowed",
                      parseInt(line.line_name, 10) === lineNum ? "bg-blue-50 text-blue-700" : "",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-3 h-3 rounded-full",
                        line.is_active ? "bg-orange-500" : "bg-gray-300",
                      ].join(" ")}
                    />
                    <span>{line.line_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title - Center */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-blue-600 tracking-wider">
            HISUBTORY
          </h1>

          {/* Right Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{user.name}님</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        onGoToMyPage();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      마이페이지
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-6">
          <h2 className="text-gray-900 mb-2">서울 지하철 {lineNum}호선 역사 여행</h2>
          <p className="text-gray-600">역을 클릭하거나 랜덤으로 선택해서 역사 스토리를 탐험하세요</p>
        </div>

        {/* Error / Loading */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            메인 데이터를 불러오지 못했어요: {errorMsg}
          </div>
        )}

        {/* Subway Map */}
        <div className="mb-6">
          <SubwayMap
            user={user}
            stationByName={stationByName}
            onPickEpisode={(stationId) => {
              pickEpisodeByStationId(stationId).catch((e) => {
                alert(e?.message ?? "pick_failed");
              });
            }}
          />

          {!user && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm text-center">
                💡 비로그인도 스토리를 볼 수 있어요. 로그인하면 방문 기록이 저장돼요!
              </p>
            </div>
          )}
        </div>

        {/* Random Station Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">랜덤 역 선정</h3>

          <button
            disabled={isLoading}
            onClick={() => {
              handleRandomStation().catch((e) => alert(e?.message ?? "random_failed"));
            }}
            className={[
              "w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2",
              isLoading ? "opacity-60 cursor-not-allowed" : "hover:from-blue-700 hover:to-indigo-700",
            ].join(" ")}
          >
            <Shuffle className="w-5 h-5" />
            랜덤 역 뽑기
          </button>

          <p className="text-gray-500 text-sm mt-3 text-center">
            {user ? "아직 안 본 역/스토리 우선으로 랜덤 선택됩니다" : "전체 역 중에서 랜덤으로 선택됩니다"}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2025 HISUBTORY. 서울 지하철 {lineNum}호선 역사 탐험 프로젝트
        </div>
      </footer>
    </div>
  );
}
