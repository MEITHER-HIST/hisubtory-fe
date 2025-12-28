import { useState } from 'react';
import { line3Stations } from '../data/stations';
import { episodes } from '../data/episodes';
import { getUserProgress } from '../utils/localStorage';

interface SubwayMapProps {
  user: { name: string } | null;
  onStationClick: (stationId: string) => void;
}

export function SubwayMap({ user, onStationClick }: SubwayMapProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const progress = getUserProgress();

  const getStationStatus = (stationName: string) => {
    if (!user) return 'gray';
    
    const stationEpisodes = episodes.filter(ep => ep.stationId === stationName);
    const viewedCount = stationEpisodes.filter(ep => 
      progress.viewedEpisodes.includes(ep.id)
    ).length;
    
    if (viewedCount > 0) return 'green';
    return 'gray';
  };

  // 3호선을 가로 3줄로 배치
  // 첫째 줄: 대화 ~ 녹번 (0-15번 인덱스)
  // 둘째 줄: 홍제 ~ 잠원 (16-30번 인덱스)
  // 셋째 줄: 고속터미널 ~ 오금 (31-44번 인덱스)
  const getStationPosition = (index: number) => {
    const xStep = 70;
    const yGap = 200;
    
    if (index <= 15) {
      // 첫째 줄 (대화 ~ 녹번)
      return {
        x: 100 + index * xStep,
        y: 100
      };
    } else if (index <= 30) {
      // 둘째 줄 (홍제 ~ 잠원) - 역순으로 오른쪽에서 왼쪽
      const lineIndex = index - 16;
      return {
        x: 100 + (15 * xStep) - lineIndex * xStep,
        y: 100 + yGap
      };
    } else {
      // 셋째 줄 (고속터미널 ~ 오금)
      const lineIndex = index - 31;
      return {
        x: 100 + lineIndex * xStep,
        y: 100 + yGap * 2
      };
    }
  };

  const handleStationHover = (station: string, event: React.MouseEvent) => {
    setHoveredStation(station);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleStationLeave = () => {
    setHoveredStation(null);
  };

  const handleStationClickInternal = (station: string) => {
    if (user) {
      onStationClick(station);
    }
  };

  return (
    <div className="relative w-full bg-white rounded-2xl shadow-lg p-8 overflow-x-auto">
      <svg width="1200" height="650" className="mx-auto">
        {/* 첫째 줄 라인 (대화 ~ 녹번) */}
        <line
          x1="100"
          y1="100"
          x2={100 + 15 * 70}
          y2="100"
          stroke="#EF7C1C"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* 연결 라인 1 (녹번 -> 홍제) */}
        <line
          x1={100 + 15 * 70}
          y1="100"
          x2={100 + 15 * 70}
          y2="300"
          stroke="#EF7C1C"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* 둘째 줄 라인 (홍제 ~ 잠원) */}
        <line
          x1={100 + 15 * 70}
          y1="300"
          x2={100}
          y2="300"
          stroke="#EF7C1C"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* 연결 라인 2 (잠원 -> 고속터미널) */}
        <line
          x1="100"
          y1="300"
          x2="100"
          y2="500"
          stroke="#EF7C1C"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* 셋째 줄 라인 (고속터미널 ~ 오금) */}
        <line
          x1="100"
          y1="500"
          x2={100 + 13 * 70}
          y2="500"
          stroke="#EF7C1C"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* 역 마커 */}
        {line3Stations.map((station, index) => {
          const pos = getStationPosition(index);
          const status = getStationStatus(station);
          const isHovered = hoveredStation === station;
          const isClickable = user;
          const isCorner = index === 15 || index === 16 || index === 30 || index === 31;

          return (
            <g key={station}>
              {/* 역 원형 마커 */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 14 : (isCorner ? 12 : 10)}
                fill={status === 'green' ? '#22c55e' : '#9ca3af'}
                stroke="white"
                strokeWidth="4"
                className={`transition-all ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onMouseEnter={(e) => handleStationHover(station, e)}
                onMouseLeave={handleStationLeave}
                onClick={() => handleStationClickInternal(station)}
              />
              
              {/* 역 이름 */}
              <text
                x={pos.x}
                y={
                  index <= 15
                    ? pos.y - 20
                    : index <= 30
                    ? pos.y + 30
                    : pos.y + 30
                }
                textAnchor="middle"
                className="text-xs select-none pointer-events-none"
                fill={isHovered ? '#2563eb' : '#374151'}
                fontWeight={isHovered ? 'bold' : 'normal'}
              >
                {station}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredStation && (
        <div 
          className="fixed bg-white border-2 border-blue-400 rounded-lg shadow-xl p-4 w-64 z-50"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              getStationStatus(hoveredStation) === 'green' ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <h4 className="text-gray-900">{hoveredStation}역</h4>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {user 
              ? getStationStatus(hoveredStation) === 'green'
                ? '이미 방문한 역입니다'
                : '아직 방문하지 않은 역입니다'
              : '로그인하고 역사를 탐험하세요'}
          </p>
          <div className="text-xs text-gray-500">
            에피소드 수: {episodes.filter(ep => ep.stationId === hoveredStation).length}개
          </div>
          {user && (
            <p className="text-xs text-blue-600 mt-2">클릭하여 스토리 보기</p>
          )}
        </div>
      )}
    </div>
  );
}
