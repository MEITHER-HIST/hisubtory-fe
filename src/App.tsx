import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";

import { MainScreen } from "./components/MainScreen";
import { StoryScreen } from "./components/StoryScreen";
import { MyPage } from "./components/MyPage";
import { LoginModal } from "./components/LoginModal";

type User = { name: string } | null;

function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

async function ensureCsrf() {
  await fetch("/api/accounts/csrf/", { method: "GET", credentials: "include" });
}

function StoryRoute({ user }: { user: User }) {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <StoryScreen
      user={user}
      stationId={null}
      episodeId={id ?? null}
      onBack={() => navigate(-1)}
    />
  );
}

function MyPageRoute({
  user,
  onRequireLogin,
}: {
  user: User;
  onRequireLogin: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      onRequireLogin();
      navigate("/", { replace: true });
    }
  }, [user, onRequireLogin, navigate]);

  if (!user) return null;

  return (
    <MyPage
      user={user}
      onBack={() => navigate("/")}
      onEpisodeClick={(episodeId: string) => navigate(`/episodes/${episodeId}`)}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User>(null);

  const openLogin = useCallback(() => setIsLoginModalOpen(true), []);

  // 세션 복원
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/pages/v1/auth/me/", { credentials: "include" });
        const data = await res.json();
        if (data?.is_authenticated) setUser({ name: data.username });
        else setUser(null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  const handleLogin = async (email: string, password: string) => {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken") ?? "";

  const body = new URLSearchParams();
  body.set("email", email);
  body.set("password", password);

  const res = await fetch("/api/accounts/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrftoken,
    },
    credentials: "include",
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "login_failed");

  // 로그인 성공 후 user 세팅
  setUser({ name: data.username });
  setIsLoginModalOpen(false);
};

  const handleLogout = async () => {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken") ?? "";
  await fetch("/api/accounts/logout/", {
    method: "POST",
    headers: { "X-CSRFToken": csrftoken },
    credentials: "include",
  });
  setUser(null);
};

  const handleGoToMyPage = () => {
    if (!user) {
      openLogin();
      return;
    }
    navigate("/mypage");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Routes>
        <Route
          path="/"
          element={
            <MainScreen
              user={user}
              onLoginClick={openLogin}
              onLogout={handleLogout}
              onGoToMyPage={handleGoToMyPage}
              episodePathBase="/episodes"
            />
          }
        />
        <Route path="/episodes/:id" element={<StoryRoute user={user} />} />
        <Route path="/mypage" element={<MyPageRoute user={user} onRequireLogin={openLogin} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin} // (identifier, password)로 받게 LoginModal도 수정 필요
      />

      <Toaster />
    </div>
  );
}
