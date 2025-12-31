import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { User } from "../App";

interface CutDTO {
  order: number | null;
  image_url: string | null;
  caption: string;
}

interface EpisodeDTO {
  id: number;
  episode_num: number;
  episode_title: string;
  station_name: string;
  webtoon_id: number;
}

interface StoryScreenProps {
  user: User | null;
  stationId: string | null;
  episodeId: string | null;
  onBack: () => void;
}

export function StoryScreen({ user, stationId, episodeId, onBack }: StoryScreenProps) {
  // ✅ 로컬 스토리지 대신 서버 상태 관리
  const [isSaved, setIsSaved] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [episode, setEpisode] = useState<EpisodeDTO | null>(null);
  const [cuts, setCuts] = useState<CutDTO[]>([]);

  useEffect(() => {
    setError(null);
    setLoading(true);

    if (!episodeId) {
      setError("episodeId가 없습니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // ✅ 에피소드 상세 및 북마크 여부를 한 번에 가져옴
        const res = await fetch(`/api/pages/v1/episode/detail/?episode_id=${episodeId}`, {
          method: "GET",
          credentials: "include",
        });
        
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.message ?? "데이터 로드 실패");

        setEpisode(data.episode as EpisodeDTO);
        setCuts((data.cuts ?? []) as CutDTO[]);
        
        // ✅ 서버 DB 기반 상태 설정 (백엔드 EpisodeDetailAPIView가 주는 값)
        setIsSaved(data.is_bookmarked ?? false);
        setIsViewed(true); // 상세 페이지를 열었으므로 시청 완료로 간주

      } catch (e: any) {
        setError(e?.message ?? "에피소드 로드 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [episodeId, user]);

  // ✅ [수정] 서버 DB에 북마크 저장/삭제 요청
  const handleSaveToggle = async () => {
    if (!episodeId || !user) {
      toast.error("로그인이 필요한 서비스입니다.");
      return;
    }

    try {
      const res = await fetch(`/api/stories/bookmark/${episodeId}/`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setIsSaved(data.is_bookmarked); // 서버에서 반환한 최신 상태 반영
        toast.success(data.is_bookmarked ? "내 이야기에 저장되었습니다!" : "저장이 취소되었습니다.");
      } else {
        throw new Error("서버 응답 오류");
      }
    } catch (err) {
      toast.error("저장 처리 중 오류가 발생했습니다.");
    }
  };

  const handleNewEpisode = () => {
    toast("새 에피소드 추천 기능을 준비 중입니다!");
  };

  // ... (로딩/에러 UI는 동일) ...
  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">불러오는 중...</p></div>;
  if (error || !episode) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
        <p className="text-gray-900 mb-4">{error}</p>
        <button onClick={onBack} className="w-full py-3 bg-blue-600 text-white rounded-lg">메인으로</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 font-bold">HISUBTORY</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-medium">{episode.station_name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{episode.episode_title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">{episode.station_name}역</span>
            {isViewed && user && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">✓ 읽음</span>
            )}
          </div>
        </div>

        {cuts.map((c, idx) => (
          <div key={idx} className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <img src={c.image_url || ""} alt="" className="w-full h-auto object-cover min-h-[300px]" />
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <p className="text-gray-800 text-lg leading-relaxed">{c.caption}</p>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-6">
          {user ? (
            <div className="flex gap-4">
              <button
                onClick={handleSaveToggle}
                className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold border-2 transition-all ${
                  isSaved ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                {isSaved ? "저장됨" : "저장하기"}
              </button>
              <button onClick={handleNewEpisode} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700">
                <RefreshCw className="w-6 h-6" />
                다른 이야기
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm">로그인 후 이야기를 저장해보세요!</p>
          )}
        </div>
      </main>
    </div>
  );
}