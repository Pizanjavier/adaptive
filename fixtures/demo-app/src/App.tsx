import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Exploration from './pages/Exploration';
import EditorPage from './pages/Editor';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/3d" element={<Exploration />} />
            <Route path="/editor" element={<EditorPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
