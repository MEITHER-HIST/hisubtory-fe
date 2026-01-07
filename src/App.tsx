import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // 목차 렌더링용
import { Toaster } from "sonner";
import { X } from "lucide-react"; // 닫기 아이콘
import { MainScreen } from "./components/MainScreen";
import { StoryScreen } from "./components/StoryScreen";
import { MyPage } from "./components/MyPage";
import { LoginModal } from "./components/LoginModal";

type Screen = "main" | "story" | "mypage";

export type User = {
  id: number;
  username: string;
  email: string;
  name: string;
};

// --- 유틸리티 함수 (기존 로직 유지) ---
function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

async function ensureCsrf() {
  await fetch("/api/accounts/csrf/", {
    method: "GET",
    credentials: "include",
  });
}

async function postForm(url: string, body: Record<string, string>) {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken") ?? "";
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "X-CSRFToken": csrftoken,
    },
    body: new URLSearchParams(body).toString(),
  });
  return res;
}

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // ✅ 목차 상태 추가
  const [user, setUser] = useState<User | null>(null);

  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<string>("3"); // ✅ 기본 3호선

  // ✅ 노선 목록 정의 (디자인 가이드 반영)
  const subwayLines = [
    { id: "1", name: "1호선", color: "bg-[#0052A4]" },
    { id: "2", name: "2호선", color: "bg-[#00A84D]" },
    { id: "3", name: "3호선", color: "bg-[#EF7C1C]" },
    { id: "4", name: "4호선", color: "bg-[#00A5DE]" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/accounts/me/", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.is_authenticated) {
          const u: User = {
            id: data.id || 0,
            username: data.username,
            email: data.email ?? "",
            name: data.username,
          };
          setUser(u);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await postForm("/api/accounts/logout/", {});
    } catch {
      // 에러 무시
    } finally {
      setUser(null);
      setCurrentScreen("main");
    }
  };

  const handleStationClick = (stationId: string, episodeId: string) => {
    setSelectedStationId(stationId);
    setSelectedEpisodeId(episodeId);
    setCurrentScreen("story");
  };

  const handleRandomStation = (stationName: string, episodeId: string) => {
    setSelectedStationId(stationName);
    setSelectedEpisodeId(episodeId);
    setCurrentScreen("story");
  };

  const [mainKey, setMainKey] = useState(0);

  const handleBackToMain = () => {
    setMainKey(prev => prev + 1);
    setCurrentScreen("main");
    setSelectedStationId(null);
    setSelectedEpisodeId(null);
  };

  const handleGoToMyPage = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentScreen("mypage");
  };

  const handleEpisodeClick = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);
    setSelectedStationId(null);
    setCurrentScreen("story");
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ✅ 목차(사이드바) UI - 디자인 가이드 반영 */}
      {isSidebarOpen && currentScreen === "main" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-80 h-full bg-white p-8 shadow-2xl animate-in slide-in-from-left duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-blue-600 tracking-tight">노선 선택</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {subwayLines.map((line) => {
                const isLine3 = line.id === "3";
                const isActive = currentLine === line.id;

                return (
                  <button
                    key={line.id}
                    disabled={!isLine3}
                    onClick={() => {
                      if (isLine3) {
                        setCurrentLine(line.id);
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-4 p-5 rounded-2xl font-bold transition-all ${
                      isLine3 
                        ? (isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-700 hover:bg-gray-100')
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${isActive && isLine3 ? 'bg-white' : line.color}`} />
                    <span className="text-lg">{line.name}</span>
                    {!isLine3 && (
                      <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-lg">준비중</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <p className="text-xs text-gray-400 font-medium">© 2026 HISUBTORY Team</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ✅ 화면 전환 로직 (MainScreen에 onMenuClick 추가) */}
      {currentScreen === "main" && (
        <MainScreen
          key={`${mainKey}-${currentLine}`}
          user={user}
          currentLine={currentLine}
          onMenuClick={() => setIsSidebarOpen(true)} // 목차 열기 기능 연결
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onStationClick={handleStationClick}
          onRandomStation={handleRandomStation}
          onGoToMyPage={handleGoToMyPage}
        />
      )}

      {currentScreen === "story" && (
        <StoryScreen
          key={`story-${selectedEpisodeId}`}
          user={user}
          stationId={selectedStationId}
          episodeId={selectedEpisodeId}
          onBack={handleBackToMain}
        />
      )}

      {currentScreen === "mypage" && (
        <MyPage user={user} onBack={handleBackToMain} onEpisodeClick={handleEpisodeClick} />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <Toaster position="top-center" richColors />
    </div>
  );
}