// App.tsx
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
  name: string; // UI에서 name만 쓰는 곳 대비
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

  // ✅ 새로고침/재접속 시 세션이 살아있으면 me로 복구
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
            name: data.username, // 필요하면 다른 표시명 규칙으로 변경
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

  // ✅ LoginModal에서 로그인 성공 후 user 객체를 넘겨받도록 변경
  const handleLogin = (u: User) => {
    setUser(u);
    setIsLoginModalOpen(false);
  };

  // ✅ 서버 세션 로그아웃까지 처리
  const handleLogout = async () => {
    try {
      await postForm("/api/accounts/logout/", {});
    } catch {
      // 네트워크 에러여도 UI는 로그아웃 처리
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
    const episode = require("./data/episodes").episodes.find((ep: any) => ep.id === episodeId);
    if (episode) {
      setSelectedStationId(episode.stationId);
      setSelectedEpisodeId(episodeId);
      setCurrentScreen("story");
    }
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
        <StoryScreen user={user} stationId={selectedStationId} episodeId={selectedEpisodeId} onBack={handleBackToMain} />
      )}

      {currentScreen === "mypage" && (
        <MyPage user={user} onBack={handleBackToMain} onEpisodeClick={handleEpisodeClick} />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(u) => {
          setUser(u);
          setIsLoginModalOpen(false);
        }}
      />
      <Toaster />
    </div>
  );
}