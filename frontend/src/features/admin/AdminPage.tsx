import { useState } from 'react';
import { api } from '../../services/api';

interface UserStat {
  id: number;
  email: string;
  nickname: string;
  created_at: string;
  meal_count: number;
  inbody_count: number;
  fasting_count: number;
}

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserStat[]>([]);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await api.get<UserStat[]>(`/admin/users?pin=${pin}`);
      setUsers(data);
      setIsAuthed(true);
    } catch (err: any) {
      setError('❌ 인가되지 않은 접근입니다 (Invalid PIN)');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--color-primary)' }}>🛡️ Super Admin</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
            관리자 전용 페이지입니다.<br />액세스 코드를 입력해 주세요.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              className="input"
              placeholder="Access Code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold' }}
              autoFocus
            />
            {error && <div style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 600 }}>{error}</div>}
            
            <button type="submit" className="btn btn-primary" disabled={isLoading || !pin}>
              {isLoading ? '확인 중...' : 'ENTER'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalUsers = users.length;
  const totalMeals = users.reduce((sum, u) => sum + u.meal_count, 0);
  const totalInbody = users.reduce((sum, u) => sum + u.inbody_count, 0);
  const totalFasting = users.reduce((sum, u) => sum + u.fasting_count, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', animation: 'fade-in 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--color-primary)', margin: '0 0 8px 0' }}>👑 Super Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>모든 유저 현황 및 서비스 이용 통계</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setIsAuthed(false)} style={{ fontSize: '13px' }}>
          🔒 잠금 (로그아웃)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>총 가입 유저</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalUsers}명</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>총 식단 기록</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{totalMeals}건</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>총 인바디/체중 기록</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5CF6' }}>{totalInbody}건</div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>총 단식 기록</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#F59E0B' }}>{totalFasting}건</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-secondary)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>ID</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>유저(이메일)</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>닉네임</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>식단 횟수</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>인바디 횟수</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>단식 횟수</th>
              <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>가입일</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const d = new Date(u.created_at);
              const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-secondary)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-tertiary)' }}>#{u.id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600 }}>{u.email}</td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{u.nickname}</td>
                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', color: 'var(--color-primary)', textAlign: 'center' }}>{u.meal_count}</td>
                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', color: '#8B5CF6', textAlign: 'center' }}>{u.inbody_count}</td>
                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: 'bold', color: '#F59E0B', textAlign: 'center' }}>{u.fasting_count}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{dateStr}</td>
                </tr>
              );
            })}
            
            {users.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  가입된 유저가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
