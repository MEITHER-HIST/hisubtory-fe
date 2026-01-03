import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { MainScreen } from "./components/MainScreen";
import { StoryScreen } from "./components/StoryScreen";
import { MyPage } from "./components/MyPage";
import { LoginModal } from "./components/LoginModal";

// teampage 화면 정의 삭제
type Screen = "main" | "story" | "mypage";

export type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  is_leader_approved?: boolean;
  leader_code?: string;
  has_team?: boolean;
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
            is_leader_approved: data.is_leader_approved,
            leader_code: data.leader_code,
            has_team: data.has_team,
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

  const handleEpisodeClick = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);
    setSelectedStationId(null);
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
        <MyPage 
          user={user} 
          onBack={handleBackToMain} 
          onEpisodeClick={handleEpisodeClick}
          /* onGoToTeam 인자 삭제됨 (마이페이지 내부 탭으로 통합) */
        />
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