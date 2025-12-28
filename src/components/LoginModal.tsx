import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { authApi } from "../api/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
}

type FieldErrors = Partial<{
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  form: string;
}>;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  // 탭 바꾸면 에러 정리
  useEffect(() => {
    setError(null);
    setFieldErrors({});
  }, [activeTab]);

  if (!isOpen) return null;

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 focus:ring-red-200 focus:border-red-400"
        : "border-gray-300 focus:ring-blue-600 focus:border-transparent"
    }`;

  const closeAndReset = () => {
    setError(null);
    setFieldErrors({});
    setLoading(false);
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    const trimmedPw = password.trim();

    const nextErr: FieldErrors = {};
    if (!trimmedEmail) nextErr.email = "이메일을 입력해 주세요.";
    else if (!isValidEmail(trimmedEmail))
      nextErr.email = "이메일 형식을 확인해 주세요. 예: example@email.com";
    if (!trimmedPw) nextErr.password = "비밀번호를 입력해 주세요.";

    if (Object.keys(nextErr).length > 0) {
      setFieldErrors(nextErr);
      setError("입력값을 확인해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login(trimmedEmail, trimmedPw);
      onLogin(data.username);
      closeAndReset();
    } catch (err: any) {
      const msg = err?.message ?? "로그인 실패";
      setError(msg);

      // 백엔드 에러 메시지 기반으로 필드에 붙여주기(간단 매핑)
      if (String(msg).toLowerCase().includes("email")) setFieldErrors({ email: msg });
      else if (String(msg).toLowerCase().includes("password")) setFieldErrors({ password: msg });
      else setFieldErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPw = password.trim();
    const trimmedPw2 = confirmPassword.trim();

    const nextErr: FieldErrors = {};
    if (!trimmedEmail) nextErr.email = "이메일을 입력해 주세요.";
    else if (!isValidEmail(trimmedEmail))
      nextErr.email = "이메일 형식을 확인해 주세요. 예: example@email.com";

    // username은 비워도 되게(이메일 앞부분 자동 생성) 하지만, 안내는 띄워줄 수 있음
    // if (!trimmedUsername) nextErr.username = "사용자 이름을 입력해 주세요."; // 원하면 이 줄 활성화

    if (!trimmedPw) nextErr.password = "비밀번호를 입력해 주세요.";
    if (!trimmedPw2) nextErr.confirmPassword = "비밀번호 확인을 입력해 주세요.";
    if (trimmedPw && trimmedPw2 && trimmedPw !== trimmedPw2)
      nextErr.confirmPassword = "비밀번호가 일치하지 않습니다.";

    if (Object.keys(nextErr).length > 0) {
      setFieldErrors(nextErr);
      setError("입력값을 확인해 주세요.");
      return;
    }

    const finalUsername = trimmedUsername || trimmedEmail.split("@")[0];

    setLoading(true);
    try {
      // 1) 회원가입
      await authApi.signup(finalUsername, trimmedEmail, trimmedPw, trimmedPw2);

      // 2) 자동 로그인
      const data = await authApi.login(trimmedEmail, trimmedPw);

      onLogin(data.username);
      closeAndReset();

      // 폼 초기화
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.message ?? "회원가입 실패";
      setError(msg);

      // 폼 에러(JSON stringify)로 올 수도 있어서 대충 키워드로 매핑
      const lower = String(msg).toLowerCase();
      if (lower.includes("email")) setFieldErrors({ email: msg });
      else if (lower.includes("username")) setFieldErrors({ username: msg });
      else if (lower.includes("password")) setFieldErrors({ password: msg });
      else setFieldErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={closeAndReset}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-gray-900 mb-6">환영합니다!</h2>

        {/* 공통 에러 박스 */}
        {(error || fieldErrors.form) && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fieldErrors.form ?? error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 rounded-md transition-all ${
              activeTab === "login"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 rounded-md transition-all ${
              activeTab === "signup"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-4">
              <label htmlFor="login-email" className="block text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                className={inputClass(!!fieldErrors.email)}
                placeholder="example@email.com"
                autoFocus
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="login-password" className="block text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                className={inputClass(!!fieldErrors.password)}
                placeholder="비밀번호를 입력하세요"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg transition-colors ${
                loading
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === "signup" && (
          <form onSubmit={handleSignupSubmit}>
            <div className="mb-4">
              <label htmlFor="signup-username" className="block text-gray-700 mb-2">
                사용자 이름
              </label>
              <input
                type="text"
                id="signup-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                }}
                className={inputClass(!!fieldErrors.username)}
                placeholder="이름을 입력하세요 (비워도 됩니다)"
                autoFocus
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                비워두면 이메일 앞부분으로 자동 설정됩니다.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="signup-email" className="block text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                className={inputClass(!!fieldErrors.email)}
                placeholder="example@email.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="signup-password" className="block text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="signup-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                className={inputClass(!!fieldErrors.password)}
                placeholder="비밀번호를 입력하세요"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="signup-confirm-password" className="block text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="signup-confirm-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                className={inputClass(!!fieldErrors.confirmPassword)}
                placeholder="비밀번호를 다시 입력하세요"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg transition-colors ${
                loading
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
