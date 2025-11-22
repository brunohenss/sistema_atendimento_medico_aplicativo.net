import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import FilaAtendimento from './pages/FilaAtendimento';
import Pacientes from './pages/Pacientes';
import Triagem from './pages/Triagem';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<FilaAtendimento />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/triagem" element={<Triagem />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
}

export default App;