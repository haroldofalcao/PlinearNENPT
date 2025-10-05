import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup após cada teste
afterEach(() => {
    cleanup();
});

// Mock do Firebase Analytics para testes
vi.mock('@/lib/firebase', () => ({
    app: {},
    analytics: null,
}));

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackFormulaExport: vi.fn(),
    trackFormulaImport: vi.fn(),
    trackFormulaCreated: vi.fn(),
    trackFormulaEdited: vi.fn(),
    trackFormulaDeleted: vi.fn(),
    trackOptimizationStarted: vi.fn(),
    trackOptimizationCompleted: vi.fn(),
    trackOptimizationFailed: vi.fn(),
    trackOptimizationDetailsViewed: vi.fn(),
}));
