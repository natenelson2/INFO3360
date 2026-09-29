import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState } from 'react'

import { AppNav } from '../components/AppNav'
import appCss from '../styles.css?url'

/**
 * __root.tsx = the top-level layout route for the whole app.
 * Child pages (home, players, games, …) render inside <Outlet />.
 * Do not put player tables or fetch logic here — that belongs in later route steps.
 */
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        // Matches product naming from docs/requirements-brief.md
        title: 'Hockey Ops Player Directory',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  // Visible chrome shared by every page (header + child route outlet)
  component: RootLayout,
  // Document shell required by TanStack Start (html/body + scripts)
  shellComponent: RootDocument,
})

function RootLayout() {
  // One QueryClient per app session so scouting useQuery / useMutation share cache.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <p className="text-lg font-semibold tracking-tight">
            Hockey Ops Directory
          </p>
          <p className="text-sm text-slate-600">
            Staff player directory and schedule shells for arena wifi use.
          </p>
        </header>

        {/* Persistent nav above the outlet so it stays on every static page */}
        <AppNav />

        <main className="px-6 py-6">
          {/* Child routes render here: /, /players, /players/$playerId, /games, /scouting/* */}
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}