import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import SessionsPage from '@/pages/SessionsPage'
import MoviePage from '@/pages/MoviePage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'
import { AuthProvider } from '@/state/auth'
import { ModalsProvider } from '@/state/modals'
import { ToastProvider } from '@/state/toast'

function Providers() {
  return (
    <ToastProvider>
      <ModalsProvider>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </ModalsProvider>
    </ToastProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Providers />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/sessions', element: <SessionsPage /> },
      { path: '/movies/:slug', element: <MoviePage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
