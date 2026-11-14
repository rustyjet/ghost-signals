import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Hub from './pages/Hub'

// Chapters pull in the 3D viewer, so they load separately from the start page. Once the start page is idle the
// chunk is fetched in the background, so "Hear its story" opens without a wait.
const loadChapter = () => import('./pages/Chapter')
const Chapter = lazy(loadChapter)
if (typeof window !== 'undefined') {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 2500))
  window.addEventListener('load', () => idle(() => void loadChapter()), { once: true })
}
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
