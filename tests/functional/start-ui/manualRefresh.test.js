/**
 * Functional tests for start-ui manual refresh functionality
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	updateMockTaskStatus,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Start-UI Manual Refresh', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		// Set up mock file system with initial tasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Test Task 1',
					description: 'First test task',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 2,
					title: 'Test Task 2',
					description: 'Second test task',
					status: 'in-progress',
					priority: 'medium',
					subtasks: []
				}
			]
		});
	});

	afterEach(() => {
		if (app) {
			app.unmount();
		}
		cleanupMockProject(mockProjectRoot);
	});

	test('should update UI when manually refreshed after file change', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		// Wait for initial render
		await delay(200);

		// Verify initial state
		const initialFrame = lastFrame();
		expect(initialFrame).toContain('Pending: 1');
		expect(initialFrame).toContain('In Progress: 1');
		expect(initialFrame).toContain('Test Task 1');
		expect(initialFrame).toContain('Test Task 2');

		// Change task status in file
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// At this point, UI hasn't updated yet
		// Press 'r' to manually refresh
		stdin.write('r');
		await delay(200);

		// Now UI should show updated state
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Pending: 0');
		expect(updatedFrame).toContain('Done: 1');
	});

	test('should reflect multiple file changes on manual refresh', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Make multiple changes
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');
		await updateMockTaskStatus(mockProjectRoot, 2, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Should show all changes
		const frame = lastFrame();
		expect(frame).toContain('In Progress: 1');
		expect(frame).toContain('Done: 1');
		expect(frame).toContain('Pending: 0');
	});

	test('should update view-specific content on manual refresh', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(200);

		// Switch to pending view
		stdin.write('2');
		await delay(100);

		// Should see pending task
		expect(lastFrame()).toContain('Test Task 1');
		expect(lastFrame()).toContain('Pending Tasks (1)');

		// Change task to done
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Pending view should now be empty
		expect(lastFrame()).toContain('No pending tasks');
		expect(lastFrame()).toContain('Pending Tasks (0)');
	});
});