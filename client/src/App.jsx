import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Host from './pages/Host';
import Player from './pages/Player';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/host" element={<Host />} />
        <Route path="/player/:roomId" element={<Player />} />
      </Routes>
    </Router>
  );
}

export default App;
