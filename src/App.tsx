import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Hub from './pages/Hub'

// Chapters pull in the 3D viewer, so they load separately from the start page.
const Chapter = lazy(() => import('./pages/Chapter'))
const DevFrames = import.meta.env.DEV ? lazy(() => import('./pages/DevFrames')) : null

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-basalt" />}>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/signal/:slug" element={<Chapter />} />
        {DevFrames && <Route path="/dev/frames" element={<DevFrames />} />}
        <Route path="*" element={<Hub />} />
      </Routes>
    </Suspense>
  )
}
