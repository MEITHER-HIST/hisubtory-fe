import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  Check, 
  Clock, 
  Library, 
  Loader2 
} from 'lucide-react';
import axios from 'axios';
const apiUrl = import.meta.env.VITE_API_URL;

// 1. 타입 정의
interface Episode {
  id: string;
  title: string;
  stationId: string;
  imageUrl: string;
  content: string;
}

interface MyPageProps {
  user: { name: string } | null;
  onBack: () => void;
  onEpisodeClick: (episodeId: string) => void;
}

export function MyPage({ user, onBack, onEpisodeClick }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  
  // 2. 상태 관리 (서버 데이터용)
  const [viewedEpisodes, setViewedEpisodes] = useState<Episode[]>([]);
  const [savedEpisodes, setSavedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  // 3. 환경변수 및 데이터 로드 로그 확인
  useEffect(() => {
    console.log("API URL 확인:", import.meta.env.VITE_API_URL);
    
    if (user) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${apiUrl}/library/api/history/`, {
            withCredentials: true 
          });
          
          // 백엔드 응답 데이터 구조에 맞게 세팅
          setViewedEpisodes(response.data.recent || []);
          setSavedEpisodes(response.data.saved || []);
        } catch (error) {
          console.error("데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  // 로그인 안 된 경우 처리
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <button onClick={onBack} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  const recentEpisodes = [...viewedEpisodes].reverse().slice(0, 10);
  const currentEpisodes = activeTab === 'recent' ? recentEpisodes : savedEpisodes;

return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 tracking-wider">HISUBTORY</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-gray-900 mb-2">{user.name}님의 여행 기록</h2>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">본 에피소드: {viewedEpisodes.length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">저장한 에피소드: {savedEpisodes.length}개</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'recent' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>최근 본 이야기</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'saved' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Library className="w-5 h-5" />
              <span>내 이야기</span>
            </button>
          </div>

          <div className="p-6">
            {currentEpisodes.length === 0 ? (
              <div className="text-center py-16">
                {/* 아이콘을 추가하여 시각적으로 더 풍부하게 만들었습니다 */}
                {activeTab === 'recent' ? (
                  <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                ) : (
                  <Library className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                )}
                <p className="text-gray-500 text-lg font-medium">아직 기록이 없어요.</p>
                <p className="text-gray-400 text-sm mt-2">
                  {activeTab === 'recent' 
                    ? "지하철 노선도를 따라 새로운 이야기를 찾아보세요!" 
                    : "마음에 드는 에피소드를 저장해 보세요."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentEpisodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => onEpisodeClick(episode.id)}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      <img src={episode.imageUrl} alt={episode.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600 text-sm font-bold">{episode.stationId}</span>
                    </div>
                    <h4 className="text-gray-900 font-medium">{episode.title}</h4>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}