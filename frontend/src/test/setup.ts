import '@testing-library/jest-dom';

// Mock HTMLCanvasElement getContext for JSDOM test environments
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
