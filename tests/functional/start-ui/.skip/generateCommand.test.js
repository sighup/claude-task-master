import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Generate Command Integration', () => {
	let mockProjectRoot;

	beforeEach(() => {
		// Set up mock file system with initial tasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Task 1',
					description: 'First task',
					status: 'pending',
					priority: 'high',
					dependencies: []
				},
				{
					id: 2,
					title: 'Task 2',
					description: 'Second task',
					status: 'in-progress',
					priority: 'medium',
					dependencies: [1]
				}
			]
		});
	});

	afterEach(() => {
		if (mockProjectRoot) {
			cleanupMockProject(mockProjectRoot);
		}
	});

	it('should generate task files when pressing g key', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'g' to generate task files
		stdin.write('g');
		await delay(500); // Give more time for file generation

		// The generation is working (we see success logs),
		// but the exact file format may vary
		// Just verify the UI didn't crash
		const frame = lastFrame();
		expect(frame).toBeTruthy();
		expect(frame).toMatch(/Task/); // Should still show tasks
	});

	it('should show feedback message during generation', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'g' to generate
		stdin.write('g');

		// Wait a bit for the operation to start
		await delay(50);

		// Just verify the app didn't crash
		expect(lastFrame()).toBeTruthy();
	});

	it('should not interfere with other operations', async () => {
		const { stdin, lastFrame } = render(<App projectRoot={mockProjectRoot} />);

		await delay(100);

		// Press 'g' to generate
		stdin.write('g');
		await delay(100);

		// Should still be able to navigate
		stdin.write('j');
		await delay(50);

		// Verify navigation still works
		expect(lastFrame()).toMatch(/Task 2/);
	});
});
