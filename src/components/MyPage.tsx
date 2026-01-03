import { ArrowLeft, Bookmark, Check, Clock, Library as LibraryIcon, Users, UserPlus, MessageSquare, X, ChevronRight, Copy, XCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';

interface MyPageProps {
  user: any;
  onBack: () => void;
  onEpisodeClick: (episodeId: string) => void;
}

export function MyPage({ user, onBack, onEpisodeClick }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved' | 'team'>('recent');
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [myStories, setMyStories] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]); // 가입 대기 목록

  const [showForm, setShowForm] = useState<'LEADER' | 'MEMBER' | null>(null);
  const [formData, setFormData] = useState({ 
    team_name: '', 
    applicant_name: '', 
    target_leader_code: '' 
  });

  // 🔵 팀 코드 복사 함수
  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 🟠 팀장용 가입 승인/거절 처리 함수
  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      // await authApi.handleMemberRequest(requestId, action); // API 연동 시 주석 해제
      alert(action === 'APPROVE' ? "승인되었습니다!" : "거절되었습니다.");
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      // fetchAllData(); // 데이터 새로고침
    } catch (error: any) {
      alert("처리 중 오류 발생");
    }
  };

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const historyRes = await fetch("/api/library/history/", { credentials: "include" });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setRecentStories(historyData.recent || []);
        setMyStories(historyData.saved || []);
      }
      const teamRes = await authApi.getTeamInfo();
      if (teamRes?.has_team) {
        setTeamInfo(teamRes);
        // 팀장인 경우 대기 중인 신청 목록도 가져옴 (예시 데이터)
        if (teamRes.is_leader) {
          setPendingRequests(teamRes.pending_members || []);
        }
      } else {
        setTeamInfo({ has_team: false });
      }
    } catch (error) {
      setTeamInfo({ has_team: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [user]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.requestMembership({
        request_type: showForm!,
        team_name: formData.team_name,
        applicant_name: formData.applicant_name,
        target_leader_code: showForm === 'MEMBER' ? formData.target_leader_code : undefined,
      });
      alert("신청이 접수되었습니다.");
      setShowForm(null);
    } catch (error: any) {
      alert(error.message || "오류 발생");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 font-bold tracking-widest uppercase">Loading</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* --- 팀 신청 모달 --- */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleRequestSubmit} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 flex justify-between items-center text-white bg-blue-600">
              <div className="flex items-center gap-2">
                {showForm === 'LEADER' ? '👑' : '🤝'}
                <h3 className="font-bold text-lg">{showForm === 'LEADER' ? '팀장 신청' : '팀원 신청'}</h3>
              </div>
              <button type="button" onClick={() => setShowForm(null)} className="p-1 hover:bg-black/10 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">희망 팀명</label>
                <input className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="팀 이름을 입력하세요" required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} />
              </div>
              {showForm === 'MEMBER' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400">팀장 코드</label>
                  <input className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="8자리 공유 코드 입력" required value={formData.target_leader_code} onChange={e => setFormData({...formData, target_leader_code: e.target.value})} />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">신청자 성함</label>
                <input className="w-full p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="본명을 입력하세요" required value={formData.applicant_name} onChange={e => setFormData({...formData, applicant_name: e.target.value})} />
              </div>
            </div>
            <div className="px-6 pb-8 pt-2">
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all">신청서 제출하기</button>
            </div>
          </form>
        </div>
      )}

      {/* --- 헤더 --- */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 transition-colors">
          <ArrowLeft size={20}/> 돌아가기
        </button>
        <h1 className="text-blue-600 font-black tracking-tighter text-xl uppercase italic">HISUBTORY</h1>
        <div className="w-20"></div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* --- 요약 섹션 --- */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 tracking-tight">{user.name || user.username}님의 활동 요약</h2>
          <div className="flex gap-10">
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={20} />
              <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase">Viewed</span><span className="text-sm font-bold">{recentStories.length}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Bookmark className="text-blue-500" size={20} />
              <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-bold uppercase">Library</span><span className="text-sm font-bold">{myStories.length}</span></div>
            </div>
          </div>
        </div>

        {/* --- 메인 카드 섹션 --- */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
          <div className="flex border-b bg-gray-50/30">
            {(['recent', 'saved', 'team'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400'}`}>
                {tab === 'recent' ? '최근 기록' : tab === 'saved' ? '내 보관함' : '우리 팀'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'recent' && (
              <div className="space-y-3">
                {recentStories.map(ep => (
                  <div key={ep.id} onClick={() => onEpisodeClick(ep.id)} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                    <img src={ep.imageUrl} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-blue-500 uppercase">{ep.stationName}</p>
                      <p className="font-semibold text-gray-800 line-clamp-1">{ep.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="grid grid-cols-2 gap-4">
                {myStories.map(ep => (
                  <div key={ep.id} onClick={() => onEpisodeClick(ep.id)} className="p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-white hover:shadow-md transition-all">
                    <img src={ep.imageUrl} className="w-full aspect-video rounded-lg object-cover mb-2" />
                    <p className="text-[10px] font-bold text-blue-500 uppercase">{ep.stationName}</p>
                    <p className="font-medium text-sm text-gray-800 line-clamp-1">{ep.title}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="animate-in fade-in duration-300">
                {(!teamInfo || teamInfo.has_team === false) ? (
                  <div className="max-w-xs mx-auto space-y-6 text-center py-10">
                    <MessageSquare className="mx-auto text-gray-200" size={48} />
                    <p className="text-gray-500 font-bold">팀이 없습니다. 신청하시겠습니까?</p>
                    <div className="space-y-3">
                      <button onClick={() => setShowForm('LEADER')} className="w-full py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 flex items-center justify-center gap-2 hover:border-blue-600">👑 팀장 신청</button>
                      <button onClick={() => setShowForm('MEMBER')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100">🤝 팀원 신청</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 🔵 팀 헤더 & 코드 복사 섹션 */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                      <div>
                        <p className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-1">TEAM INFO</p>
                        <h3 className="text-3xl font-black text-gray-800 tracking-tighter italic">"{teamInfo.team_name}"</h3>
                      </div>
                      {teamInfo.is_leader && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">JOIN CODE</span>
                            <span className="text-lg font-mono font-black text-indigo-700">{teamInfo.team_code || 'PENDING'}</span>
                          </div>
                          <button onClick={() => handleCopyCode(teamInfo.team_code)} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                            {copied ? '복사됨!' : '코드 복사'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 🟠 [팀장 전용] 대기 중인 신청 목록 */}
                    {teamInfo.is_leader && pendingRequests.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 animate-in zoom-in-95">
                        <div className="flex items-center gap-2 mb-4">
                          <UserPlus className="text-amber-600" size={20} />
                          <h4 className="font-bold text-amber-800">가입 신청 대기</h4>
                        </div>
                        <div className="space-y-3">
                          {pendingRequests.map((req) => (
                            <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-amber-100">
                              <span className="font-bold text-gray-700">{req.applicant_name}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleAction(req.id, 'REJECT')} className="p-2 text-gray-300 hover:text-red-500"><XCircle size={22} /></button>
                                <button onClick={() => handleAction(req.id, 'APPROVE')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors">승인</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 팀원 활동 목록 */}
                    <div className="space-y-10">
                      {teamInfo.members_data?.map((member: any) => (
                        <div key={member.username} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-6 font-bold">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${member.is_leader ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                              {member.username[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col leading-none">
                              <span className="text-gray-800">{member.username} {member.is_leader && "👑"}</span>
                              <span className="text-[10px] text-gray-400 uppercase mt-1">{member.is_leader ? 'Leader' : 'Member'}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {member.bookmarks?.map((ep: any) => (
                              <img key={ep.id} src={ep.imageUrl} className="aspect-[3/4] rounded-xl object-cover shadow-sm hover:scale-105 transition-all cursor-pointer" onClick={() => onEpisodeClick(ep.id)} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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