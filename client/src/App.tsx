import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Host from './pages/Host';
import Join from './pages/Join';
import Buzzer from './pages/Buzzer';
import Career from './pages/Career';
import CareerGame from './pages/CareerGame';
import FreePlay from './pages/FreePlay';
import QRAccess from './pages/QRAccess';
import Admin from './pages/Admin';
import BoardGame from './pages/BoardGame';
import AccessGate from './components/AccessGate';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Page admin : mot de passe séparé */}
      <Route path="/admin" element={<Admin />} />
      {/* /join toujours accessible (point d'entrée QR pour les joueurs) */}
      <Route path="/join/:code?" element={<Join />} />
      {/* Toutes les autres pages protégées */}
      <Route path="/*" element={
        <AccessGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/host/:code" element={<Host />} />
            <Route path="/buzzer/:code" element={<Buzzer />} />
            <Route path="/career" element={<Career />} />
            <Route path="/career/play/:campaignId/:levelId" element={<CareerGame />} />
            <Route path="/free" element={<FreePlay />} />
            <Route path="/board" element={<BoardGame />} />
            <Route path="/qr" element={<QRAccess />} />
          </Routes>
        </AccessGate>
      } />
    </Routes>
  );
}
