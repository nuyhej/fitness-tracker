import FastingTimer from '../../components/Timer/FastingTimer';

export default function TimerPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
          ⏱️ 찐fit <span className="gradient-text">간헐적 단식 타이머</span>
        </h2>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>
          인슐린 감수성을 복원하고 몸이 스스로 지방을 태우는 스위치온 대사 모드를 실시간 가동합니다.
        </p>
      </div>

      <FastingTimer onFastingEnd={() => {}} />

      <div className="glass-card" style={{ padding: '24px', background: 'rgba(20, 25, 33, 0.5)', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-primary-400)' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-primary-400)' }}>
          💡 스위치온 16:8 공복 준수 꿀팁
        </h4>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>
            <strong>수분 섭취는 충분히</strong>: 공복 시간 동안 칼로리와 당이 전혀 없는 생수, 블랙커피, 허브티는 얼마든지 마셔도 대사가 유지됩니다.
          </li>
          <li>
            <strong>16시간을 마친 뒤 첫 끼니</strong>: 공복을 깬 직후 고혈당 음식(빵, 흰쌀밥, 단 음료)을 먹으면 혈당 스파이크가 오기 쉽습니다. 단백질 쉐이크나 계란, 야채 샐러드로 부드럽게 대사를 깨우세요!
          </li>
          <li>
            <strong>기본 단식 시간 변경</strong>: 상단 메뉴의 [⚙️ 설정] 으로 이동하시면 본인에게 알맞은 목표 공복 시간(12시간, 16시간, 18시간, 24시간 등)을 언제든 맞춤 지정할 수 있습니다.
          </li>
        </ul>
      </div>
    </div>
  );
}
