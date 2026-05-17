import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import { AppShell } from './AppShell';
import { HubPage } from './pages/HubPage';
import { BuildPage } from './pages/BuildPage';
import { BlocksPage } from './pages/BlocksPage';
import { PreviewPage } from './pages/PreviewPage';
import { SchoolPage } from './pages/SchoolPage';
// DesignPage owns Three.js + @react-three/fiber + drei (~500 KB).
// Lazy-loaded so the initial bundle stays light on iPad Safari.
const DesignPage = lazy(() => import('./pages/DesignPage').then((m) => ({ default: m.DesignPage })));
import { registerServiceWorker } from './registerServiceWorker';
import './styles.css';

registerServiceWorker();

function DesignFallback() {
  return (
    <div style={{ padding: '2rem', color: '#eceff4', display: 'grid', placeItems: 'center', height: '100%' }}>
      Loading Design Space…
    </div>
  );
}

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
            <Route
              path="/design"
              element={
                <Suspense fallback={<DesignFallback />}>
                  <DesignPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppContextProvider>
    </HashRouter>
  </React.StrictMode>
);
