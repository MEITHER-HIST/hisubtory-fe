import { useState } from "react";
import { line3Stations } from "../data/stations";

type StationDTO = {
  id: number;
  name: string;
  clickable: boolean;
  color: "green" | "gray";
};

interface SubwayMapProps {
  user: { name: string } | null;
  stationByName: Map<string, StationDTO>;
  onPickEpisode: (stationId: number) => void;
}

export function SubwayMap({ user, stationByName, onPickEpisode }: SubwayMapProps) {
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getStationPosition = (index: number) => {
    // 기존 로직 유지(레이아웃)
    if (index <= 15) {
      return { x: 100 + index * 70, y: 100 };
    } else if (index <= 30) {
      return { x: 100 + (30 - index) * 70, y: 250 };
    } else {
      return { x: 100 + (index - 30) * 70, y: 400 };
    }
  };

  const getStationStatus = (stationName: string) => {
    return stationByName.get(stationName)?.color ?? "gray";
  };

  const getStationClickable = (stationName: string) => {
    return stationByName.get(stationName)?.clickable ?? false;
  };

  const handleStationHover = (station: string, event: React.MouseEvent) => {
    setHoveredStation(station);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleStationLeave = () => {
    setHoveredStation(null);
  };

  const handleStationClickInternal = (stationName: string) => {
    const dto = stationByName.get(stationName);
    if (!dto) return;
    if (!dto.clickable) return;

    onPickEpisode(dto.id);
  };

  return (
    <div className="relative w-full bg-white rounded-2xl shadow-lg p-8 overflow-x-auto">
      <svg width="1200" height="650" className="mx-auto">
        {/* 기존 선(3호선) 유지 */}
        <line x1="100" y1="100" x2={100 + 15 * 70} y2="100" stroke="#EF7C1C" strokeWidth="6" />
        <line x1={100 + 15 * 70} y1="100" x2={100 + 15 * 70} y2="250" stroke="#EF7C1C" strokeWidth="6" />
        <line x1={100 + 15 * 70} y1="250" x2="100" y2="250" stroke="#EF7C1C" strokeWidth="6" />
        <line x1="100" y1="250" x2="100" y2="400" stroke="#EF7C1C" strokeWidth="6" />
        <line x1="100" y1="400" x2={100 + 13 * 70} y2="400" stroke="#EF7C1C" strokeWidth="6" />

        {/* 역 마커 */}
        {line3Stations.map((station, index) => {
          const pos = getStationPosition(index);
          const status = getStationStatus(station);
          const isHovered = hoveredStation === station;
          const isClickable = getStationClickable(station);
          const isCorner = index === 15 || index === 16 || index === 30 || index === 31;

          return (
            <g key={station}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 14 : isCorner ? 12 : 10}
                fill={status === "green" ? "#22c55e" : "#9ca3af"}
                stroke="white"
                strokeWidth="4"
                className={`transition-all ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
                onMouseEnter={(e) => handleStationHover(station, e)}
                onMouseLeave={handleStationLeave}
                onClick={() => handleStationClickInternal(station)}
              />

              <text
                x={pos.x}
                y={index <= 15 ? pos.y - 20 : index <= 30 ? pos.y + 30 : pos.y - 20}
                textAnchor="middle"
                className="fill-gray-700 text-xs font-medium"
              >
                {station}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredStation && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-56"
          style={{
            left: tooltipPosition.x - 112,
            top: tooltipPosition.y - 80,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${
                getStationStatus(hoveredStation) === "green" ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <h4 className="text-gray-900">{hoveredStation}역</h4>
          </div>

          <p className="text-gray-600 text-sm">
            {(() => {
              const dto = stationByName.get(hoveredStation);
              if (!dto) return "준비중인 역입니다";
              if (user) return dto.color === "green" ? "이미 방문한 역입니다" : "아직 방문하지 않은 역입니다";
              return "클릭해서 스토리를 볼 수 있어요 (로그인하면 기록 저장)";
            })()}
          </p>

          {getStationClickable(hoveredStation) && (
            <p className="text-xs text-blue-600 mt-2">클릭하여 스토리 보기</p>
          )}
        </div>
      )}
    </div>
  );
}
