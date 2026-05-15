import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import { AppShell } from './AppShell';
import { HubPage } from './pages/HubPage';
import { BuildPage } from './pages/BuildPage';
import { BlocksPage } from './pages/BlocksPage';
import { PreviewPage } from './pages/PreviewPage';
import { SchoolPage } from './pages/SchoolPage';
import { DesignPage } from './pages/DesignPage';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <AppContextProvider>
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route element={<AppShell />}>
            <Route path="/build" element={<BuildPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/blocks" element={<BlocksPage />} />
            <Route path="/school" element={<SchoolPage />} />
            <Route path="/design" element={<DesignPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppContextProvider>
    </HashRouter>
  </React.StrictMode>
);
