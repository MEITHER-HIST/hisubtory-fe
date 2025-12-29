import { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { episodes } from '../data/episodes';
import { Episode } from '../types';
import { getUserProgress, markEpisodeAsViewed, toggleSavedEpisode } from '../utils/localStorage';

interface StoryScreenProps {
  user: { name: string } | null;
  stationId: string | null;
  episodeId: string | null;
  onBack: () => void;
}

// 만화 페이지 데이터 (실제로는 에피소드별로 다를 수 있음)
const storyPages = [
  {
    image: 'https://images.unsplash.com/photo-1763732397784-c5ff2651d40c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21pYyUyMGJvb2slMjBtYW5nYSUyMHBhbmVsfGVufDF8fHx8MTc2NjEyNTMwMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    text: '오래전 이곳은 왕이 거닐던 궁궐이었습니다. 경복궁 앞을 지나는 지하철은 조선시대의 역사와 현대가 만나는 곳입니다.'
  },
  {
    image: 'https://images.unsplash.com/photo-1647700243862-95b7d4defb69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjB0cmFkaXRpb25hbCUyMGFydHxlbnwxfHx8fDE3NjYxMjQ5MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    text: '많은 사람들이 이곳을 지나며 각자의 이야기를 만들어갑니다. 출근길, 퇴근길, 약속을 향해 가는 길. 모든 길이 이곳에서 시작됩니다.'
  },
  {
    image: 'https://images.unsplash.com/photo-1612015313052-c5336ae19098?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwc2VvdWwlMjBjaXR5fGVufDF8fHx8MTc2NjEyNTMwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    text: '과거와 현재가 공존하는 이 역은 서울의 역사를 품고 있습니다. 지하철을 타고 시간여행을 떠나보세요.'
  },
  {
    image: 'https://images.unsplash.com/photo-1757357068575-c532b3b20836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGx1c3RyYXRpb24lMjBzdG9yeSUyMGJvb2t8ZW58MXx8fHwxNzY2MTI1MzAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    text: '이 역의 이야기는 계속됩니다. 당신도 이 역사의 한 페이지를 만들어가는 주인공입니다.'
  }
];

export function StoryScreen({ user, stationId, episodeId, onBack }: StoryScreenProps) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [progress, setProgress] = useState(getUserProgress());

  useEffect(() => {
    if (!stationId) return;

    const stationEpisodes = episodes.filter(ep => ep.stationId === stationId);
    
    if (episodeId) {
      // 특정 에피소드가 지정된 경우
      const episode = episodes.find(ep => ep.id === episodeId);
      if (episode) {
        setCurrentEpisode(episode);
        if (user) {
          markEpisodeAsViewed(episode.id);
          setProgress(getUserProgress());
        }
      }
    } else if (user) {
      // 로그인한 경우: 해당 역의 안 본 에피소드 또는 가장 최근에 본 에피소드
      const viewedInStation = stationEpisodes.filter(ep => 
        progress.viewedEpisodes.includes(ep.id)
      );
      
      if (viewedInStation.length > 0) {
        // 이미 본 에피소드가 있으면 가장 최근 것
        setCurrentEpisode(viewedInStation[viewedInStation.length - 1]);
      } else {
        // 안 본 에피소드 중 첫 번째
        const unviewed = stationEpisodes.filter(ep => 
          !progress.viewedEpisodes.includes(ep.id)
        );
        if (unviewed.length > 0) {
          const episode = unviewed[0];
          setCurrentEpisode(episode);
          markEpisodeAsViewed(episode.id);
          setProgress(getUserProgress());
        } else {
          setCurrentEpisode(stationEpisodes[0]);
        }
      }
    } else {
      // 로그인하지 않은 경우: 랜덤
      const randomEp = stationEpisodes[Math.floor(Math.random() * stationEpisodes.length)];
      setCurrentEpisode(randomEp);
    }
  }, [stationId, episodeId, user]);

  const handleSaveToggle = () => {
    if (!currentEpisode || !user) return;
    toggleSavedEpisode(currentEpisode.id);
    setProgress(getUserProgress());
  };

  const handleNewEpisode = () => {
    if (!stationId || !user) return;
    
    const stationEpisodes = episodes.filter(ep => ep.stationId === stationId);
    const unviewed = stationEpisodes.filter(ep => 
      !progress.viewedEpisodes.includes(ep.id)
    );
    
    if (unviewed.length > 0) {
      const episode = unviewed[0];
      setCurrentEpisode(episode);
      markEpisodeAsViewed(episode.id);
      setProgress(getUserProgress());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast('이 역의 모든 에피소드를 확인했어요!');
    }
  };

  if (!currentEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">에피소드를 불러오는 중...</p>
      </div>
    );
  }

  const isSaved = progress.savedEpisodes.includes(currentEpisode.id);
  const isViewed = progress.viewedEpisodes.includes(currentEpisode.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header - Fixed */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <h1 className="text-blue-600 tracking-wider">HISUBTORY</h1>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-900">{currentEpisode.stationId}</span>
          </div>
        </div>
      </header>

      {/* Story Content - Scrollable */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-gray-900 mb-2">{currentEpisode.title}</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">{currentEpisode.stationId}역</span>
            {isViewed && user && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                ✓ 봤음
              </span>
            )}
          </div>
        </div>

        {/* Comic Pages - 사진-글-사진-글 반복 */}
        {storyPages.map((page, index) => (
          <div key={index} className="mb-6">
            {/* Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="relative h-96 bg-gray-200">
                <img
                  src={page.image}
                  alt={`${currentEpisode.title} - ${index + 1}페이지`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Text */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {page.text}
              </p>
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {user ? (
            <div className="flex gap-3">
              <button
                onClick={handleSaveToggle}
                className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border-2 ${
                  isSaved
                    ? 'bg-blue-50 text-blue-600 border-blue-600 hover:bg-blue-100'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                {isSaved ? '저장됨' : '저장하기'}
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
              <p className="text-amber-800 text-sm text-center">
                💡 로그인하면 에피소드를 저장하고 진행상황을 기록할 수 있어요!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}