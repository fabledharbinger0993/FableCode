/// <reference types="vite/client" />

import type { FableApi } from '../shared/types';

declare global {
  interface Window {
    fable: FableApi;
  }

  var fable: FableApi;
}
