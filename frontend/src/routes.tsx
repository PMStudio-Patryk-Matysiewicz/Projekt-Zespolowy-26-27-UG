import type { RouteObject } from 'react-router'

import App from './App'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

// One list of routes for the app (createBrowserRouter) and tests (createMemoryRouter).
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: App,
    children: [
      { index: true, Component: HomePage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]
