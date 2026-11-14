import { Route, Routes } from 'react-router-dom'
import Hub from './pages/Hub'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="*" element={<Hub />} />
    </Routes>
  )
}
