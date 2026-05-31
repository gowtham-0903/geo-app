import '@testing-library/jest-dom';

// Stub image imports (logo PNG etc.)
vi.mock('../../logo/GEO LOGO.png', () => ({ default: '/geo-logo.png' }));

// Suppress noisy console.error from React in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('ReactDOM.render'))
    ) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
