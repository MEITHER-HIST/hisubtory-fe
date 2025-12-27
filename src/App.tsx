import { useState } from 'react';
import { MainScreen } from './components/MainScreen';
import { StoryScreen } from './components/StoryScreen';
import { MyPage } from './components/MyPage';
import { LoginModal } from './components/LoginModal';

type Screen = 'main' | 'story' | 'mypage';

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    setUser({ name: username });
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('main');
  };

  const handleStationClick = (stationId: string) => {
    setSelectedStationId(stationId);
    setSelectedEpisodeId(null);
    setCurrentScreen('story');
  };

  const handleRandomStation = (stationId: string, episodeId: string) => {
    setSelectedStationId(stationId);
    setSelectedEpisodeId(episodeId);
    setCurrentScreen('story');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
    setSelectedStationId(null);
    setSelectedEpisodeId(null);
  };

  const handleGoToMyPage = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    setCurrentScreen('mypage');
  };

  const handleEpisodeClick = (episodeId: string) => {
    const episode = require('./data/episodes').episodes.find((ep: any) => ep.id === episodeId);
    if (episode) {
      setSelectedStationId(episode.stationId);
      setSelectedEpisodeId(episodeId);
      setCurrentScreen('story');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {currentScreen === 'main' && (
        <MainScreen 
          user={user}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onStationClick={handleStationClick}
          onRandomStation={handleRandomStation}
          onGoToMyPage={handleGoToMyPage}
        />
      )}
      {currentScreen === 'story' && (
        <StoryScreen
          user={user}
          stationId={selectedStationId}
          episodeId={selectedEpisodeId}
          onBack={handleBackToMain}
        />
      )}
      {currentScreen === 'mypage' && (
        <MyPage
          user={user}
          onBack={handleBackToMain}
          onEpisodeClick={handleEpisodeClick}
        />
      )}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
