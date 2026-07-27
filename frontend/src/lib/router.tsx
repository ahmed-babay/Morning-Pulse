import type { ReactNode } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

export function RouterProvider({ children }: { children: ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>
}

export function RouteViewport({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <div key={location.pathname}>{children}</div>
}
