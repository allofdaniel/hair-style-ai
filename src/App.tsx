import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Camera from './pages/Camera';
import StyleSelect from './pages/StyleSelect';
import Processing from './pages/Processing';
import Result from './pages/Result';
import Settings from './pages/Settings';
import History from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/style-select" element={<StyleSelect />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/result" element={<Result />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
