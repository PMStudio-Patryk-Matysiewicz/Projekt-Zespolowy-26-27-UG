import type { RouteObject } from 'react-router'

import App from './App'
import PlayerLayout from './components/player/PlayerLayout'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import NotFoundPage from './pages/NotFoundPage'

// One list of routes for the app (createBrowserRouter) and tests (createMemoryRouter).
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: HomePage },
      {
        // Pages of a logged-in player share the sidebar and the top bar with the balance.
        Component: PlayerLayout,
        children: [{ path: 'lobby', Component: LobbyPage }],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
