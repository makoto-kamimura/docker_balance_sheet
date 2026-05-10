import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// import.meta.env.VITE_API_URL のモック
// (テスト時は実際の API には到達せず、fetch をモックする前提)
Object.defineProperty(globalThis, 'import.meta', {
  value: { env: { VITE_API_URL: 'http://localhost:8000/api' } },
});
