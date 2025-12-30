// 마이페이지 등에서 사용하는 기존 인터페이스 유지
export interface Episode {
  id: number;
  station_name: string;
  image_url: string; // S3 이미지 경로
  viewed_at: string;
}

export interface MyPageResponse {
  recent_episodes: Episode[];
  saved_episodes: Episode[];
}

// DB의 stories_episodeimage 테이블 데이터를 백엔드가 가공해서 보내주는 형태
export interface Cut {
  cut_id: number;     // DB의 id 필드가 API에서 cut_id로 올 경우
  cut_order: number;  // 컷 순서
  image_url: string;  // DB의 image 필드가 API에서 S3 URL로 변환되어 옴
  caption: string;    // DB의 caption 필드
  created_at: string; // DB의 created_at 필드
}

// 전체 스토리(에피소드) 데이터 구조
export interface StoryData {
  episode_id: number;
  webtoon: number;        // 웹툰 ID
  episode_num: number;    // 에피소드 번호
  subtitle: string;       // 에피소드 제목
  history_summary: string; // 역사 요약 내용
  source_url: string | null; // 출처 링크
  is_published: boolean;
  cuts: Cut[];            // 연결된 이미지 리스트
}