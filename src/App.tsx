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
    setSelectedEpisodeId(null); // 특정 역 클릭 시에는 에피소드를 null로 보내서 StoryScreen 내부에서 뽑게 함
    setCurrentScreen("story");
  };

  // ✅ 랜덤 버튼 클릭 시 호출되는 함수
  const handleRandomStation = (stationName: string, episodeId: string) => {
    setSelectedStationId(stationName); // 역 이름을 ID 대신 넘겨서 UI 표시용으로 사용
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
          key={`story-${selectedEpisodeId}`}
          user={user}
          stationId={selectedStationId}
          episodeId={selectedEpisodeId} // 이 ID가 stories API로 전달되어야 함
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