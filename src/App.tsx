import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Hub from './pages/Hub'
import { startSmoothScroll } from './scroll/smoothScroll'

// Chapters pull in the 3D viewer, so they load separately from the start page.
const Chapter = lazy(() => import('./pages/Chapter'))

export default function App() {
  useEffect(() => startSmoothScroll(), [])

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-basalt" />}>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/signal/:slug" element={<Chapter />} />
        <Route path="*" element={<Hub />} />
      </Routes>
    </Suspense>
  )
}
