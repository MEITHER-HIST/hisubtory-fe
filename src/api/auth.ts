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

async function postForm(url: string, body: Record<string, string>) {
  await ensureCsrf();
  const csrftoken = getCookie("csrftoken") ?? "";

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": csrftoken,
    },
    body: new URLSearchParams(body),
  });

  // ✅ 400 뜰 때 이유 확인하려고 에러 바디까지 읽어줌
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.log("API ERROR:", data);
    throw new Error(data?.message ?? "request_failed");
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      (data?.errors ? JSON.stringify(data.errors) : null) ||
      "request_failed";
    throw new Error(msg);
  }
  
  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    postForm("/api/accounts/login/", { email, password }),

  signup: (username: string, email: string, password: string, password2: string) =>
    postForm("/api/accounts/signup/", {
      username,
      email,
      password1: password,
      password2,
    }),

  me: async () => {
    const res = await fetch("/api/accounts/me/", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? "not_logged_in");
    return data;
  },

  logout: () => postForm("/api/accounts/logout/", {}),
};
