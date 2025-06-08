/**
 * App component basic tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import { setupMocks } from './setup.js';

describe('App', () => {
	beforeEach(() => {
		setupMocks();
	});

	it('should render without crashing with valid projectRoot', () => {
		// Simple smoke test to ensure the App component can be instantiated
		expect(() => {
			render(<App projectRoot="/fake/project/root" />);
		}).not.toThrow();
	});

	it('should accept projectRoot prop', () => {
		const { unmount } = render(<App projectRoot="/test/path" />);
		// If we get here without throwing, the component rendered successfully
		expect(true).toBe(true);
		unmount();
	});
});
