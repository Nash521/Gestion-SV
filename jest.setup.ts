import '@testing-library/jest-dom'

// Mock Lucide React to avoid ESM issues
jest.mock('lucide-react', () => ({
    PanelLeft: () => null,
    // Add other icons if needed by other tests, or use a Proxy for generic handling
    __esModule: true,
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
