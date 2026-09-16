import { NavLink, Outlet } from 'react-router-dom'

const linkBase = 'rounded-full px-4 py-2 text-[13px] font-semibold transition-colors'
const linkActive = 'bg-[var(--accent)] text-white'
const linkInactive = 'text-[var(--muted)] hover:bg-[var(--tint)]'

/**
 * 페이지 화면들은 이미 각자 bg-[var(--bg)] 등 자기 스타일을 갖고 있어서(승인된 와이어프레임 그대로 유지),
 * 여기서는 상단 메뉴만 얹는다 — 기존 화면 내부에는 손대지 않는다.
 */
export function AppLayout() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-3">
          <span className="heading text-[15px]" style={{ color: 'oklch(30% 0.03 55)' }}>
            부동산 공고 통합
          </span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              공고 리스트
            </NavLink>
            <NavLink
              to="/calculator/lease"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              임대 계산기
            </NavLink>
            <NavLink
              to="/calculator/sale"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            >
              매매·분양 계산기
            </NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  )
}
