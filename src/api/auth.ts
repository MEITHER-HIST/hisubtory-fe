// src/api/auth.ts

function getCookie(name: string) {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() ?? null;
  return null;
}

/**
 * 전송 방식을 JSON으로 변경하여 장고의 DRF와 호환성을 높이고, 
 * 모든 요청에 세션 쿠키(credentials)를 포함하도록 통합했습니다.
 */
async function postJSON(url: string, body: Record<string, any>) {
  const csrftoken = getCookie("csrftoken") ?? "";

  const res = await fetch(url, {
    method: "POST",
    credentials: "include", // ✅ 세션 유지를 위해 필수
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
  login: (email: string, password: string) =>
    postJSON("/api/accounts/login/", { 
      username: email,
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
    const res = await fetch("/api/accounts/me/", { 
      method: "GET",
      credentials: "include" // ✅ 로그인 상태 확인을 위해 필수
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "not_logged_in");
    return data;
  },

  logout: () => postJSON("/api/accounts/logout/", {}),

  // ✅ 팀 정보 가져오기 (404 방지를 위해 credentials 추가 및 경로 확인)
  getTeamInfo: async () => {
    try {
      const res = await fetch("/api/accounts/team-info/", { 
        method: "GET",
        credentials: "include" 
      });
      if (!res.ok) return { success: true, has_team: false }; 
      return await res.json();
    } catch (err) {
      console.error("Team Info Fetch Error:", err);
      return { success: true, has_team: false };
    }
  },
  
  // ✅ 멤버십 신청 (기존 fetch 대신 검증된 postJSON 사용하도록 변경)
  requestMembership: async (data: {
    request_type: 'LEADER' | 'MEMBER';
    team_name: string;
    applicant_name: string;
    target_leader_code?: string;
  }) => {
    // 공통 postJSON 함수를 사용하여 CSRF와 Credentials 문제를 한 번에 해결합니다.
    return postJSON("/api/accounts/membership-request/", data);
  },
};