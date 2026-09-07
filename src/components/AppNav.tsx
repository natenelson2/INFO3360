import { Link } from '@tanstack/react-router'

const inactiveClass = 'border-b-2 border-transparent text-slate-700 hover:text-slate-900'
const activeClass =
  'border-b-2 border-sky-600 font-semibold text-sky-800'

/**
 * Shared staff nav for the three static routes in docs/route-map.md.
 * Uses TanStack Router Link (not <a href>) so path types stay checked.
 * Active section is highlighted from the current path for arena wifi glances.
 */
export function AppNav() {
  return (
    <nav
      aria-label="Main"
      className="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium"
    >
      <Link
        to="/"
        className={inactiveClass}
        activeOptions={{ exact: true }}
        activeProps={{ className: activeClass }}
      >
        Home
      </Link>
      <Link
        to="/players"
        className={inactiveClass}
        activeOptions={{ exact: false }}
        activeProps={{ className: activeClass }}
      >
        Players
      </Link>
      <Link
        to="/games"
        className={inactiveClass}
        activeOptions={{ exact: false }}
        activeProps={{ className: activeClass }}
      >
        Games
      </Link>
    </nav>
  )
}
