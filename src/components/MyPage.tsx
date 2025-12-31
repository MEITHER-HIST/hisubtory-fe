import { ArrowLeft, Bookmark, Check, Clock, Library as LibraryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MyPageProps {
  user: { name: string; username: string } | null;
  onBack: () => void;
  onEpisodeClick: (episodeId: string) => void;
}

// 백엔드 응답 데이터 타입 정의
interface HistoryItem {
  id: string;
  title: string;
  stationName: string;
  imageUrl: string;
  content: string;
}

export function MyPage({ user, onBack, onEpisodeClick }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  const [recentStories, setRecentStories] = useState<HistoryItem[]>([]);
  const [myStories, setMyStories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 컴포넌트 마운트 시 백엔드 API 호출
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/library/history/", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setRecentStories(data.recent || []);
          setMyStories(data.saved || []);
        }
      } catch (error) {
        console.error("활동 기록 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchHistory();
  }, [user]);

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">기록을 불러오는 중...</div>;
  }

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
              <span className="text-gray-700">본 에피소드: {recentStories.length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">저장한 에피소드: {myStories.length}개</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'recent' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Clock className="w-5 h-5" />
              <span>최근 본 이야기</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${activeTab === 'saved' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <LibraryIcon className="w-5 h-5" />
              <span>내 이야기</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'recent' && (
              <div>
                <h3 className="text-gray-900 mb-4">최근 본 이야기</h3>
                {recentStories.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">아직 본 에피소드가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentStories.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => onEpisodeClick(episode.id)}
                        className="w-full flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={episode.imageUrl} alt={episode.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-gray-600 text-sm">{episode.stationName}</span>
                          </div>
                          <p className="text-gray-900">{episode.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <h3 className="text-gray-900 mb-4">내 이야기</h3>
                {myStories.length === 0 ? (
                  <div className="text-center py-12">
                    <LibraryIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">저장한 에피소드가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myStories.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => onEpisodeClick(episode.id)}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                          <img src={episode.imageUrl} alt={episode.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-600 text-sm">{episode.stationName}</span>
                        </div>
                        <h4 className="text-gray-900">{episode.title}</h4>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{episode.content}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}