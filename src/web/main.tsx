import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserExportAdapter,
  LocalLicenseAdapter,
  LocalStorageAdapter,
  WebSpeechTTSAdapter,
} from '@assistivereader/adapters';
import { AssistiveAppShell } from '@assistivereader/ui';
import '../styles/index.css';

const storage = new LocalStorageAdapter();
const adapters = {
  storage,
  tts: new WebSpeechTTSAdapter(),
  exporter: new BrowserExportAdapter(),
  license: new LocalLicenseAdapter(storage),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AssistiveAppShell adapters={adapters} />
  </React.StrictMode>
);
