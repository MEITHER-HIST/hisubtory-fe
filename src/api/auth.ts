// src/api/auth.ts

function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

async function ensureCsrf() {
  // CSRF 쿠키 발급
  await fetch("/api/accounts/csrf/", {
    method: "GET",
    credentials: "include",
  });
}

/**
 * 전송 방식을 JSON으로 변경하여 장고의 DRF(request.data)와 호환성을 높였습니다.
 */
async function postJSON(url: string, body: Record<string, any>) {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken") ?? "";

  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // ✅ 세션 쿠키 유지를 위해 필수
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    console.error("API ERROR DETAIL:", data);
    const msg = data?.message || "요청에 실패했습니다.";
    throw new Error(msg);
  }
  
  return data;
}

export const authApi = {
  // ✅ login 시 'username'과 'email'을 동시에 보내거나 장고 뷰에 맞춰 username으로 전달
  login: (email: string, password: string) =>
    postJSON("/api/accounts/login/", { 
      username: email, // 장고의 authenticate는 기본적으로 'username' 키를 찾습니다.
      email: email,
      password: password 
    }),

  signup: (username: string, email: string, password: string, password2: string) =>
    postJSON("/api/accounts/signup/", {
      username,
      email,
      password,
      password2,
    }),

  me: async () => {
    // ✅ me 호출 시에도 반드시 credentials 포함
    const res = await fetch("/api/accounts/me/", { 
      method: "GET",
      credentials: "include" 
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "not_logged_in");
    return data;
  },

  logout: () => postJSON("/api/accounts/logout/", {}),
};