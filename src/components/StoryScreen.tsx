import { useState, useEffect } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { User } from "../App";

// 호선별 색상 정의
const LINE_COLORS: Record<string, string> = {
  "1": "#0052A4",
  "2": "#00A84D",
  "3": "#EF7C1C", 
  "4": "#00A5DE",
  "5": "#996CAC",
  "6": "#CD7C2F",
  "7": "#747F28",
  "8": "#E6186C",
  "9": "#BB8336",
};

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
  station_name: string;
  webtoon_id: number;
  is_viewed: boolean;
  line: string; 
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
        } else {
          throw new Error(data.message || "데이터를 가져오지 못했습니다.");
        }
      } catch (e: any) {
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
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-gray-900 mb-6 font-medium">{error || "에피소드를 불러올 수 없습니다."}</p>
        <button onClick={onBack} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold">메인으로</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">
          
          {/* 1. 왼쪽: 돌아가기 버튼 (크기 및 굵기 상향) */}
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors z-10">
            <ArrowLeft className="w-6 h-6" />
            <span className="font-black text-base hidden sm:inline">돌아가기</span>
          </button>
          
          {/* 2. 중앙: 로고 */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-blue-600 font-bold text-xl tracking-widest z-0">
            HISUBTORY
          </h1>
          
          {/* 오른쪽 배지 영역: 초기 밸런스 복구 + '역' 추가 */}
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-100 shadow-sm z-10">
            {/* 초기 디자인의 밸런스 좋은 동그라미 크기 (w-3 h-3) */}
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ 
                backgroundColor: LINE_COLORS[episode?.line || "3"] || "#EF7C1C" 
              }} 
            />
            
            {/* 역 이름 뒤에 '역'을 붙이는 로직 적용 */}
            <span className="text-gray-900 font-bold text-sm tracking-tight">
              {episode?.station_name.replace(/역$/, "")}역
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* 상단 제목 카드 */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-8 border border-gray-100">
          <h2 className="text-3xl font-black text-gray-900 mb-3 leading-tight">
            {episode.webtoon_title}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 font-bold">{episode.station_name}역의 이야기</span>
            {isViewed && user && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black">
                ✓ 시청 완료
              </span>
            )}
          </div>
        </div>

        {/* 컷 리스트 */}
        {cuts.length > 0 ? (
          cuts.map((c, idx) => (
            <div key={idx} className="mb-12">
              <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-6 border border-gray-100">
                <img src={c.image_url || ""} alt={`Cut ${idx + 1}`} className="w-full h-auto object-cover min-h-[300px]" />
              </div>
              <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
                <p className="text-gray-800 text-lg leading-relaxed font-bold">{c.caption}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">등록된 장면이 없습니다.</p>
          </div>
        )}

        {/* 하단 플로팅 액션 바 */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sticky bottom-6 mt-16 border border-gray-100">
          <div className="flex gap-4">
            <button
              onClick={handleSaveToggle}
              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all duration-200 ${
                isSaved 
                  ? "bg-blue-50 text-blue-600 border-2 border-blue-600" 
                  : "bg-gray-50 text-gray-400 border-2 border-transparent hover:border-blue-200 hover:text-blue-500"
              }`}
            >
              {isSaved ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
              {isSaved ? "내 보관함" : "저장하기"}
            </button>
            <button onClick={handleNewEpisode} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95">
              <RefreshCw className="w-6 h-6" />
              다른 이야기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}