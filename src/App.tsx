import { Route, Routes } from 'react-router-dom'
import Chapter from './pages/Chapter'
import Hub from './pages/Hub'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/signal/:slug" element={<Chapter />} />
      <Route path="*" element={<Hub />} />
    </Routes>
  )
}
