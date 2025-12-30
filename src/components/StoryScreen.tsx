import React, { useEffect, useState } from 'react';
import { fetchStationStory } from '../api/history';
import { StoryData } from '../types/history';
import '../styles/globals.css';

interface StoryScreenProps {
  // App.tsx에서 넘겨주는 타입에 맞춰 number | string으로 확장
  stationId: number | string | null; 
  onBack: () => void;
  user?: { name: string } | null; // App.tsx에서 넘겨주는 user prop 추가 (필요시)
  episodeId?: string | null;      // App.tsx에서 넘겨주는 episodeId 추가 (필요시)
}

const StoryScreen: React.FC<StoryScreenProps> = ({ stationId, onBack }) => {
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStoryData = async () => {
      if (!stationId) return;

      console.log("백엔드 요청 ID/이름:", stationId);
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchStationStory(stationId);
        setStory(data);
      } catch (err: any) {
        console.error("데이터 로딩 에러:", err);
        setError("이야기를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadStoryData();
  }, [stationId]);

  if (loading) return <div className="p-10 text-center">이야기를 찾는 중...</div>;
  if (error) return (
    <div className="p-10 text-center text-red-500">
      {error}
      <button onClick={onBack} className="block mx-auto mt-4 px-4 py-2 bg-gray-200 rounded">돌아가기</button>
    </div>
  );
  if (!story) return (
    <div className="p-10 text-center">
      이 역에는 아직 이야기가 없습니다.
      <button onClick={onBack} className="block mx-auto mt-4 px-4 py-2 bg-gray-200 rounded">돌아가기</button>
    </div>
  );

  return (
    <div className="story-screen-container max-w-4xl mx-auto bg-white min-h-screen shadow-md">
      {/* 상단 헤더 영역 */}
      <header className="story-header flex items-center p-4 border-b sticky top-0 bg-white z-10">
        <button onClick={onBack} className="mr-4 text-2xl">←</button>
        <div>
          <h1 className="text-xl font-bold">{story.title}</h1>
          <h2 className="text-sm text-gray-500">{story.subtitle}</h2>
        </div>
      </header>

      {/* 역사 요약 설명 */}
      <section className="story-summary-section p-6 bg-amber-50">
        <div className="summary-box">
          <h3 className="font-bold mb-2">역사 요약</h3>
          <p className="leading-relaxed text-gray-800">{story.history_summary}</p>
        </div>
      </section>

      {/* 웹툰 컷 리스트 렌더링 */}
      <section className="story-cuts-section p-4 space-y-8">
        {story.cuts && story.cuts.length > 0 ? (
          story.cuts.map((cut, index) => (
            <div key={cut.cut_id || index} className="cut-wrapper border-b pb-8">
              <img 
                src={cut.image_url} 
                alt={`시나리오 컷 ${cut.cut_order}`} 
                className="w-full h-auto rounded-lg shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=이미지를+불러올+수+없습니다';
                }}
              />
              {cut.caption && (
                <div className="mt-4 p-4 bg-gray-50 rounded border-l-4 border-amber-400">
                  <p className="cut-caption text-lg text-gray-700">{cut.caption}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-20 text-gray-400">이미지 준비 중입니다.</p>
        )}
      </section>

      {/* 출처 정보 */}
      {story.source_url && (
        <footer className="p-8 text-center border-t">
          <a 
            href={story.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            출처: {story.source_name || '확인하기'}
          </a>
        </footer>
      )}
    </div>
  );
};

export default StoryScreen;