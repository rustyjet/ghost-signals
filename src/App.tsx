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
const Play = lazy(() => import('./pages/Play'))
const PlayGame = lazy(() => import('./pages/PlayGame'))
const DevFrames = import.meta.env.DEV ? lazy(() => import('./pages/DevFrames')) : null

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-basalt" />}>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/signal/:slug" element={<Chapter />} />
        <Route path="/play" element={<Play />} />
        <Route path="/play/:slug" element={<PlayGame />} />
        {DevFrames && <Route path="/dev/frames" element={<DevFrames />} />}
        <Route path="*" element={<Hub />} />
      </Routes>
    </Suspense>
  )
}
