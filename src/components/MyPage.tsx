import { ArrowLeft, Bookmark, Check, Clock, Library } from 'lucide-react';
import { episodes } from '../data/episodes';
import { getUserProgress } from '../utils/localStorage';
import { useState } from 'react';

interface MyPageProps {
  user: { name: string } | null;
  onBack: () => void;
  onEpisodeClick: (episodeId: string) => void;
}

export function MyPage({ user, onBack, onEpisodeClick }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const progress = getUserProgress();
  const savedEpisodes = episodes.filter(ep => progress.savedEpisodes.includes(ep.id));
  const viewedEpisodes = episodes.filter(ep => progress.viewedEpisodes.includes(ep.id));
  const recentEpisodes = [...viewedEpisodes].reverse().slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 tracking-wider">HISUBTORY</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info */}
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'recent'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>최근 본 이야기</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'saved'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Library className="w-5 h-5" />
              <span>내 이야기</span>
            </button>
          </div>

          <div className="p-6">
            {/* Recent Episodes Tab */}
            {activeTab === 'recent' && (
              <div>
                <h3 className="text-gray-900 mb-4">최근 본 이야기</h3>
                {recentEpisodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">아직 본 에피소드가 없습니다</p>
                    <p className="text-gray-400 text-sm mt-2">역사 스토리를 탐험해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentEpisodes.map((episode, index) => (
                      <button
                        key={episode.id}
                        onClick={() => onEpisodeClick(episode.id)}
                        className="w-full flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={episode.imageUrl}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-gray-600 text-sm">{episode.stationId}</span>
                          </div>
                          <p className="text-gray-900">{episode.title}</p>
                        </div>
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Episodes Tab (Library) */}
            {activeTab === 'saved' && (
              <div>
                <h3 className="text-gray-900 mb-4">내 이야기</h3>
                {savedEpisodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Library className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">저장한 에피소드가 없습니다</p>
                    <p className="text-gray-400 text-sm mt-2">에피소드를 보고 저장 버튼을 눌러보세요!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedEpisodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => onEpisodeClick(episode.id)}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                          <img
                            src={episode.imageUrl}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-600 text-sm">{episode.stationId}</span>
                        </div>
                        <h4 className="text-gray-900">{episode.title}</h4>
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {episode.content}
                        </p>
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