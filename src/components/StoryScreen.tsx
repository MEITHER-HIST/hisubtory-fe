import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { User } from "../App";

interface CutDTO {
  cut_id: number;
  image_url: string | null;
  caption: string;
  cut_order: number;
}

interface EpisodeDTO {
  episode_id: number;
  episode_num: number;
  episode_title: string;
  webtoon_title: string;
  station_name: string; // "도곡" 등 역 이름
  webtoon_id: number;
  is_viewed: boolean;
}

interface StoryScreenProps {
  user: User | null;
  stationId: string | null;
  episodeId: string | null;
  onBack: () => void;
}

export function StoryScreen({ user, stationId, episodeId, onBack }: StoryScreenProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [episode, setEpisode] = useState<EpisodeDTO | null>(null);
  const [cuts, setCuts] = useState<CutDTO[]>([]);

  useEffect(() => {
    if (!episodeId) {
      setError("에피소드 정보가 없습니다.");
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/stories/episode/detail/?episode_id=${episodeId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `서버 에러 (${res.status})`);
        }

        const data = await res.json();
        
        if (data.success) {
          setEpisode(data.episode);
          setCuts(data.cuts || []);
          setIsSaved(data.is_bookmarked || false);
          setIsViewed(data.episode.is_viewed || false);
          
          // ✅ [역 이름 저장 로직]
          // 서버에서 내려온 station_name을 로컬 스토리지에 저장
          const targetStationName = data.episode.station_name;
          
          if (targetStationName) {
            // '역' 글자가 붙어있을 수 있으므로 제거하여 저장 (비교 일관성)
            const cleanName = targetStationName.replace(/역$/, "");
            const saved = localStorage.getItem('viewed_stations');
            let viewedList: string[] = saved ? JSON.parse(saved) : [];
            
            if (!viewedList.includes(cleanName)) {
              viewedList.push(cleanName);
              localStorage.setItem('viewed_stations', JSON.stringify(viewedList));
              console.log(`[LOCAL STORAGE] 역 이름 '${cleanName}' 저장 완료`);
            }
          }

          console.log("[DEBUG] 로드 완료:", data.episode.episode_title);
        } else {
          throw new Error(data.message || "데이터를 가져오지 못했습니다.");
        }
      } catch (e: any) {
        console.error("[DEBUG-FRONT] 로드 실패:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [episodeId]);

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
        setIsSaved(data.is_bookmarked);
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/30">
      <p className="text-gray-500 font-medium">이야기를 불러오는 중...</p>
    </div>
  );

  if (error || !episode) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
        <p className="text-gray-900 mb-6 font-medium">{error || "에피소드를 불러올 수 없습니다."}</p>
        <button onClick={onBack} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">메인으로</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">돌아가기</span>
          </button>
          <h1 className="text-blue-600 font-bold text-lg tracking-tight">HISUBTORY</h1>
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-semibold bg-gray-100 px-3 py-1 rounded-lg text-sm">{episode.station_name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {episode.webtoon_title}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-medium">{episode.station_name}역의 이야기</span>
            {isViewed && user && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                ✓ 읽음
              </span>
            )}
          </div>
        </div>

        {cuts.length > 0 ? (
          cuts.map((c, idx) => (
            <div key={idx} className="mb-10">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
                <img src={c.image_url || ""} alt={`Cut ${idx + 1}`} className="w-full h-auto object-cover min-h-[300px]" />
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <p className="text-gray-800 text-lg leading-relaxed font-medium">{c.caption}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl shadow-inner border-2 border-dashed border-gray-200">
            <p className="text-gray-400">등록된 장면이 없습니다.</p>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 sticky bottom-6 mt-12 border border-white">
          <div className="flex gap-4">
            <button
              onClick={handleSaveToggle}
              className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold border-2 transition-all duration-200 ${
                isSaved ? "bg-blue-50 border-blue-600 text-blue-600" : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500"
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              {isSaved ? "저장됨" : "저장하기"}
            </button>
            <button onClick={handleNewEpisode} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <RefreshCw className="w-6 h-6" />
              다른 이야기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}