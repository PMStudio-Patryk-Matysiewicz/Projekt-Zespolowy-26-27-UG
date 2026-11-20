import { Navigate, type RouteObject } from 'react-router'

import App from './App'
import ProtectedRoute, { LOGIN_PATH } from './auth/ProtectedRoute'
import PlayerLayout from './components/player/PlayerLayout'
import BlackjackSetupPage from './pages/BlackjackSetupPage'
import BlackjackTablePage from './pages/BlackjackTablePage'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'

// One list of routes for the app (createBrowserRouter) and tests (createMemoryRouter).
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: HomePage },
      { path: 'rejestracja', Component: RegisterPage },
      { path: 'logowanie', Component: LoginPage },
      // English alias, so /login from the task description also works.
      { path: 'login', element: <Navigate to={LOGIN_PATH} replace /> },
      {
        // Pages of a logged-in player: anonymous visitors are sent to the login page.
        Component: ProtectedRoute,
        children: [
          {
            // They share the sidebar and the top bar with the balance.
            Component: PlayerLayout,
            children: [
              { path: 'lobby', Component: LobbyPage },
              { path: 'gry/blackjack', Component: BlackjackSetupPage },
            ],
          },
          // The table fills the whole screen: no sidebar.
          { path: 'gry/blackjack/stol', Component: BlackjackTablePage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
