import { ArrowLeft, Bookmark, Check, Clock, Library as LibraryIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MyPageProps {
  user: { name: string; username: string } | null;
  onBack: () => void;
  onEpisodeClick: (episodeId: string) => void;
}

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
    return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">기록을 불러오는 중...</div>;
  }

  // 공통 카드 렌더링 함수
  const renderStoryCard = (episode: HistoryItem) => (
    <button
      key={episode.id}
      onClick={() => onEpisodeClick(episode.id)}
      className="bg-white rounded-2xl p-4 hover:bg-blue-50 transition-all text-left border border-gray-100 hover:border-blue-200 shadow-sm group flex flex-col h-full"
    >
      <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden shadow-inner relative flex-shrink-0">
        {episode.imageUrl ? (
          <img 
            src={episode.imageUrl} 
            alt={episode.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">NO IMAGE</div>
        )}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-lg">
            {episode.stationName}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1">
        <h4 className="text-gray-900 font-bold mb-1 line-clamp-1">{episode.title}</h4>
        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed flex-1">
          {episode.content || `${episode.stationName}역의 역사 이야기입니다.`}
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 font-bold tracking-widest text-xl">HISUBTORY</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 복구된 상단 프로필 카드 스타일 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}님의 여행 기록</h2>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">본 에피소드: {recentStories.length}개</span>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">저장한 에피소드: {myStories.length}개</span>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 및 콘텐츠 영역 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'recent' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Clock className="w-5 h-5" />
              <span>최근 본 이야기</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'saved' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <LibraryIcon className="w-5 h-5" />
              <span>내 이야기</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'recent' ? (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">최근 시청 목록</h3>
                {recentStories.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">아직 본 에피소드가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {recentStories.map(renderStoryCard)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">저장된 컬렉션</h3>
                {myStories.length === 0 ? (
                  <div className="text-center py-16">
                    <LibraryIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">저장한 에피소드가 없습니다</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {myStories.map(renderStoryCard)}
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