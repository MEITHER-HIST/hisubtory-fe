import { useEffect, useState } from "react";
import { Toaster } from "sonner";
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
  const [user, setUser] = useState<User | null>(null);

  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/accounts/me/", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success) {
          const u: User = {
            id: data.id,
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

  const handleStationClick = (stationId: string) => {
    setSelectedStationId(stationId);
    setSelectedEpisodeId(null);
    setCurrentScreen("story");
  };

  const handleRandomStation = (stationId: string, episodeId: string) => {
    setSelectedStationId(stationId);
    setSelectedEpisodeId(episodeId);
    setCurrentScreen("story");
  };

  const handleBackToMain = () => {
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

  // ✅ [수정] 마이페이지에서 에피소드 클릭 시 처리
  // 더 이상 로컬 require를 사용하지 않고 넘겨받은 episodeId를 상태에 저장합니다.
  const handleEpisodeClick = (episodeId: string) => {
    // DB 기반 시스템이므로 local data 조회가 필요 없습니다.
    // StoryScreen 컴포넌트가 episodeId를 받아 서버에서 데이터를 직접 가져올 것입니다.
    setSelectedEpisodeId(episodeId);
    setSelectedStationId(null); // 특정 에피소드 기반일 때는 역 ID를 초기화하거나 무시
    setCurrentScreen("story");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {currentScreen === "main" && (
        <MainScreen
          user={user}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onStationClick={handleStationClick}
          onRandomStation={handleRandomStation}
          onGoToMyPage={handleGoToMyPage}
        />
      )}

      {currentScreen === "story" && (
        <StoryScreen
          key={`${selectedStationId ?? "none"}:${selectedEpisodeId ?? "none"}`}
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
      <Toaster />
    </div>
  );
}