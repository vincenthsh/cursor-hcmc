import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '@/components/LandingPage'
import Lobby from '@/components/Lobby'
import GameRouter from '@/components/GameRouter'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/game/:roomCode" element={<GameRouter />} />
      </Routes>
    </Router>
  )
}

export default App