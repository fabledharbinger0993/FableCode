import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import { AppShell } from './AppShell';
import { HubPage } from './pages/HubPage';
import { AlkemistPage } from './labs/alkemist';
import { LogixPage } from './labs/logix';
import { PreviewPage } from './pages/PreviewPage';
import { ScribePage } from './labs/scribe';
// Tesseract owns Three.js + @react-three/fiber + drei (~500 KB).
// Lazy-loaded so the initial bundle stays light on iPad Safari.
const TesseractPage = lazy(() => import('./labs/tesseract').then((m) => ({ default: m.TesseractPage })));
import { registerServiceWorker } from './registerServiceWorker';
import './styles.css';

registerServiceWorker();

function DesignFallback() {
  return (
    <div style={{ padding: '2rem', color: '#eceff4', display: 'grid', placeItems: 'center', height: '100%' }}>
      Loading Tesseract...
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
            <Route path="/alkemist" element={<AlkemistPage />} />
            <Route path="/scribe" element={<ScribePage />} />
            <Route path="/logix" element={<LogixPage />} />
            <Route
              path="/tesseract"
              element={
                <Suspense fallback={<DesignFallback />}>
                  <TesseractPage />
                </Suspense>
              }
            />
            <Route path="/build" element={<AlkemistPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/blocks" element={<LogixPage />} />
            <Route path="/school" element={<ScribePage />} />
            <Route
              path="/design"
              element={
                <Suspense fallback={<DesignFallback />}>
                  <TesseractPage />
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
