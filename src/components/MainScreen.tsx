import { useState } from 'react';
import { Shuffle, User, Menu, ChevronDown } from 'lucide-react';
import { episodes } from '../data/episodes';
import { getUserProgress } from '../utils/localStorage';
import { SubwayMap } from './SubwayMap';

interface MainScreenProps {
  user: { name: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onStationClick: (stationId: string) => void;
  onRandomStation: (stationId: string, episodeId: string) => void;
  onGoToMyPage: () => void;
}

export function MainScreen({ user, onLoginClick, onLogout, onStationClick, onRandomStation, onGoToMyPage }: MainScreenProps) {
  const [isLineDropdownOpen, setIsLineDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const progress = getUserProgress();

  const handleRandomStation = () => {
    if (user) {
      // 로그인한 경우: 안 본 에피소드 중에서 랜덤
      const unviewedEpisodes = episodes.filter(ep => 
        !progress.viewedEpisodes.includes(ep.id)
      );
      
      if (unviewedEpisodes.length > 0) {
        const randomEp = unviewedEpisodes[Math.floor(Math.random() * unviewedEpisodes.length)];
        onRandomStation(randomEp.stationId, randomEp.id);
      } else {
        // 모두 봤으면 전체에서 랜덤
        const randomEp = episodes[Math.floor(Math.random() * episodes.length)];
        onRandomStation(randomEp.stationId, randomEp.id);
      }
    } else {
      // 로그인하지 않은 경우: 전체에서 랜덤
      const randomEp = episodes[Math.floor(Math.random() * episodes.length)];
      onRandomStation(randomEp.stationId, randomEp.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Hamburger Menu - Left */}
          <div className="relative">
            <button
              onMouseEnter={() => setIsLineDropdownOpen(true)}
              onMouseLeave={() => setIsLineDropdownOpen(false)}
              className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="노선 선택"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {isLineDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                onMouseEnter={() => setIsLineDropdownOpen(true)}
                onMouseLeave={() => setIsLineDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm text-gray-500">노선 선택</p>
                </div>
                <button 
                  className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>3호선</span>
                </button>
                {['1호선', '2호선', '4호선', '5호선', '6호선', '7호선', '8호선', '9호선'].map((line) => (
                  <button
                    key={line}
                    disabled
                    className="w-full px-4 py-3 text-left text-gray-400 cursor-not-allowed flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>{line} (준비중)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title - Center */}
          <h1 className="absolute left-1/2 transform -translate-x-1/2 text-blue-600 tracking-wider">
            HISUBTORY
          </h1>

          {/* Right Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{user.name}님</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        onGoToMyPage();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      마이페이지
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <User className="w-4 h-4" />
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="text-center mb-6">
          <h2 className="text-gray-900 mb-2">서울 지하철 3호선 역사 여행</h2>
          <p className="text-gray-600">역을 클릭하거나 랜덤으로 선택해서 역사 스토리를 탐험하세요</p>
        </div>

        {/* Subway Map */}
        <div className="mb-6">
          <SubwayMap user={user} onStationClick={onStationClick} />
          
          {!user && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm text-center">
                💡 로그인하면 역 마커를 클릭해서 스토리를 볼 수 있어요!
              </p>
            </div>
          )}
        </div>

        {/* Random Station Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-gray-900 mb-4">랜덤 역 선정</h3>
          <button
            onClick={handleRandomStation}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Shuffle className="w-5 h-5" />
            랜덤 역 뽑기
          </button>
          <p className="text-gray-500 text-sm mt-3 text-center">
            {user 
              ? '아직 안 본 에피소드 중에서 랜덤으로 선택됩니다'
              : '전체 역 중에서 랜덤으로 선택됩니다'
            }
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © 2025 HISUBTORY. 서울 지하철 3호선 역사 탐험 프로젝트
        </div>
      </footer>
    </div>
  );
}
