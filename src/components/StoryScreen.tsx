import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { User } from "../App";
import { getUserProgress, markEpisodeAsViewed, toggleSavedEpisode } from "../utils/localStorage";

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
  stationId: string | null;   // (지금은 크게 안 씀. 헤더 표시 정도)
  episodeId: string | null;   // ✅ 이걸로 detail API 호출
  onBack: () => void;
}

export function StoryScreen({ user, stationId, episodeId, onBack }: StoryScreenProps) {
  const [progress, setProgress] = useState(getUserProgress());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [episode, setEpisode] = useState<EpisodeDTO | null>(null);
  const [cuts, setCuts] = useState<CutDTO[]>([]);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setEpisode(null);
    setCuts([]);

    if (!episodeId) {
      setError("episodeId가 없습니다.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/pages/v1/episode/detail/?episode_id=${episodeId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.success) throw new Error(data?.message ?? "episode_detail_failed");

        setEpisode(data.episode as EpisodeDTO);
        setCuts((data.cuts ?? []) as CutDTO[]);

        // 로그인 사용자면 “봤음” 기록
        if (user) {
          markEpisodeAsViewed(String(episodeId));
          setProgress(getUserProgress());
        }
      } catch (e: any) {
        setError(e?.message ?? "episode_load_failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [episodeId, user]);

  const handleSaveToggle = () => {
    if (!episodeId || !user) return;
    toggleSavedEpisode(String(episodeId));
    setProgress(getUserProgress());
  };

  const handleNewEpisode = () => {
    // 이건 “다음 에피소드 추천 API” 만들면 붙이는 게 깔끔
    toast("새 에피소드 추천 API를 붙이면 여기서 다음 편을 열 수 있어요!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">에피소드를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
          <p className="text-gray-900 mb-2">에피소드를 열 수 없어요.</p>
          <p className="text-gray-600 text-sm mb-4">{error ?? "unknown_error"}</p>
          <button
            onClick={onBack}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isSaved = progress.savedEpisodes.includes(String(episodeId));
  const isViewed = progress.viewedEpisodes.includes(String(episodeId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 tracking-wider">HISUBTORY</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span className="text-gray-900">{episode.station_name ?? stationId ?? ""}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-gray-900 mb-2">{episode.episode_title}</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <span className="text-gray-600">{episode.station_name}역</span>
            {isViewed && user && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">✓ 봤음</span>
            )}
          </div>
        </div>

        {cuts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <p className="text-gray-600">표시할 컷이 아직 없어요.</p>
          </div>
        ) : (
          cuts.map((c, idx) => (
            <div key={`${c.order ?? idx}`} className="mb-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                <div className="relative h-96 bg-gray-200">
                  {c.image_url ? (
                    <img src={c.image_url} alt={`컷 ${c.order ?? idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                      이미지 URL 없음
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <p className="text-gray-700 leading-relaxed text-lg">{c.caption}</p>
              </div>
            </div>
          ))
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {user ? (
            <div className="flex gap-3">
              <button
                onClick={handleSaveToggle}
                className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 ${
                  isSaved ? "bg-blue-50 text-blue-600 border-blue-600 hover:bg-blue-100" : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                {isSaved ? "저장됨" : "저장하기"}
              </button>

              <button
                onClick={handleNewEpisode}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                새 에피소드 보기
              </button>
            </div>
          ) : (
            <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm text-center">💡 로그인하면 에피소드를 저장하고 진행상황을 기록할 수 있어요!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
